import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useHydrated, useStore } from './store';
import { supabase } from './supabase';
import { syncNow } from './sync';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

const DEBOUNCE = 3000;

// While signed in: sync on sign-in, whenever the app returns to the foreground, and a few seconds
// after any change to expenses or settings.
export function useAutoSync() {
  const session = useSession();
  const hydrated = useHydrated();
  const signedIn = !!session;

  useEffect(() => {
    if (!signedIn || !hydrated) return;
    syncNow();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useStore.subscribe((s, prev) => {
      if (
        s.expenses === prev.expenses &&
        s.deleted === prev.deleted &&
        s.settings === prev.settings
      )
        return;
      clearTimeout(timer);
      timer = setTimeout(syncNow, DEBOUNCE);
    });
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
      foreground.remove();
    };
  }, [signedIn, hydrated]);
}
