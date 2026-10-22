import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Lock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpendifyMark } from '@/components/SpendifyMark';
import { Backdrop, Text } from '@/components/ui';
import { ease } from '@/lib/motion';
import { useHydrated, useStore } from '@/lib/store';
import { useTheme } from '@/lib/ThemeProvider';

export default function Splash() {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const onboarded = useStore((s) => s.settings.onboarded);
  const [minElapsed, setMinElapsed] = useState(false);

  const icon = useSharedValue(0);
  const word = useSharedValue(0);
  const rest = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    SplashScreen.hideAsync();
    if (reduced) {
      icon.value = withTiming(1, { duration: 200 });
      word.value = withTiming(1, { duration: 200 });
      rest.value = withTiming(1, { duration: 200 });
    } else {
      icon.value = withSpring(1, { stiffness: 500, damping: 24, mass: 0.8 });
      word.value = withDelay(280, withTiming(1, { duration: 450, easing: ease }));
      rest.value = withDelay(500, withTiming(1, { duration: 350, easing: ease }));
    }
    const t = setTimeout(() => setMinElapsed(true), 1800);
    return () => clearTimeout(t);
  }, [icon, word, rest, reduced]);

  // Exit at 1.6 s or once the store has hydrated, whichever is later.
  useEffect(() => {
    if (!minElapsed || !hydrated) return;
    const go = () => router.replace(onboarded ? '/home' : '/onboarding');
    exit.value = withTiming(1, { duration: 350, easing: ease }, (done) => {
      if (done) runOnJS(go)();
    });
  }, [minElapsed, hydrated, onboarded, router, exit]);

  const screen = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, icon.value),
    transform: [{ scale: reduced ? 1 : (0.6 + 0.4 * icon.value) * (1 + 0.15 * exit.value) }],
    shadowOpacity: 0.35 * Math.min(1, icon.value),
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: reduced ? 0 : 12 * (1 - word.value) }],
  }));
  const restStyle = useAnimatedStyle(() => ({ opacity: rest.value }));

  return (
    <Animated.View style={[styles.screen, { backgroundColor: c.bg }, screen]}>
      <Backdrop height={520} />
      <View style={styles.center}>
        <Animated.View
          accessibilityElementsHidden
          style={[styles.icon, { backgroundColor: c.tint, shadowColor: c.tint }, iconStyle]}>
          <SpendifyMark color={c.onTint} />
        </Animated.View>
        <Animated.View style={wordStyle}>
          <Text variant="largeTitle" align="center" accessibilityRole="header">
            Spendify
          </Text>
        </Animated.View>
        <Animated.View style={restStyle}>
          <Text color="label2" align="center">
            Track every spend. Live better.
          </Text>
        </Animated.View>
      </View>
      <Animated.View style={[styles.footer, { bottom: insets.bottom + 50 - 34 }, restStyle]}>
        <Lock size={13} strokeWidth={2.25} color={c.label2} />
        <Text variant="footnote" color="label2">
          Everything stays on this device
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  icon: {
    width: 112,
    height: 112,
    borderRadius: 28,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
