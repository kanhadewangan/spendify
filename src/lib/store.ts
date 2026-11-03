import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultSettings, seedExpenses } from './seed';
import type { Expense, Settings } from './types';

// Settings that follow the user to other devices. Notification access and onboarding are per-device.
export const SYNCED_SETTINGS = ['theme', 'dailyLimit', 'mergeDuplicates', 'profile'] as const;
export type SyncedSettings = Pick<Settings, (typeof SYNCED_SETTINGS)[number]>;

export interface SyncState {
  // Local edit time (ms) up to which changes have been uploaded.
  pushedAt: number;
  // Server cursor: the newest `synced_at` already pulled.
  pulledAt: string | null;
  lastSyncedAt: number | null;
}

export interface RemoteChanges {
  upserts: Expense[];
  deletes: Record<string, number>;
  settings?: { data: SyncedSettings; updatedAt: number };
}

interface State {
  expenses: Expense[];
  settings: Settings;
  // Tombstones: id → deletion time, so deletes reach other devices.
  deleted: Record<string, number>;
  settingsUpdatedAt: number;
  sync: SyncState;
  // Receive time (ms) of the newest SMS already read from the inbox. 0 = never read.
  smsSince: number;
  setSmsSince: (at: number) => void;
  addExpense: (e: Omit<Expense, 'id'>) => string;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setSync: (patch: Partial<SyncState>) => void;
  // Merge pulled rows: each one wins only if it is newer than what this device has.
  applyRemote: (changes: RemoteChanges) => void;
}

const initialSync: SyncState = { pushedAt: 0, pulledAt: null, lastSyncedAt: null };

export const useStore = create<State>()(
  persist(
    (set) => ({
      expenses: seedExpenses,
      settings: defaultSettings,
      deleted: {},
      settingsUpdatedAt: 0,
      sync: initialSync,
      smsSince: 0,
      setSmsSince: (at) => set({ smsSince: at }),
      addExpense: (e) => {
        const id = `exp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({ expenses: [{ ...e, id, updatedAt: Date.now() }, ...s.expenses] }));
        return id;
      },
      updateExpense: (id, patch) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e
          ),
        })),
      removeExpense: (id) =>
        set((s) => ({
          expenses: s.expenses.filter((e) => e.id !== id),
          deleted: { ...s.deleted, [id]: Date.now() },
        })),
      updateSettings: (patch) =>
        set((s) => ({
          settings: { ...s.settings, ...patch },
          settingsUpdatedAt: SYNCED_SETTINGS.some((k) => k in patch)
            ? Date.now()
            : s.settingsUpdatedAt,
        })),
      setSync: (patch) => set((s) => ({ sync: { ...s.sync, ...patch } })),
      applyRemote: ({ upserts, deletes, settings }) =>
        set((s) => {
          const local = new Map(s.expenses.map((e) => [e.id, e]));
          const deleted = { ...s.deleted };
          const localTime = (id: string) =>
            Math.max(local.get(id)?.updatedAt ?? 0, deleted[id] ?? 0);

          let changed = false;
          for (const e of upserts) {
            const known = local.has(e.id) || e.id in deleted;
            if (known && (e.updatedAt ?? 0) <= localTime(e.id)) continue;
            local.set(e.id, e);
            delete deleted[e.id];
            changed = true;
          }
          for (const [id, at] of Object.entries(deletes)) {
            if (at <= localTime(id)) continue;
            local.delete(id);
            deleted[id] = at;
            changed = true;
          }

          const takeSettings = settings && settings.updatedAt > s.settingsUpdatedAt;
          // Returning the same state skips the update, so an empty pull can't re-trigger auto-sync.
          if (!changed && !takeSettings) return s;
          return {
            expenses: [...local.values()],
            deleted,
            ...(takeSettings && {
              settings: { ...s.settings, ...settings.data },
              settingsUpdatedAt: settings.updatedAt,
            }),
          };
        }),
    }),
    {
      name: 'spendify:v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ expenses, settings, deleted, settingsUpdatedAt, sync, smsSince }) => ({
        expenses,
        settings,
        deleted,
        settingsUpdatedAt,
        sync,
        smsSince,
      }),
    }
  )
);

const subscribeHydration = (cb: () => void) => useStore.persist.onFinishHydration(cb);
const hasHydrated = () => useStore.persist.hasHydrated();

export const useHydrated = () => useSyncExternalStore(subscribeHydration, hasHydrated, hasHydrated);
