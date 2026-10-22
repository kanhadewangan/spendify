import { Cell, LetterTile } from './ui';

import { formatINR, formatTime } from '@/lib/format';
import { categoryColor } from '@/lib/theme';
import { categoryLabel, type Expense } from '@/lib/types';

// The merchant row shared by Home, Expenses and Insights.
export function ExpenseCell({ expense: e, last }: { expense: Expense; last?: boolean }) {
  const time = formatTime(new Date(e.at));
  return (
    <Cell
      last={last}
      leading={<LetterTile initial={e.initial} color={e.tile ?? categoryColor[e.category]} />}
      leadingSize={44}
      title={e.merchant}
      subtitle={`${categoryLabel[e.category]} · ${time}`}
      value={formatINR(e.amount)}
      chevron
      href={`/expenses/${e.id}`}
      accessibilityLabel={`${e.merchant}, ${categoryLabel[e.category]}, ${time}, ${formatINR(e.amount)}${e.countInTotals ? '' : ', not counted'}`}
    />
  );
}
