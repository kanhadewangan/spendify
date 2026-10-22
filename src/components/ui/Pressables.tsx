import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { bouncySpring, spring } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  scaleTo?: number;
  dimTo?: number;
}

// whileTap: scale 0.96 (bouncy spring), optional dim for filled buttons.
export function PressableScale({
  style,
  children,
  scaleTo = 0.96,
  dimTo = 1,
  onPressIn,
  onPressOut,
  ...rest
}: ScaleProps) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    opacity: 1 - (1 - dimTo) * pressed.value,
    transform: [{ scale: reduced ? 1 : 1 - (1 - scaleTo) * pressed.value }],
  }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        pressed.set(withSpring(1, bouncySpring));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withSpring(0, bouncySpring));
        onPressOut?.(e);
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}

interface HighlightProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

// Cell press: background highlight fades in over 100 ms, out over 200 ms.
export function PressableHighlight({
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: HighlightProps) {
  const { c, scheme } = useTheme();
  const on = useSharedValue(0);
  const overlay = useAnimatedStyle(() => ({ opacity: on.value }));
  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        on.set(withTiming(1, { duration: 100 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        on.set(withTiming(0, { duration: 200 }));
        onPressOut?.(e);
      }}
      style={style}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: scheme === 'dark' ? c.bg3 : c.fill2 },
          overlay,
        ]}
      />
      {children}
    </Pressable>
  );
}
