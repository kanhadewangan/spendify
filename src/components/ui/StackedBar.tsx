import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { formatINR } from '@/lib/format';
import { dur, ease } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';
import { categoryColor } from '@/lib/theme';
import { categoryLabel, type Category } from '@/lib/types';

interface StackedBarProps {
  segments: { category: Category; value: number }[];
}

function Segment({ category, value, index }: { category: Category; value: number; index: number }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    grow.value = reduced
      ? 1
      : withDelay(index * 60, withTiming(1, { duration: dur.slow, easing: ease }));
  }, [grow, index, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.value }] }));
  return (
    <Animated.View
      style={[
        styles.segment,
        { flexGrow: value, backgroundColor: c[categoryColor[category]] },
        style,
      ]}
    />
  );
}

export function StackedBar({ segments }: StackedBarProps) {
  const total = segments.reduce((t, s) => t + s.value, 0);
  const label = segments
    .map(
      (s) =>
        `${categoryLabel[s.category]} ${formatINR(s.value)}, ${Math.round((s.value / total) * 100)}%`
    )
    .join('; ');
  return (
    <View role="img" accessibilityLabel={`Spending by category: ${label}`} style={styles.bar}>
      {segments.map((s, i) => (
        <Segment key={s.category} index={i} {...s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 12, flexDirection: 'row', gap: 2, borderRadius: 6, overflow: 'hidden' },
  segment: { flexBasis: 0, height: 12, transformOrigin: 'left' },
});
