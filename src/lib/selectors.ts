import {
  addDays,
  dayKey,
  formatLongDay,
  monthName,
  sameDay,
  startOfDay,
  weekdayName,
  weekdayShort,
} from './format';
import { TODAY } from './seed';
import { CATEGORIES, type Category, type Expense } from './types';

// Pure derivations over the store. Screens memoise these on `expenses`.

export const counted = (list: Expense[]) => list.filter((e) => e.countInTotals);

export const sum = (list: Expense[]) => counted(list).reduce((t, e) => t + e.amount, 0);

export const sortRecent = (list: Expense[]) =>
  [...list].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

export const onDay = (list: Expense[], day: Date) =>
  list.filter((e) => sameDay(new Date(e.at), day));

export const inRange = (list: Expense[], start: Date, end: Date) =>
  list.filter((e) => {
    const t = Date.parse(e.at);
    return t >= start.getTime() && t < end.getTime();
  });

export interface CategoryShare {
  category: Category;
  value: number;
  pct: number;
}

export function categorySplit(list: Expense[]): CategoryShare[] {
  const total = sum(list);
  return CATEGORIES.map((category) => {
    const value = sum(list.filter((e) => e.category === category));
    return { category, value, pct: total ? Math.round((value / total) * 100) : 0 };
  })
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

export interface TodaySummary {
  total: number;
  count: number;
  largest: number;
  largestMerchant: string | null;
  yesterday: number;
  deltaPct: number | null;
  split: CategoryShare[];
  recent: Expense[];
}

export function todaySummary(expenses: Expense[], today = TODAY): TodaySummary {
  const list = onDay(expenses, today);
  const total = sum(list);
  const yesterday = sum(onDay(expenses, addDays(today, -1)));
  const top = counted(list).reduce<Expense | null>(
    (m, e) => (!m || e.amount > m.amount ? e : m),
    null
  );
  return {
    total,
    count: list.length,
    largest: top?.amount ?? 0,
    largestMerchant: top?.merchant ?? null,
    yesterday,
    deltaPct: yesterday ? Math.round(((total - yesterday) / yesterday) * 100) : null,
    split: categorySplit(list),
    recent: sortRecent(list).slice(0, 3),
  };
}

export interface DayGroup {
  key: string;
  title: string;
  total: number;
  items: Expense[];
}

export function groupByDay(list: Expense[], today = TODAY): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const e of sortRecent(list)) {
    const d = new Date(e.at);
    const key = dayKey(d);
    let g = groups.get(key);
    if (!g) {
      const title = sameDay(d, today)
        ? 'Today'
        : sameDay(d, addDays(today, -1))
          ? 'Yesterday'
          : formatLongDay(d);
      g = { key, title, total: 0, items: [] };
      groups.set(key, g);
    }
    g.items.push(e);
  }
  for (const g of groups.values()) g.total = sum(g.items);
  return [...groups.values()];
}

export function matches(e: Expense, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    e.merchant.toLowerCase().includes(q) ||
    e.category.includes(q) ||
    (e.vendor?.toLowerCase().includes(q) ?? false)
  );
}

// Insights periods: Day = six 4-hour buckets, Week = seven days (Sun–Sat), Month = weeks.
export type Period = 'day' | 'week' | 'month';

export interface Bucket {
  key: string;
  label: string;
  title: string; // eyebrow when selected, e.g. "SATURDAY"
  start: Date;
  end: Date;
  value: number;
  future: boolean;
}

export interface PeriodData {
  range: string;
  noun: string; // "this week"
  total: number;
  buckets: Bucket[];
  defaultIndex: number;
}

export interface StatsSummary {
  weeklyTotal: number;
  monthlyTotal: number;
  avgDaily: number;
  transactionCount: number;
}

