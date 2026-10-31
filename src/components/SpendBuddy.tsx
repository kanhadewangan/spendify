import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

// Direct import: the ui barrel re-exports TabBar, which renders this component.
import { Text } from './ui/Text';

import { formatINR } from '@/lib/format';
import { bouncySpring, ease, popIn, reducedExit } from '@/lib/motion';
import { TODAY } from '@/lib/seed';
import { onDay, sum } from '@/lib/selectors';
import { useHydrated, useStore } from '@/lib/store';
import { useTheme } from '@/lib/ThemeProvider';
import { radius, type ColorToken } from '@/lib/theme';

export const BUDDY = 44;

type Mood = 'happy' | 'ok' | 'worried' | 'over';

// Same thresholds as the Home limit bar: orange from 85 %, red past 100 %.
const moodFor = (used: number): Mood =>
  used > 1 ? 'over' : used >= 0.85 ? 'worried' : used >= 0.5 ? 'ok' : 'happy';

const RANK: Record<Mood, number> = { happy: 0, ok: 1, worried: 2, over: 3 };

const BODY: Record<Mood, ColorToken> = {
  happy: 'tint',
  ok: 'tint',
  worried: 'orange',
  over: 'red',
};

const MOUTH: Record<Mood, string> = {
  happy: 'M15 26Q22 33 29 26',
  ok: 'M16 27Q22 30 28 27',
  worried: 'M16 29Q19 26.5 22 29T28 29',
  over: 'M16 31Q22 25 28 31',
};

const haptic = (mood: Mood, crossed: boolean) => {
  if (Platform.OS === 'web') return;
  if (crossed && mood === 'over') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  else if (crossed && mood === 'worried')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function Face({ mood }: { mood: Mood }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const blink = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    blink.set(
      withRepeat(
        withDelay(
          3200,
          withSequence(withTiming(0.1, { duration: 80 }), withTiming(1, { duration: 120 }))
        ),
        -1
      )
    );
  }, [blink, reduced]);

  const eyes = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.get() }] }));
  const eye = mood === 'over' ? 4 : 3;

  return (
    <View style={styles.face}>
      <Svg width={BUDDY} height={BUDDY} viewBox="0 0 44 44">
        <Circle cx={22} cy={22} r={21} fill={c[BODY[mood]]} />
        <Path
          d={MOUTH[mood]}
          stroke={c.black}
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
        />
        {mood === 'worried' && <Path d="M36 7Q39.5 12.5 36 14.5Q32.5 12.5 36 7Z" fill={c.cyan} />}
      </Svg>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, eyes]}>
        {[15.5, 28.5].map((x) => (
          <View
            key={x}
            style={[
              styles.eye,
              {
                left: x - eye,
                top: 18 - eye,
                width: eye * 2,
                height: eye * 2,
                borderRadius: eye,
                backgroundColor: c.black,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

// A little companion perched on the tab bar. Its face follows today's spend against the daily
// limit; it hops and comments on every new spend, and shakes when the limit gets close or breaks.
export function SpendBuddy() {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const expenses = useStore((s) => s.expenses);
  const limit = useStore((s) => s.settings.dailyLimit);

  const total = useMemo(() => sum(onDay(expenses, TODAY)), [expenses]);
  const used = limit ? total / limit : 0;
  const mood = moodFor(used);
  const left = limit - total;

  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout>>(undefined);
  const seen = useRef<Set<string> | null>(null);
  const lastMood = useRef(mood);

  const bob = useSharedValue(0);
  const hop = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    bob.set(
      withRepeat(
        withSequence(
          withTiming(-3, { duration: 1400, easing: ease }),
          withTiming(0, { duration: 1400, easing: ease })
        ),
        -1
      )
    );
  }, [bob, reduced]);

  const say = (text: string) => {
    clearTimeout(hide.current);
    setMessage({ id: Date.now(), text });
    AccessibilityInfo.announceForAccessibility(text);
    hide.current = setTimeout(() => setMessage(null), 4000);
  };
  useEffect(() => () => clearTimeout(hide.current), []);

  const react = (worse: boolean) => {
    if (reduced) return;
    hop.set(withSequence(withTiming(-16, { duration: 160 }), withSpring(0, bouncySpring)));
    if (worse) {
      tilt.set(
        withSequence(...[-12, 12, -9, 9, -5, 0].map((deg) => withTiming(deg, { duration: 60 })))
      );
    }
  };

  // Watch for spends added after the persisted store has loaded.
  useEffect(() => {
    if (!hydrated) return;
    const ids = new Set(expenses.map((e) => e.id));
    const prev = seen.current;
    seen.current = ids;
    const prevMood = lastMood.current;
    lastMood.current = mood;
    if (!prev) return;

    const added = expenses.find((e) => !prev.has(e.id));
    const crossed = RANK[mood] > RANK[prevMood];

    if (added) {
      const spent = `${formatINR(added.amount)} at ${added.merchant}`;
      const text =
        mood === 'over'
          ? crossed
            ? `Whoa! ${spent} puts you ${formatINR(-left)} over today's limit.`
            : `${spent}. You're now ${formatINR(-left)} over today's limit.`
          : mood === 'worried'
            ? `Careful! ${spent}. Only ${formatINR(left)} left for today.`
            : `Logged ${spent}. ${formatINR(left)} left today.`;
      haptic(mood, crossed);
      react(mood === 'over' || mood === 'worried');
      say(text);
    } else if (RANK[mood] < RANK[prevMood] && prevMood === 'over') {
      react(false);
      say(`Phew, back under today's limit. ${formatINR(left)} left.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, hydrated]);

  const status = () =>
    mood === 'over'
      ? `${formatINR(total)} spent today, ${formatINR(-left)} over your ${formatINR(limit)} limit.`
      : `${formatINR(total)} of ${formatINR(limit)} spent today. ${formatINR(left)} left.`;

  const body = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.get() + hop.get() }, { rotate: `${tilt.get()}deg` }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      {message && (
        <Animated.View
          key={message.id}
          pointerEvents="none"
          entering={popIn(0.85, 220, 0, reduced)}
          exiting={reduced ? reducedExit : FadeOut.duration(200)}
          style={[styles.bubble, { backgroundColor: c.bg2, borderColor: c.separator }]}>
          <Text variant="footnote" weight="600">
            {message.text}
          </Text>
        </Animated.View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Spending buddy. ${status()}`}
        hitSlop={8}
        onPress={() => {
          react(false);
          say(status());
        }}>
        <Animated.View style={[styles.shadow, body]}>
          <Face mood={mood} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-end' },
  face: { width: BUDDY, height: BUDDY },
  eye: { position: 'absolute' },
  shadow: { borderRadius: BUDDY / 2, boxShadow: '0px 6px 16px rgba(0,0,0,0.30)' },
  bubble: {
    position: 'absolute',
    bottom: BUDDY + 8,
    right: 0,
    width: 230,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.button,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0px 8px 24px rgba(0,0,0,0.25)',
  },
});
