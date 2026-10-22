import { Link, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ExpenseCell } from '@/components/ExpenseCell';
import { StatsRow } from '@/components/StatsRow';
import { TodayCard } from '@/components/TodayCard';
import {
  CircleButton,
  EmptyState,
  InsetGroup,
  LargeTitleScreen,
  StackedBar,
  Text,
} from '@/components/ui';
import { formatINR, formatLongDay } from '@/lib/format';
import { TODAY } from '@/lib/seed';
import { statsSummary, todaySummary } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/ThemeProvider';
import { categoryColor } from '@/lib/theme';
import { categoryLabel } from '@/lib/types';

function SeeAll({ href, label }: { href: '/insights' | '/expenses'; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={label} hitSlop={12}>
        <Text variant="footnote" color="tint">
          See All
        </Text>
      </Pressable>
    </Link>
  );
}

export default function Home() {
  const { c } = useTheme();
  const router = useRouter();
  const expenses = useStore((s) => s.expenses);
  const initials = useStore((s) => s.settings.profile.initials);
  const dailyLimit = useStore((s) => s.settings.dailyLimit);
  const t = useMemo(() => todaySummary(expenses), [expenses]);
  const stats = useMemo(() => statsSummary(expenses), [expenses]);

  return (
    <LargeTitleScreen
      eyebrow={formatLongDay(TODAY)}
      title="Today"
      trailing={
        <CircleButton
          accessibilityRole="link"
          accessibilityLabel="Settings and profile"
          background="tint"
          size={40}
          onPress={() => router.navigate('/settings')}>
          <Text variant="subheadline" weight="600" color="onTint">
            {initials}
          </Text>
        </CircleButton>
      }>
      <TodayCard t={t} limit={dailyLimit} />
      <StatsRow
        weeklyTotal={stats.weeklyTotal}
        monthlyTotal={stats.monthlyTotal}
        avgDaily={stats.avgDaily}
        transactionCount={stats.transactionCount}
      />

      {t.split.length > 0 ? (
        <>
          <InsetGroup
            header="By Category"
            headerTrailing={<SeeAll href="/insights" label="See all categories" />}>
            <View key="split" style={styles.split}>
              <StackedBar segments={t.split} />
              <View style={styles.legend}>
                {t.split.slice(0, 4).map((s) => (
                  <View key={s.category} style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: c[categoryColor[s.category]] }]} />
                    <Text variant="subheadline" style={styles.legendName} numberOfLines={1}>
                      {categoryLabel[s.category]}
                    </Text>
                    <Text variant="subheadline" color="label2" tabular>
                      {formatINR(s.value)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </InsetGroup>
          <InsetGroup
            header="Recent"
            headerTrailing={<SeeAll href="/expenses" label="See all expenses" />}
            animated>
            {t.recent.map((e) => (
              <ExpenseCell key={e.id} expense={e} />
            ))}
          </InsetGroup>
        </>
      ) : (
        <EmptyState
          title="No Spending Yet"
          message="Expenses from today’s order and payment alerts will appear here."
          action={{ label: 'Add Expense', onPress: () => router.push('/expense-form') }}
        />
      )}
    </LargeTitleScreen>
  );
}

const styles = StyleSheet.create({
  split: { padding: 18, gap: 18 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, columnGap: 18 },
  legendItem: { width: '46%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 4.5 },
  legendName: { flex: 1 },
});
