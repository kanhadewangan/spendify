import { Fragment, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableHighlight } from './Pressables';
import { Text } from './Text';

import { ease } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';

export interface AlertAction {
  label: string;
  role?: 'cancel' | 'default' | 'destructive';
  onPress?: () => void;
}

interface AlertProps {
  visible: boolean;
  title: string;
  message?: string;
  actions: AlertAction[];
  onDismiss: () => void;
}

// iOS alert: scrim fades, dialog zooms 1.1 → 1. Two actions sit side by side, more stack.
export function Alert({ visible, title, message, actions, onDismiss }: AlertProps) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  // Stay mounted after `visible` drops so the close animation can play.
  const [closing, setClosing] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);
  if (wasVisible !== visible) {
    setWasVisible(visible);
    setClosing(!visible);
  }
  const p = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      p.set(withTiming(1, { duration: 220, easing: ease }));
    } else if (closing) {
      p.set(
        withTiming(0, { duration: reduced ? 150 : 220, easing: ease }, (done) => {
          if (done) runOnJS(setClosing)(false);
        })
      );
    }
  }, [visible, closing, p, reduced]);
  const mounted = visible || closing;

  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));
  const dialog = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: reduced ? 1 : 1.1 - 0.1 * p.value }],
  }));

  const row = actions.length === 2;
  const press = (a: AlertAction) => {
    onDismiss();
    a.onPress?.();
  };
  const cancel = actions.find((a) => a.role === 'cancel');

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => (cancel ? press(cancel) : onDismiss())}>
      <View style={styles.center}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }, scrim]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityElementsHidden
            importantForAccessibility="no"
            onPress={() => cancel && press(cancel)}
          />
        </Animated.View>
        <Animated.View
          role="alertdialog"
          aria-modal
          accessibilityViewIsModal
          aria-label={title}
          style={[styles.dialog, { backgroundColor: c.bg2 }, dialog]}>
          <View style={styles.body}>
            <Text variant="headline" align="center" accessibilityRole="header">
              {title}
            </Text>
            {message && (
              <Text variant="footnote" align="center">
                {message}
              </Text>
            )}
          </View>
          <View style={[styles.actions, row && styles.actionsRow]}>
            {actions.map((a, i) => (
              <Fragment key={a.label}>
                <View
                  style={[
                    row && i > 0 ? styles.vRule : styles.hRule,
                    { backgroundColor: c.separator },
                  ]}
                />
                <PressableHighlight
                  accessibilityRole="button"
                  accessibilityLabel={a.label}
                  onPress={() => press(a)}
                  style={[styles.action, row && styles.actionHalf]}>
                  <Text
                    color={a.role === 'destructive' ? 'red' : 'tint'}
                    weight={a.role === 'cancel' ? '400' : '600'}>
                    {a.label}
                  </Text>
                </PressableHighlight>
              </Fragment>
            ))}
            {row && (
              <View
                style={[styles.hRule, styles.rowRule, { backgroundColor: c.separator }]}
                pointerEvents="none"
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dialog: { width: 270, borderRadius: 14, overflow: 'hidden' },
  body: { paddingTop: 19, paddingBottom: 18, paddingHorizontal: 16, gap: 4 },
  actions: {},
  actionsRow: { flexDirection: 'row' },
  action: { height: 44, alignItems: 'center', justifyContent: 'center' },
  actionHalf: { flex: 1 },
  hRule: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  vRule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  rowRule: { position: 'absolute', top: 0, left: 0, right: 0 },
});
