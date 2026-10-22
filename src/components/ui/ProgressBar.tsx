import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { easeFn } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';
import type { ColorToken } from '@/lib/theme';

interface ProgressBarProps {
  // 0–1; values above 1 render full.
  value: number;
  color?: ColorToken;
  accessibilityLabel: string;
}

// 6 px track that fills from the left over 700 ms, in step with the hero amount count-up.
export function ProgressBar({ value, color = 'tint', accessibilityLabel }: ProgressBarProps) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const fill = useSharedValue(0);
  const target = Math.max(0, Math.min(1, value));

  useEffect(() => {
    fill.set(reduced ? target : withTiming(target, { duration: 700, easing: easeFn }));
  }, [fill, target, reduced]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.get() }] }));

  return (
    <View
      role="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}
      style={[styles.track, { backgroundColor: c.tileGlass }]}>
      <Animated.View style={[styles.fill, { backgroundColor: c[color] }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 3,
    transformOrigin: 'left',
  },
});
