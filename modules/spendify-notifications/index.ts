import { requireOptionalNativeModule } from 'expo';
import { PermissionsAndroid } from 'react-native';

interface EventSubscription {
  remove(): void;
}

// A captured notification, or an inbox SMS in the same shape (packageName 'sms', appName = sender).
export interface CapturedNotification {
  key: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  postedAt: number;
}

interface NativeModule {
  hasAccess(): boolean;
  openAccessSettings(): void;
  getPending(): CapturedNotification[];
  clearPending(keys: string[]): void;
  hasSmsAccess(): boolean;
  readSms(since: number): CapturedNotification[];
  addListener(event: 'onNotification' | 'onSms', listener: () => void): EventSubscription;
}

// Android only. Null on iOS and web, where apps cannot read other apps' notifications or SMS.
const native = requireOptionalNativeModule<NativeModule>('SpendifyNotifications');

export const isSupported = native != null;

export const hasAccess = () => native?.hasAccess() ?? false;

export const openAccessSettings = () => native?.openAccessSettings();

export const getPending = () => native?.getPending() ?? [];

export const clearPending = (keys: string[]) => {
  if (keys.length) native?.clearPending(keys);
};

export const onNotification = (listener: () => void) =>
  native?.addListener('onNotification', listener) ?? { remove() {} };

export const hasSmsAccess = () => native?.hasSmsAccess() ?? false;

// Shows Android's "Allow Spendify to view SMS messages?" prompt. Resolves to whether it was granted.
export async function requestSmsAccess() {
  if (!native) return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

// Money SMS received after `since` (ms), oldest first.
export const readSms = (since: number) => native?.readSms(since) ?? [];

export const onSms = (listener: () => void) =>
  native?.addListener('onSms', listener) ?? { remove() {} };
