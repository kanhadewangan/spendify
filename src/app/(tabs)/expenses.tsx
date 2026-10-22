import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { ExpenseCell } from '@/components/ExpenseCell';
import {
  CircleButton,
  EmptyState,
  InsetGroup,
  LargeTitleScreen,
  SearchField,
  SegmentedControl,
  Skeleton,
} from '@/components/ui';
import { formatINR } from '@/lib/format';
import { groupByDay, matches } from '@/lib/selectors';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/ThemeProvider';
import { CATEGORIES, categoryLabel, type Category } from '@/lib/types';
import { useDebounced } from '@/lib/useDebounced';

type Filter = 'all' | Category;

const BASE: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'food', label: 'Food' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'groceries', label: 'Groceries' },
];

// Simulated first load (600 ms), once per app session.
let firstOpen = true;

export default function Expenses() {
  const { c } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const expenses = useStore((s) => s.expenses);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const q = useDebounced(query, 150);
  const [loading, setLoading] = useState(firstOpen);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      firstOpen = false;
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [loading]);

  // Insights links here with ?category=… — adopt it whenever it changes.
  const [seenParam, setSeenParam] = useState<string | undefined>();
  if (params.category !== seenParam) {
    setSeenParam(params.category);
    const cat = params.category as Category | undefined;
    if (cat && CATEGORIES.includes(cat)) setFilter(cat);
  }

  const options = useMemo(
    () =>
      BASE.some((o) => o.value === filter)
        ? BASE
        : [...BASE, { value: filter, label: categoryLabel[filter as Category] }],
    [filter]
  );

  const groups = useMemo(
    () =>
      groupByDay(
        expenses.filter((e) => (filter === 'all' || e.category === filter) && matches(e, q))
      ),
    [expenses, filter, q]
  );

  return (
    <LargeTitleScreen
      title="Expenses"
      keyboardShouldPersistTaps="handled"
      trailing={
        <CircleButton
          accessibilityLabel="Add expense"
          background="bg2"
          onPress={() => router.push('/expense-form')}>
          <Plus size={20} strokeWidth={2.5} color={c.tint} />
        </CircleButton>
      }
      accessory={
        <>
          <SearchField value={query} onChange={setQuery} placeholder="Search" />
          <SegmentedControl
            accessibilityLabel="Filter by category"
            options={options}
            value={filter}
            onChange={(v) => {
              setFilter(v);
              if (params.category) router.setParams({ category: undefined });
            }}
          />
        </>
      }>
      {loading ? (
        <Skeleton rows={6} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No Matches"
          message={
            q
              ? `No expenses match “${q}”.`
              : `No ${categoryLabel[filter as Category] ?? ''} expenses yet.`
          }
          action={
            q
              ? { label: 'Clear Search', onPress: () => setQuery('') }
              : { label: 'Show All', onPress: () => setFilter('all') }
          }
        />
      ) : (
        // Re-keyed on the segment so rows re-stagger; search keeps keys so rows collapse in place.
        <View key={filter}>
          {groups.map((g) => (
            <InsetGroup key={g.key} header={g.title} headerTrailing={formatINR(g.total)} animated>
              {g.items.map((e) => (
                <ExpenseCell key={e.id} expense={e} />
              ))}
            </InsetGroup>
          ))}
        </View>
      )}
    </LargeTitleScreen>
  );
}
