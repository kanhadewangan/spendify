import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Text } from './Text';

import { spring } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';
import { radius, size } from '@/lib/theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { c, scheme } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const segment = width ? (width - 4) / options.length : 0;

  // Selected pill slides between segments (the RN equivalent of layoutId="seg-thumb").
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = width ? withSpring(index * segment, spring) : 0;
  }, [index, segment, width, x]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const move = (delta: number) =>
    onChange(options[(index + delta + options.length) % options.length].value);

  return (
    <View
      role="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: c.segBg }]}>
      {width > 0 && (
        <Animated.View
          style={[
            styles.thumb,
            { width: segment, backgroundColor: c.segOn },
            scheme === 'light' && styles.shadow,
            thumb,
          ]}
        />
      )}
      {options.map((o, i) => {
        const selected = i === index;
        return (
          <Pressable
            key={o.value}
            role="tab"
            aria-selected={selected}
            accessibilityState={{ selected }}
            focusable={selected}
            onPress={() => onChange(o.value)}
            // Arrow keys move between segments (web / hardware keyboards).
            {...({
              onKeyDown: (e: { nativeEvent: { key: string } }) => {
                if (e.nativeEvent.key === 'ArrowRight') move(1);
                if (e.nativeEvent.key === 'ArrowLeft') move(-1);
              },
            } as object)}
            hitSlop={{ top: 6, bottom: 6 }}
            style={styles.segment}>
            <Text
              variant="footnote"
              weight={selected ? '600' : '500'}
              color="label"
              numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: size.seg,
    borderRadius: radius.seg,
    padding: 2,
    flexDirection: 'row',
  },
  thumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    bottom: 2,
    borderRadius: radius.segThumb,
  },
  shadow: {
    boxShadow: '0px 3px 8px rgba(0,0,0,0.12), 0px 3px 1px rgba(0,0,0,0.04)',
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
