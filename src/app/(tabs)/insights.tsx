import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { categoryIcon } from '@/components/categoryIcon';
import {
  Amount,
  BarChart,
  Cell,
  CircleButton,
  EmptyState,
  GradientCard,
  InsetGroup,
  LargeTitleScreen,
  SegmentedControl,
  SymbolTile,
  Text,
} from '@/components/ui';
import { formatINR } from '@/lib/format';
import { categorySplit, inRange, periodData, type Period } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/ThemeProvider';
import { categoryColor, radius, size } from '@/lib/theme';
import { categoryLabel } from '@/lib/types';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export default function Insights() {
  const { c } = useTheme();
  const expenses = useStore((s) => s.expenses);
  const [period, setPeriod] = useState<Period>('week');
  const [offset, setOffset] = useState(0);
  const data = useMemo(() => periodData(expenses, period, offset), [expenses, period, offset]);
  const [picked, setPicked] = useState<{ key: string; index: number } | null>(null);

  // Selection resets to the default bucket whenever the period or range changes.
  const rangeKey = `${period}:${offset}`;
  const selected = picked?.key === rangeKey ? picked.index : data.defaultIndex;
  const bucket = data.buckets[selected];

  const split = useMemo(
    () => categorySplit(inRange(expenses, bucket.start, bucket.end)),
    [expenses, bucket.start, bucket.end]
  );
  const max = Math.max(...data.buckets.map((b) => b.value));

  const shift = (d: number) => {
    setOffset((o) => o + d);
    setPicked(null);
  };

  return (
    <LargeTitleScreen
      title="Insights"
      accessory={
        <SegmentedControl
          accessibilityLabel="Period"
          options={PERIODS}
          value={period}
          onChange={(p) => {
            setPeriod(p);
            setOffset(0);
            setPicked(null);
          }}
        />
      }>
      <GradientCard style={styles.card}>
        <View style={styles.rangeRow}>
          <CircleButton
            size={32}
            accessibilityLabel={`Previous ${period}`}
            onPress={() => shift(-1)}>
            <ChevronLeft size={18} strokeWidth={2.5} color={c.label} />
          </CircleButton>
          <Text variant="subheadline" weight="600" tabular>
            {data.range}
          </Text>
          <View style={offset >= 0 && styles.disabled}>
            <CircleButton
              size={32}
              accessibilityLabel={`Next ${period}`}
              onPress={() => offset < 0 && shift(1)}>
              <ChevronRight size={18} strokeWidth={2.5} color={c.label} />
            </CircleButton>
          </View>
        </View>
        <View style={styles.totals}>
          <Text variant="footnote" color="label2" weight="600" upper>
            {bucket.title}
          </Text>
          <Amount value={bucket.value} size="lg" animate />
          <Text variant="subheadline" color="label2" tabular>
            of {formatINR(data.total)} {data.noun}
          </Text>
        </View>
        <BarChart
          key={rangeKey}
          max={max}
          onSelect={(index) => setPicked({ key: rangeKey, index })}
          days={data.buckets.map((b, i) => ({
            key: b.key,
            label: b.label,
            title: b.title,
            value: b.value,
            selected: i === selected,
            empty: b.future || b.value === 0,
          }))}
        />
      </GradientCard>

      {split.length > 0 ? (
        <InsetGroup
          key={`${rangeKey}:${selected}`}
          header={`Categories · ${bucket.title}`}
          animated>
          {split.map((s) => {
            const Icon = categoryIcon[s.category];
            return (
              <Cell
                key={s.category}
                leading={
                  <SymbolTile
                    color={categoryColor[s.category]}
                    icon={(color, px) => <Icon size={px} strokeWidth={2.25} color={color} />}
                  />
                }
                leadingSize={size.icon}
                title={categoryLabel[s.category]}
                value={
                  <View style={styles.value}>
                    <Text color="label2" tabular>
                      {s.pct}%
                    </Text>
                    <Text tabular align="right" style={styles.amount}>
                      {formatINR(s.value)}
                    </Text>
                  </View>
                }
                chevron
                href={{ pathname: '/expenses', params: { category: s.category } }}
                accessibilityLabel={`${categoryLabel[s.category]}, ${s.pct}%, ${formatINR(s.value)}`}
              />
            );
          })}
        </InsetGroup>
      ) : (
        <EmptyState
          title="No Spending"
          message={`Nothing was spent ${bucket.future ? 'yet' : 'in this period'}.`}
          action={
            offset !== 0 ? { label: 'Back to Today', onPress: () => shift(-offset) } : undefined
          }
        />
      )}
    </LargeTitleScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: size.inset,
    marginBottom: 22,
    borderRadius: radius.hero,
    padding: 16,
    gap: 16,
  },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disabled: { opacity: 0.35 },
  totals: { gap: 2 },
  value: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amount: { minWidth: 56 },
});
