import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultSettings, seedExpenses } from './seed';
import type { Expense, Settings } from './types';

interface State {
  expenses: Expense[];
  settings: Settings;
  addExpense: (e: Omit<Expense, 'id'>) => string;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      expenses: seedExpenses,
      settings: defaultSettings,
      addExpense: (e) => {
        const id = `exp_${Date.now().toString(36)}`;
        set((s) => ({ expenses: [{ ...e, id }, ...s.expenses] }));
        return id;
      },
      updateExpense: (id, patch) =>
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'spendify:v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ expenses, settings }) => ({ expenses, settings }),
    }
  )
);

const subscribeHydration = (cb: () => void) => useStore.persist.onFinishHydration(cb);
const hasHydrated = () => useStore.persist.hasHydrated();

export const useHydrated = () => useSyncExternalStore(subscribeHydration, hasHydrated, hasHydrated);
