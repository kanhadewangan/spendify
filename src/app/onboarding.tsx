import { Link, useRouter } from 'expo-router';
import {
  BellRing,
  ChartNoAxesColumn,
  Cpu,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert, Backdrop, Button, Text } from '@/components/ui';
import { fadeUp } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/ThemeProvider';
import { size } from '@/lib/theme';

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: BellRing,
    title: 'Reads order and payment alerts',
    body: 'Swiggy, Zepto, Amazon, Uber and UPI apps — amounts are picked up the moment they arrive.',
  },
  {
    icon: Cpu,
    title: 'Processed on your device',
    body: 'Notifications are parsed locally. Nothing is uploaded, and there is no account.',
  },
  {
    icon: ChartNoAxesColumn,
    title: 'Daily totals, no typing',
    body: 'See what you spent today, by category, without entering a single expense.',
  },
];

export default function Onboarding() {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const updateSettings = useStore((s) => s.updateSettings);
  const [asking, setAsking] = useState(false);

  const finish = (allow: boolean) => {
    updateSettings({ notificationAccess: allow, onboarded: true });
    router.replace('/home');
  };

  return (
    <View style={styles.fill}>
      <Backdrop height={460} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) + 30 }]}>
        <Animated.View entering={fadeUp(0, reduced)} style={styles.hero}>
          <View style={[styles.squircle, { backgroundColor: c.tint }]}>
            <BellRing size={40} strokeWidth={2} color={c.onTint} />
          </View>
          <Text variant="title1" align="center" accessibilityRole="header">
            {'Track Spending\nAutomatically'}
          </Text>
        </Animated.View>
        <View style={styles.features}>
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Animated.View
              key={title}
              entering={fadeUp(120 + i * 60, reduced)}
              style={styles.feature}>
              <Icon size={32} strokeWidth={1.75} color={c.tint} />
              <View style={styles.featureText}>
                <Text variant="subheadline" weight="600">
                  {title}
                </Text>
                <Text variant="subheadline" color="label2">
                  {body}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.privacy}>
          <ShieldCheck size={24} strokeWidth={1.75} color={c.tint} />
          <Text variant="footnote" color="label2" align="center">
            You can change this any time in Settings.{' '}
            <Link href="/settings" replace>
              <Text variant="footnote" color="tint">
                See how your data is managed…
              </Text>
            </Link>
          </Text>
        </View>
        <Button label="Continue" onPress={() => setAsking(true)} />
      </View>
      <Alert
        visible={asking}
        onDismiss={() => setAsking(false)}
        title="“Spendify” Would Like to Read Your Notifications"
        message="Spendify reads order and payment alerts to log expenses automatically. Everything stays on this device."
        actions={[
          { label: 'Don’t Allow', role: 'cancel', onPress: () => finish(false) },
          { label: 'Allow', onPress: () => finish(true) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 32, paddingBottom: 24 },
  hero: { alignItems: 'center', gap: 24, marginBottom: 44 },
  squircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  features: { gap: 28 },
  feature: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  featureText: { flex: 1, gap: 4 },
  bottom: { paddingHorizontal: size.inset + 8, gap: 20 },
  privacy: { alignItems: 'center', gap: 10, paddingHorizontal: 8 },
});
