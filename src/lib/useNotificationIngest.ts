import { useEffect } from 'react';
import { AppState } from 'react-native';

import * as Notifications from '../../modules/spendify-notifications';
import type { CapturedNotification } from '../../modules/spendify-notifications';

import { isDuplicate, parseNotification, SMS_APPS } from './notifications';
import { useHydrated, useStore } from './store';

// Parses captured items oldest-first into new expenses. Unparseable ones and duplicates of what is
// already logged are dropped.
function ingest(items: CapturedNotification[], source: 'notification' | 'sms') {
  const { expenses, settings, addExpense } = useStore.getState();
  const seen = [...expenses];
  for (const n of [...items].sort((a, b) => a.postedAt - b.postedAt)) {
    const e = parseNotification(n, source);
    if (!e || isDuplicate(e, seen, settings.mergeDuplicates)) continue;
    addExpense(e);
    seen.push({ ...e, id: n.key });
  }
}

// Moves alerts captured by the native listener into the store.
function drainNotifications() {
  const pending = Notifications.getPending();
  if (!pending.length) return;
  const { smsAccess } = useStore.getState().settings;
  ingest(smsAccess ? pending.filter((n) => !SMS_APPS.has(n.packageName)) : pending, 'notification');
  Notifications.clearPending(pending.map((n) => n.key));
}

// Reads money SMS that arrived since the last read. The first read starts at the beginning of
// the current day, so turning SMS access on doesn't import the whole inbox.
function drainSms() {
  const { smsSince, setSmsSince } = useStore.getState();
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const messages = Notifications.readSms(smsSince || startOfToday);
  if (!messages.length) return;
  ingest(messages, 'sms');
  setSmsSince(Math.max(...messages.map((m) => m.postedAt)));
}

// Dev builds only: feed a fake HDFC debit SMS through the same path as a real inbox SMS (everything
// after the native inbox read), for testing on phones that can't receive a test SMS.
export function simulateBankSms() {
  const now = Date.now();
  ingest(
    [
      {
        key: `sms:dev-${now}`,
        packageName: 'sms',
        appName: 'VM-HDFCBK-S',
        title: 'VM-HDFCBK-S',
        text: 'Rs.50.00 debited from A/c XX1234 to VPA chaipoint@ybl on 02-11-26. UPI Ref 512345678901',
        postedAt: now,
      },
    ],
    'sms'
  );
}

// Runs `drain` on launch, whenever the app returns to the foreground, and on each live event.
function useDrain(
  enabled: boolean,
  drain: () => void,
  live: (listener: () => void) => { remove(): void }
) {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated || !enabled || !Notifications.isSupported) return;
    drain();
    const sub = live(drain);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') drain();
    });
    return () => {
      sub.remove();
      foreground.remove();
    };
  }, [hydrated, enabled, drain, live]);
}

export function useNotificationIngest() {
  const notifications = useStore((s) => s.settings.notificationAccess);
  const sms = useStore((s) => !!s.settings.smsAccess);
  useDrain(notifications, drainNotifications, Notifications.onNotification);
  useDrain(sms, drainSms, Notifications.onSms);
}

// Keeps the stored "Notification Access" and "SMS Access" switches in step with the real system
// permissions, which the user can change in Android settings at any time.
export function useNotificationAccessSync() {
  const updateSettings = useStore((s) => s.updateSettings);

  useEffect(() => {
    if (!Notifications.isSupported) return;
    const sync = () => {
      const notificationAccess = Notifications.hasAccess();
      const smsAccess = Notifications.hasSmsAccess();
      const { settings } = useStore.getState();
      if (
        settings.notificationAccess !== notificationAccess ||
        !!settings.smsAccess !== smsAccess
      ) {
        updateSettings({ notificationAccess, smsAccess });
      }
    };
    const unsubscribe = useStore.persist.onFinishHydration(sync);
    if (useStore.persist.hasHydrated()) sync();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      unsubscribe();
      sub.remove();
    };
  }, [updateSettings]);
}
