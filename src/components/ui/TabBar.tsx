import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { TabIcon, type TabName } from './TabIcons';

import { spring } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';
import { size } from '@/lib/theme';

const LABELS: Record<TabName, string> = {
  home: 'Home',
  expenses: 'Expenses',
  insights: 'Insights',
  settings: 'Settings',
};

const PAD = (size.pill - size.pillDisc) / 2;
const glass = isLiquidGlassAvailable();

// The capsule: Liquid Glass on iOS 26, a solid dark pill elsewhere.
function Pill({
  children,
  onLayout,
}: {
  children: ReactNode;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const { c } = useTheme();
  if (glass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        tintColor={c.pillTint}
        onLayout={onLayout}
        style={styles.pill}>
        {children}
      </GlassView>
    );
  }
  return (
    <View onLayout={onLayout} style={[styles.pill, { backgroundColor: c.pill }]}>
      {children}
    </View>
  );
}

function Tab({ name, active, onPress }: { name: TabName; active: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const on = useSharedValue(active ? 1 : 0);
  const pop = useSharedValue(1);

  // Icon colour crossfades as the disc arrives, with a 1 → 1.12 → 1 pop.
  useEffect(() => {
    on.set(withTiming(active ? 1 : 0, { duration: 150 }));
    if (active && !reduced) {
      pop.set(withSequence(withTiming(1.12, { duration: 110 }), withTiming(1, { duration: 140 })));
    }
  }, [active, on, pop, reduced]);

  const idle = useAnimatedStyle(() => ({
    opacity: 1 - on.get(),
    transform: [{ scale: pop.get() }],
  }));
  const current = useAnimatedStyle(() => ({
    opacity: on.get(),
    transform: [{ scale: pop.get() }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={LABELS[name]}
      accessibilityState={{ selected: active }}
      aria-current={active ? 'page' : undefined}
      onPress={onPress}
      style={styles.tab}>
      <View style={styles.icon}>
        <Animated.View style={[StyleSheet.absoluteFill, idle]}>
          <TabIcon name={name} filled={false} color={c.pillIcon} cutout={c.pill} size={24} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, current]}>
          <TabIcon
            name={name}
            filled={false}
            color={c.pillActiveIcon}
            cutout={c.pillActive}
            size={24}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

// Floating capsule tab bar: icons only, a white disc slides under the active tab.
export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const slot = width ? (width - PAD * 2) / state.routes.length : 0;

  const x = useSharedValue(0);
  useEffect(() => {
    x.set(width ? withSpring(state.index * slot, spring) : 0);
  }, [state.index, slot, width, x]);
  const disc = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { paddingBottom: Math.max(insets.bottom - 6, 12) }]}>
      <View style={styles.shadow}>
        <Pill onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <View role="navigation" aria-label="Main" style={styles.row}>
            {width > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.disc,
                  { left: PAD + (slot - size.pillDisc) / 2, backgroundColor: c.pillActive },
                  disc,
                ]}
              />
            )}
            {state.routes.map((route, i) => {
              const active = state.index === i;
              return (
                <Tab
                  key={route.key}
                  name={route.name as TabName}
                  active={active}
                  onPress={() => {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!active && !event.defaultPrevented)
                      navigation.navigate(route.name, route.params);
                  }}
                />
              );
            })}
          </View>
        </Pill>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  shadow: {
    borderRadius: size.pill / 2,
    boxShadow: '0px 10px 30px rgba(0,0,0,0.28)',
  },
  pill: {
    height: size.pill,
    borderRadius: size.pill / 2,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  row: { flex: 1, flexDirection: 'row', paddingHorizontal: PAD, alignItems: 'center' },
  disc: {
    position: 'absolute',
    top: PAD,
    width: size.pillDisc,
    height: size.pillDisc,
    borderRadius: size.pillDisc / 2,
  },
  tab: { flex: 1, height: size.pill, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 24, height: 24 },
});
