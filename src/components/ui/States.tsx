import { CircleAlert, SearchX, type LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button } from './Button';
import { Text } from './Text';

import { fadeUp, popIn } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';
import { size } from '@/lib/theme';

interface StateProps {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
  icon?: LucideIcon;
}

export function EmptyState({ title, message, action, icon: Icon = SearchX }: StateProps) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  return (
    <View style={styles.state}>
      <Animated.View entering={popIn(0.8, 300, 0, reduced)}>
        <Icon size={40} strokeWidth={1.5} color={c.label2} />
      </Animated.View>
      <Animated.View entering={fadeUp(80, reduced)} style={styles.text}>
        <Text variant="headline" align="center">
          {title}
        </Text>
        <Text variant="footnote" color="label2" align="center">
          {message}
        </Text>
      </Animated.View>
      {action && (
        <Animated.View entering={fadeUp(140, reduced)}>
          <Button capsule variant="tinted" label={action.label} onPress={action.onPress} />
        </Animated.View>
      )}
    </View>
  );
}

export const ErrorState = (props: StateProps) => <EmptyState icon={CircleAlert} {...props} />;

// --fill blocks shaped like letter-tile cells, pulsing 0.6 ↔ 1 every 900 ms.
export function Skeleton({ rows }: { rows: number }) {
  const { c } = useTheme();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.6, { duration: 900 }), -1, true);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={[styles.group, { backgroundColor: c.bg2 }, style]}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <View style={[styles.tile, { backgroundColor: c.fill }]} />
          <View style={styles.lines}>
            <View style={[styles.line, { width: '45%', backgroundColor: c.fill }]} />
            <View style={[styles.line, styles.thin, { width: '30%', backgroundColor: c.fill }]} />
          </View>
          <View style={[styles.line, { width: 48, backgroundColor: c.fill }]} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 40, gap: 14 },
  text: { gap: 4, alignItems: 'center' },
  group: { marginHorizontal: size.inset, borderRadius: 10, marginBottom: 22 },
  row: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  tile: { width: 40, height: 40, borderRadius: 10 },
  lines: { flex: 1, gap: 6 },
  line: { height: 12, borderRadius: 4 },
  thin: { height: 10 },
});
