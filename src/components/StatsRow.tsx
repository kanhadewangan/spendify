import { TrendingUp, Calendar, Wallet, Repeat } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GlassCard, GlassOrbs, Text } from './ui';

import { formatINR } from '@/lib/format';
import { bouncySpring } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';
import { radius, size } from '@/lib/theme';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  delay: number;
  isCount?: boolean;
  last?: boolean;
}

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

function AnimatedStat({ icon, label, value, delay, isCount = false, last = false }: StatItemProps) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const current = useRef(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      current.current = value;
      setShown(value);
      progress.value = withSpring(1, bouncySpring);
      return;
    }

    const from = current.current;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start - delay) / 800);
      if (p > 0) {
        current.current = from + (value - from) * easeOutQuart(p);
        setShown(current.current);
        progress.value = withSpring(p < 1 ? p : 1, bouncySpring);
      }
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [value, delay, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.8 + 0.2 * progress.value }],
  }));

  return (
    <Animated.View style={[styles.statItem, animatedStyle, last && styles.statItemLast]}>
      <View style={[styles.statIcon, { backgroundColor: c.tileGlass }]}>{icon}</View>
      <Text variant="footnote" color="label2" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="headline" tabular numberOfLines={1} style={styles.statValue}>
        {isCount ? Math.round(shown).toString() : formatINR(shown)}
      </Text>
    </Animated.View>
  );
}

interface StatsRowProps {
  weeklyTotal: number;
  monthlyTotal: number;
  avgDaily: number;
  transactionCount: number;
}

export function StatsRow({ weeklyTotal, monthlyTotal, avgDaily, transactionCount }: StatsRowProps) {
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      <GlassOrbs />
      <GlassCard style={styles.card}>
        <AnimatedStat
          icon={<Calendar size={20} strokeWidth={2.25} color={c.tint} />}
          label="This Week"
          value={weeklyTotal}
          delay={0}
        />
        <AnimatedStat
          icon={<Wallet size={20} strokeWidth={2.25} color={c.cyan} />}
          label="This Month"
          value={monthlyTotal}
          delay={100}
        />
        <AnimatedStat
          icon={<TrendingUp size={20} strokeWidth={2.25} color={c.purple} />}
          label="Avg Daily"
          value={avgDaily}
          delay={200}
        />
        <AnimatedStat
          icon={<Repeat size={20} strokeWidth={2.25} color={c.orange} />}
          label="Transactions"
          value={transactionCount}
          delay={300}
          isCount
          last
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: size.inset,
    marginTop: 8,
    marginBottom: 22,
    borderRadius: radius.glass,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  card: {
    borderRadius: radius.glass,
    padding: 18,
    gap: 0,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.glassInner,
    borderCurve: 'continuous',
    marginBottom: 10,
  },
  statItemLast: {
    marginBottom: 0,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statLabel: {
    flex: 1,
  },
  statValue: {
    fontWeight: '600',
  },
});
