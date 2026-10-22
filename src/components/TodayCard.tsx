import { Link } from 'expo-router';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ReceiptText,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Amount, GlassCard, GlassOrbs, ProgressBar, Text } from './ui';

import { formatINR } from '@/lib/format';
import type { TodaySummary } from '@/lib/selectors';
import { useTheme } from '@/lib/ThemeProvider';
import { radius, size, withAlpha, type ColorToken } from '@/lib/theme';

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.stat, { backgroundColor: c.tileGlass }]}>
      <View style={styles.statLabel}>
        <Icon size={15} strokeWidth={2.25} color={c.label2} />
        <Text variant="footnote" color="label2" numberOfLines={1} style={styles.flex}>
          {label}
        </Text>
      </View>
      <Text variant="headline" tabular numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// Home hero: today's total, change vs yesterday, progress against the daily limit, two stats.
export function TodayCard({ t, limit }: { t: TodaySummary; limit: number }) {
  const { c } = useTheme();
  const up = (t.deltaPct ?? 0) >= 0;
  const Arrow = up ? ArrowUp : ArrowDown;
  // Spending more than yesterday is a caution, less is good news.
  const deltaColor: ColorToken = up ? 'orange' : 'tint';

  const used = limit ? t.total / limit : 0;
  const left = limit - t.total;
  const limitColor: ColorToken = used > 1 ? 'red' : used >= 0.85 ? 'orange' : 'tint';

  return (
    <View style={styles.wrap}>
      <GlassOrbs />
      <GlassCard style={styles.card}>
        <View style={styles.top}>
          <Text variant="subheadline" color="label2">
            Spent today
          </Text>
          <Link href="/insights" asChild>
            <Pressable accessibilityRole="link" hitSlop={12} style={styles.link}>
              <Text variant="subheadline" color="tint">
                Insights
              </Text>
              <ChevronRight size={18} strokeWidth={2.5} color={c.tint} />
            </Pressable>
          </Link>
        </View>

        <Amount value={t.total} size="xl" animate />

        {t.deltaPct !== null && (
          <View
            accessible
            accessibilityLabel={`${up ? 'Up' : 'Down'} ${Math.abs(t.deltaPct)}% from ${formatINR(t.yesterday)} yesterday`}
            style={styles.delta}>
            <View style={[styles.badge, { backgroundColor: withAlpha(c[deltaColor], 0.16) }]}>
              <Arrow size={13} strokeWidth={3} color={c[deltaColor]} />
              <Text variant="footnote" weight="600" color={deltaColor} tabular>
                {Math.abs(t.deltaPct)}%
              </Text>
            </View>
            <Text variant="footnote" color="label2" tabular>
              vs {formatINR(t.yesterday)} yesterday
            </Text>
          </View>
        )}

        {limit > 0 && (
          <View style={styles.limit}>
            <ProgressBar
              value={used}
              color={limitColor}
              accessibilityLabel={`${Math.round(used * 100)}% of ${formatINR(limit)} daily limit`}
            />
            <View style={styles.limitRow}>
              <Text variant="footnote" weight="600" color={used > 1 ? 'red' : 'label'} tabular>
                {left >= 0 ? `${formatINR(left)} left` : `${formatINR(-left)} over`}
              </Text>
              <Text variant="footnote" color="label2" tabular>
                {formatINR(limit)} daily limit
              </Text>
            </View>
          </View>
        )}

        <View style={styles.stats}>
          <Stat icon={ReceiptText} label="Transactions" value={String(t.count)} />
          <Stat
            icon={TrendingUp}
            label={t.largestMerchant ? `Largest · ${t.largestMerchant}` : 'Largest'}
            value={formatINR(t.largest)}
          />
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: size.inset,
    marginTop: 10,
    marginBottom: 24,
    borderRadius: radius.glass,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  card: {
    borderRadius: radius.glass,
    padding: 18,
    gap: 6,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 26 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  limit: { gap: 10, marginTop: 16 },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stats: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: {
    flex: 1,
    borderRadius: radius.glassInner,
    borderCurve: 'continuous',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
});
