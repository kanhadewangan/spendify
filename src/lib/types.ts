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
  source: 'notification' | 'manual';
  sourceApp?: string;
  paymentMethod?: string;
  orderId?: string;
  items?: { name: string; qty: number; amount: number }[];
  vendor?: string;
  countInTotals: boolean;
  // Letter-tile fill override (token name); defaults to the category colour.
  tile?: 'bg3' | 'red' | 'yellow';
}

export type ThemeSetting = 'system' | 'dark' | 'light';

export interface Settings {
  theme: ThemeSetting;
  notificationAccess: boolean;
  dailyLimit: number;
  mergeDuplicates: boolean;
  onboarded: boolean;
  profile: { name: string; initials: string };
}
