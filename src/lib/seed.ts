import type { Category, Expense, Settings, Status } from './types';

// The mock data is anchored to the design reference's "today" so the screens read as designed.
export const TODAY = new Date(2025, 3, 26, 21, 0);

type Row = [
  day: number,
  hour: number,
  minute: number,
  merchant: string,
  category: Category,
  amount: number,
  extra?: Partial<Expense>,
];

const rows: Row[] = [
  [
    26,
    20,
    42,
    'Swiggy',
    'food',
    320,
    {
      vendor: 'Burger King',
      items: [{ name: 'Whopper Meal', qty: 1, amount: 320 }],
      paymentMethod: 'UPI · Google Pay',
      orderId: 'SB12345678',
      status: 'delivered',
    },
  ],
  [
    26,
    18,
    15,
    'Amazon',
    'shopping',
    1245,
    { items: [{ name: 'Wireless TWS Earbuds', qty: 1, amount: 1245 }], status: 'placed' },
  ],
  [26, 16, 32, 'Zepto', 'groceries', 482],
  [26, 13, 10, 'Swiggy', 'food', 275],
  [26, 9, 5, 'Uber', 'travel', 298, { tile: 'bg3' }],
  // Small manual entries so today's count matches the reference (12 transactions).
  [26, 19, 30, 'Parking', 'others', 40],
  [26, 16, 0, 'Chai Point', 'others', 30],
  [26, 14, 15, 'Xerox Corner', 'others', 20],
  [26, 12, 0, 'Mobile Recharge', 'others', 49],
  [26, 10, 30, 'Laundry', 'others', 60],
  [26, 7, 10, 'Milk Booth', 'others', 28],
  [26, 6, 50, 'Newspaper', 'others', 10],
  [25, 20, 20, 'Zomato', 'food', 280, { tile: 'red' }],
  [25, 17, 10, 'Blinkit', 'groceries', 640, { tile: 'yellow' }],
  [25, 19, 45, 'Uber', 'travel', 910, { tile: 'bg3' }],
  [24, 11, 20, 'Amazon', 'shopping', 1260],
  [23, 19, 45, 'Uber', 'travel', 940, { tile: 'bg3' }],
  [22, 20, 5, 'Swiggy', 'food', 1520],
  [21, 18, 0, 'Zepto', 'groceries', 1240],
];

const apps = new Set(['Swiggy', 'Amazon', 'Zepto', 'Uber', 'Zomato', 'Blinkit']);

export const seedExpenses: Expense[] = rows.map(
  ([day, hour, minute, merchant, category, amount, extra], i) => {
    const fromApp = apps.has(merchant);
    return {
      id: `exp_${String(i + 1).padStart(3, '0')}`,
      merchant,
      initial: merchant[0],
      category,
      amount,
      at: new Date(2025, 3, day, hour, minute).toISOString(),
      status: 'paid' as Status,
      source: fromApp ? 'notification' : 'manual',
      sourceApp: fromApp ? merchant : undefined,
      paymentMethod: fromApp ? 'UPI · Google Pay' : 'Cash',
      orderId: fromApp ? `${merchant.slice(0, 2).toUpperCase()}${88000000 + i * 7919}` : undefined,
      countInTotals: true,
      ...extra,
    };
  }
);

export const defaultSettings: Settings = {
  theme: 'system',
  notificationAccess: false,
  dailyLimit: 3000,
  mergeDuplicates: true,
  onboarded: false,
  profile: { name: 'Kanha Dewangan', initials: 'KD' },
};
