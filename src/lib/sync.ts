import { create } from 'zustand';

import { SYNCED_SETTINGS, useStore, type RemoteChanges, type SyncedSettings } from './store';
import { supabase } from './supabase';
import type { Expense } from './types';

// Two-way backup: push local edits newer than the last push, then pull server rows newer than the
// last pull. Each expense keeps whichever edit is newest, on the server and on every device.

interface ExpenseRow {
  id: string;
  data: Expense | null;
  updated_at: number;
  deleted: boolean;
  synced_at: string;
}

const PAGE = 500;

export const useSyncStatus = create<{ syncing: boolean; error: string | null }>(() => ({
  syncing: false,
  error: null,
}));

let running: Promise<void> | null = null;

// Safe to call often: concurrent calls share one run.
export function syncNow() {
  running ??= run().finally(() => (running = null));
  return running;
}

async function run() {
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return;

  useSyncStatus.setState({ syncing: true, error: null });
  try {
    await push();
    await pull();
    useStore.getState().setSync({ lastSyncedAt: Date.now() });
  } catch (e) {
    useSyncStatus.setState({ error: e instanceof Error ? e.message : 'Sync failed' });
  } finally {
    useSyncStatus.setState({ syncing: false });
  }
}

async function push() {
  const { expenses, deleted, settings, settingsUpdatedAt, sync, setSync } = useStore.getState();
  // Taken before reading, so edits made while uploading go out on the next run.
  const startedAt = Date.now();
  const since = sync.pushedAt;

  const rows = [
    ...expenses
      .filter((e) => since === 0 || (e.updatedAt ?? 0) > since)
      .map((e) => ({ id: e.id, data: e, updated_at: e.updatedAt ?? 0, deleted: false })),
    ...Object.entries(deleted)
      .filter(([, at]) => at > since)
      .map(([id, at]) => ({ id, data: null, updated_at: at, deleted: true })),
  ];
  const settingsRow =
    since === 0 || settingsUpdatedAt > since
      ? {
          data: Object.fromEntries(SYNCED_SETTINGS.map((k) => [k, settings[k]])),
          updated_at: settingsUpdatedAt,
        }
      : null;

  if (rows.length || settingsRow) {
    const { error } = await supabase!.rpc('push_changes', {
      expenses: rows,
      settings: settingsRow,
    });
    if (error) throw error;
  }
  setSync({ pushedAt: startedAt });
}

async function pull() {
  const { sync, applyRemote, setSync } = useStore.getState();
  let cursor = sync.pulledAt;
  const changes: RemoteChanges = { upserts: [], deletes: {} };

  for (;;) {
    let query = supabase!
      .from('expenses')
      .select('id, data, updated_at, deleted, synced_at')
      .order('synced_at', { ascending: true })
      .limit(PAGE);
    if (cursor) query = query.gt('synced_at', cursor);
    const { data, error } = await query.returns<ExpenseRow[]>();
    if (error) throw error;

    for (const row of data) {
      if (row.deleted || !row.data) changes.deletes[row.id] = row.updated_at;
      else changes.upserts.push({ ...row.data, updatedAt: row.updated_at });
    }
    if (data.length) cursor = data[data.length - 1].synced_at;
    if (data.length < PAGE) break;
  }

  const { data: settingsRow, error } = await supabase!
    .from('user_settings')
    .select('data, updated_at')
    .maybeSingle<{ data: SyncedSettings; updated_at: number }>();
  if (error) throw error;
  if (settingsRow) changes.settings = { data: settingsRow.data, updatedAt: settingsRow.updated_at };

  applyRemote(changes);
  setSync({ pulledAt: cursor });
}

// After sign-out the next account starts from scratch: everything on this device is uploaded again.
export const resetSync = () =>
  useStore.getState().setSync({ pushedAt: 0, pulledAt: null, lastSyncedAt: null });
