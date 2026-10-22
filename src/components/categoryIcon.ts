import {
  Car,
  CircleEllipsis,
  ShoppingBag,
  ShoppingBasket,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

import type { Category } from '@/lib/types';

export const categoryIcon: Record<Category, LucideIcon> = {
  food: UtensilsCrossed,
  shopping: ShoppingBag,
  groceries: ShoppingBasket,
  travel: Car,
  others: CircleEllipsis,
};
