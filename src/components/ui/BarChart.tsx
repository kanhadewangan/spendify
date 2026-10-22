import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from './Pressables';
import { Text } from './Text';

import { formatINR } from '@/lib/format';
import { dur, softSpring } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';

export interface BarDatum {
  key: string;
  label: string;
  title: string;
  value: number;
  selected?: boolean;
  empty?: boolean;
}

interface BarChartProps {
  days: BarDatum[];
  max: number;
  onSelect?: (index: number) => void;
}

const PLOT = 150;

function Bar({
  d,
  index,
  max,
  onPress,
}: {
  d: BarDatum;
  index: number;
  max: number;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? 1 : 0);
  const on = useSharedValue(d.selected ? 1 : 0);

  useEffect(() => {
    grow.value = reduced ? 1 : withDelay(index * 40, withSpring(1, softSpring));
  }, [grow, index, reduced]);
  useEffect(() => {
    on.value = withTiming(d.selected ? 1 : 0, { duration: dur.fast });
  }, [d.selected, on]);

  const fill = c.fill;
  const tint = c.tint;
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [fill, tint]),
    transform: [{ scaleY: grow.value }],
  }));

  const height = d.empty || !d.value ? 4 : Math.max(8, (d.value / max) * PLOT);
  return (
    <PressableScale
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityState={{ selected: !!d.selected }}
      accessibilityLabel={`${d.title}, ${d.empty ? 'no spending' : formatINR(d.value)}`}
      onPress={onPress}
      style={styles.column}>
      <View style={styles.plot}>
        <Animated.View style={[styles.bar, { height }, style]} />
      </View>
      <Text
        variant="caption2"
        color={d.selected ? 'label' : 'label2'}
        weight={d.selected ? '600' : '400'}>
        {d.label}
      </Text>
    </PressableScale>
  );
}

export function BarChart({ days, max, onSelect }: BarChartProps) {
  const summary = days.map((d) => `${d.title} ${d.empty ? 'none' : formatINR(d.value)}`).join(', ');
  return (
    <View accessibilityLabel={`Spending chart: ${summary}`} style={styles.chart}>
      {days.map((d, i) => (
        <Bar key={d.key} d={d} index={i} max={max || 1} onPress={() => onSelect?.(i)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', gap: 8 },
  column: { flex: 1, alignItems: 'center', gap: 8, minHeight: 44 },
  plot: { height: PLOT, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '72%', maxWidth: 32, borderRadius: 5, transformOrigin: 'bottom' },
});
