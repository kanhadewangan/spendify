export type Category = 'food' | 'shopping' | 'groceries' | 'travel' | 'others';
export type Status = 'delivered' | 'placed' | 'paid' | 'refunded';

export const CATEGORIES: Category[] = ['food', 'shopping', 'groceries', 'travel', 'others'];

export const categoryLabel: Record<Category, string> = {
  food: 'Food',
  shopping: 'Shopping',
  groceries: 'Groceries',
  travel: 'Travel',
  others: 'Others',
};

export interface Expense {
  id: string;
  merchant: string;
  initial: string;
  category: Category;
  amount: number;
  at: string;
  status: Status;
  source: 'notification' | 'sms' | 'manual';
  sourceApp?: string;
  paymentMethod?: string;
  orderId?: string;
  items?: { name: string; qty: number; amount: number }[];
  vendor?: string;
  countInTotals: boolean;
  // Set on entries created from a captured notification, so the same alert is never logged twice.
  notificationKey?: string;
  // Last local edit (ms). Seed data has none. Backup sync keeps the newest edit of each expense.
  updatedAt?: number;
  // Letter-tile fill override (token name); defaults to the category colour.
  tile?: 'bg3' | 'red' | 'yellow';
}

export type ThemeSetting = 'system' | 'dark' | 'light';

export interface Settings {
  theme: ThemeSetting;
  notificationAccess: boolean;
  // Mirrors Android's READ_SMS permission; per device, never synced.
  smsAccess?: boolean;
  dailyLimit: number;
  mergeDuplicates: boolean;
  onboarded: boolean;
  profile: { name: string; initials: string };
}
