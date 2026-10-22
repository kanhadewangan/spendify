import { ChevronLeft } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewProps } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from './Gradient';
import { Text } from './Text';

import { useTheme } from '@/lib/ThemeProvider';
import { size } from '@/lib/theme';

interface LargeTitleScreenProps {
  title: string;
  eyebrow?: string;
  trailing?: ReactNode;
  // Rendered under the large title, before the scroll content (search, segmented control).
  accessory?: ReactNode;
  children: ReactNode;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
}

// LargeTitleBar + scroll container. Past 30 px the large title fades up and a centred
// Headline title fades into a 44 px sticky bar with a hairline — driven by scroll, not state.
export function LargeTitleScreen({
  title,
  eyebrow,
  trailing,
  accessory,
  children,
  keyboardShouldPersistTaps,
}: LargeTitleScreenProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 20);
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  const large = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, 30], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [0, 30], [0, -8], Extrapolation.CLAMP) }],
  }));
  const bar = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [30, 46], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.fill}>
      <Backdrop />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="on-drag"
        // Clear the floating tab bar, which overlays the bottom of the scroll view.
        contentContainerStyle={{
          paddingTop: top,
          paddingBottom: Math.max(insets.bottom, 12) + size.pill + 24,
        }}>
        <Animated.View style={[styles.titleRow, large]}>
          <View style={styles.titleText}>
            {eyebrow && (
              <Text variant="footnote" color="label2" weight="600" upper>
                {eyebrow}
              </Text>
            )}
            <Text variant="largeTitle" accessibilityRole="header">
              {title}
            </Text>
          </View>
          {trailing}
        </Animated.View>
        {accessory && <View style={styles.accessory}>{accessory}</View>}
        {children}
      </Animated.ScrollView>
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[
          styles.bar,
          {
            height: top + 44,
            paddingTop: top,
            backgroundColor: c.bg,
            borderBottomColor: c.separator,
          },
          bar,
        ]}>
        <Text variant="headline">{title}</Text>
      </Animated.View>
    </View>
  );
}

interface InlineNavBarProps {
  title: string;
  back: { label: string; href: Href };
  action?: { label: string; onPress: () => void };
}

export function InlineNavBar({ title, back, action }: InlineNavBarProps) {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 20);
  return (
    <View
      style={[
        styles.inline,
        {
          paddingTop: top,
          height: top + 44,
          borderBottomColor: c.separator,
        },
      ]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Back to ${back.label}`}
        hitSlop={8}
        onPress={() => (router.canGoBack() ? router.back() : router.replace(back.href))}
        style={styles.back}>
        <ChevronLeft size={28} strokeWidth={2.4} color={c.tint} style={styles.backIcon} />
        <Text color="tint">{back.label}</Text>
      </Pressable>
      <Text variant="headline" align="center" numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.actionCol}>
        {action && (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={action.onPress}
            style={styles.action}>
            <Text color="tint">{action.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface SheetNavBarProps {
  title: string;
  onCancel: () => void;
  onDone: () => void;
  doneLabel?: string;
  doneDisabled?: boolean;
}

// Modal sheet header: Cancel · title · Done (bold).
export function SheetNavBar({
  title,
  onCancel,
  onDone,
  doneLabel = 'Done',
  doneDisabled,
}: SheetNavBarProps) {
  return (
    <View style={[styles.inline, styles.sheet]}>
      <View style={styles.sheetCol}>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onCancel} style={styles.action}>
          <Text color="tint">Cancel</Text>
        </Pressable>
      </View>
      <Text variant="headline" align="center" numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.actionCol}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: doneDisabled }}
          disabled={doneDisabled}
          hitSlop={8}
          onPress={onDone}
          style={styles.action}>
          <Text color={doneDisabled ? 'label2' : 'tint'} weight="600">
            {doneLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  sheet: { height: 56, paddingTop: 8 },
  sheetCol: { flex: 1, alignItems: 'flex-start' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: size.inset,
    paddingTop: 3,
    paddingBottom: 8,
    gap: 12,
  },
  titleText: { flex: 1 },
  accessory: { paddingHorizontal: size.inset, paddingBottom: 16, gap: 12 },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  back: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  backIcon: { marginRight: -2 },
  actionCol: { flex: 1, alignItems: 'flex-end' },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
});
