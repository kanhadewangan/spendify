// ₹1,245 · Indian digit grouping (12,34,567).
export function formatINR(value: number): string {
  const n = Math.round(Math.abs(value));
  const s = String(n);
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${value < 0 ? '−' : ''}₹${rest ? `${rest},${last3}` : last3}`;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const weekdayName = (d: Date) => DAYS[d.getDay()];
export const weekdayShort = (d: Date) => DAYS[d.getDay()][0];
export const monthName = (d: Date) => MONTHS[d.getMonth()];
export const monthShort = (d: Date) => MONTHS[d.getMonth()].slice(0, 3);

// 8:42 PM
export function formatTime(d: Date): string {
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

// 26 Apr 2025
export const formatShortDate = (d: Date) => `${d.getDate()} ${monthShort(d)} ${d.getFullYear()}`;

// Saturday, 26 April
export const formatLongDay = (d: Date) => `${weekdayName(d)}, ${d.getDate()} ${monthName(d)}`;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
