import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { sortRecent } from './selectors';
import type { Expense } from './types';

const COLUMNS: (keyof Expense)[] = [
  'id',
  'at',
  'merchant',
  'category',
  'amount',
  'status',
  'source',
  'sourceApp',
  'paymentMethod',
  'orderId',
  'vendor',
  'countInTotals',
];

const cell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(expenses: Expense[]): string {
  const rows = sortRecent(expenses).map((e) => COLUMNS.map((k) => cell(e[k])).join(','));
  return [COLUMNS.join(','), ...rows].join('\n');
}

// Web downloads the file; native writes it to the cache and opens the share sheet.
export async function exportCSV(expenses: Expense[]) {
  const csv = toCSV(expenses);
  const name = 'spendify-expenses.csv';
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export Data',
  });
}