export function statsSummary(expenses: Expense[], today = TODAY): StatsSummary {
  const now = today.getTime();
  const weekStart = addDays(startOfDay(today), -today.getDay());
  const weekEnd = addDays(weekStart, 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const weeklyTotal = sum(inRange(expenses, weekStart, weekEnd));
  const monthlyTotal = sum(inRange(expenses, monthStart, monthEnd));
  const monthlyExpenses = inRange(expenses, monthStart, monthEnd);
  const uniqueDays = new Set(monthlyExpenses.map((e) => dayKey(new Date(e.at)))).size;
  const avgDaily = uniqueDays > 0 ? monthlyTotal / uniqueDays : 0;
  const transactionCount = counted(expenses).length;

  return {
    weeklyTotal,
    monthlyTotal,
    avgDaily,
    transactionCount,
  };
}

const HOUR_LABELS = ['12a', '4a', '8a', '12p', '4p', '8p'];
const hour = (h: number) => `${h % 12 || 12} ${h % 24 < 12 ? 'AM' : 'PM'}`;

export function periodData(
  expenses: Expense[],
  period: Period,
  offset: number,
  today = TODAY
): PeriodData {
  const now = today.getTime();
  const bucket = (key: string, label: string, title: string, start: Date, end: Date): Bucket => ({
    key,
    label,
    title,
    start,
    end,
    value: sum(inRange(expenses, start, end)),
    future: start.getTime() > now,
  });

  if (period === 'day') {
    const day = addDays(startOfDay(today), offset);
    const buckets = HOUR_LABELS.map((label, i) => {
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), i * 4);
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), i * 4 + 4);
      return bucket(`h${i}`, label, `${hour(i * 4)} – ${hour(i * 4 + 4)}`, start, end);
    });
    const last = buckets.reduce((m, b, i) => (b.value > 0 ? i : m), 0);
    return {
      range: formatLongDay(day),
      noun: offset === 0 ? 'today' : 'this day',
      total: sum(onDay(expenses, day)),
      buckets,
      defaultIndex: last,
    };
  }

  if (period === 'week') {
    const base = startOfDay(today);
    const sunday = addDays(base, -base.getDay() + offset * 7);
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(sunday, i);
      return bucket(dayKey(d), weekdayShort(d), weekdayName(d), d, addDays(d, 1));
    });
    const saturday = addDays(sunday, 6);
    const sameMonth = sunday.getMonth() === saturday.getMonth();
    const range = sameMonth
      ? `${sunday.getDate()} – ${saturday.getDate()} ${monthName(saturday)} ${saturday.getFullYear()}`
      : `${sunday.getDate()} ${monthName(sunday).slice(0, 3)} – ${saturday.getDate()} ${monthName(saturday).slice(0, 3)} ${saturday.getFullYear()}`;
    const todayIndex = buckets.findIndex((b) => sameDay(b.start, today));
    return {
      range,
      noun: offset === 0 ? 'this week' : 'that week',
      total: sum(inRange(expenses, sunday, addDays(sunday, 7))),
      buckets,
      defaultIndex: todayIndex >= 0 ? todayIndex : 6,
    };
  }

  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const next = new Date(first.getFullYear(), first.getMonth() + 1, 1);
  const buckets: Bucket[] = [];
  for (let start = first, i = 1; start < next; start = addDays(start, 7), i++) {
    const end = addDays(start, 7) < next ? addDays(start, 7) : next;
    const endDay = addDays(end, -1).getDate();
    buckets.push(
      bucket(`w${i}`, `W${i}`, `${start.getDate()} – ${endDay} ${monthName(first)}`, start, end)
    );
  }
  const current = buckets.findIndex((b) => now >= b.start.getTime() && now < b.end.getTime());
  return {
    range: `${monthName(first)} ${first.getFullYear()}`,
    noun: offset === 0 ? 'this month' : 'that month',
    total: sum(inRange(expenses, first, next)),
    buckets,
    defaultIndex: current >= 0 ? current : buckets.length - 1,
  };
}
