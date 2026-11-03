import { CloudUpload } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Alert,
  Backdrop,
  Button,
  Cell,
  EmptyState,
  InlineNavBar,
  InsetGroup,
  Text,
  TextFieldCell,
} from '@/components/ui';
import { formatShortDate, formatTime } from '@/lib/format';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { resetSync, syncNow, useSyncStatus } from '@/lib/sync';
import { useTheme } from '@/lib/ThemeProvider';
import { useSession } from '@/lib/useBackup';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Matches Supabase → Authentication → Providers → Email → Minimum password length.
const MIN_PASSWORD = 8;
const BACK = { label: 'Settings', href: '/settings' } as const;
const WHAT =
  'Only your expenses and settings are backed up — never the text of your notifications. Sign in with the same email on another phone to restore.';

function lastSynced(at: number | null) {
  if (!at) return 'Never';
  const d = new Date(at);
  const today = new Date().toDateString() === d.toDateString();
  return today ? `Today, ${formatTime(d)}` : `${formatShortDate(d)}, ${formatTime(d)}`;
}

// Backup & Sync: sign in with email + password or an emailed code; then expenses and settings
// sync on their own. (Google sign-in is ready in lib/googleSignIn.ts but not shown yet.)
export default function Backup() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const lastSyncedAt = useStore((s) => s.sync.lastSyncedAt);
  const { syncing, error: syncError } = useSyncStatus();

  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  // Which code we're waiting for: a sign-in code, or the confirmation code after creating an account.
  const [codeType, setCodeType] = useState<'email' | 'signup'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'signout' | 'delete' | null>(null);

  if (!supabase) {
    return (
      <View style={styles.fill}>
        <InlineNavBar title="Backup & Sync" back={BACK} />
        <EmptyState
          title="Backup Isn’t Set Up"
          message="This build has no backup server configured. Your data is kept on this device only."
        />
      </View>
    );
  }
  const sb = supabase;

  const attempt = async (fn: () => Promise<{ error: Error | null }>) => {
    setBusy(true);
    setError(null);
    const { error: e } = await fn();
    setBusy(false);
    if (e) setError(e.message);
    return !e;
  };

  const validEmail = () => {
    const to = email.trim().toLowerCase();
    if (EMAIL.test(to)) return to;
    setError('Enter a valid email address.');
    return null;
  };

  const awaitCode = (to: string, type: 'email' | 'signup') => {
    setCodeType(type);
    setSentTo(to);
    setCode('');
  };

  const sendCode = async () => {
    const to = validEmail();
    if (to && (await attempt(() => sb.auth.signInWithOtp({ email: to })))) awaitCode(to, 'email');
  };

  const signIn = async () => {
    const to = validEmail();
    if (!to) return;
    if (!password) return setError('Enter your password.');
    await attempt(() => sb.auth.signInWithPassword({ email: to, password }));
  };

  const createAccount = async () => {
    const to = validEmail();
    if (!to) return;
    if (password.length < MIN_PASSWORD) {
      return setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
    }
    setBusy(true);
    setError(null);
    const { data, error: e } = await sb.auth.signUp({ email: to, password });
    setBusy(false);
    if (e) return setError(e.message);
    // With "Confirm email" on, Supabase sends a code and returns no session until it's entered.
    if (!data.session) awaitCode(to, 'signup');
  };

  const verify = () =>
    attempt(() => sb.auth.verifyOtp({ email: sentTo!, token: code, type: codeType }));

  const signOut = async () => {
    await sb.auth.signOut();
    resetSync();
    setSentTo(null);
    setPassword('');
  };

  const deleteAccount = async () => {
    if (await attempt(async () => sb.rpc('delete_my_account'))) {
      await sb.auth.signOut({ scope: 'local' });
      resetSync();
      setSentTo(null);
    }
  };

  const message = error ?? syncError;

  return (
    <View style={styles.fill}>
      <Backdrop />
      <InlineNavBar title="Backup & Sync" back={BACK} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: c.tint }]}>
            <CloudUpload size={34} strokeWidth={2} color={c.onTint} />
          </View>
          <Text variant="subheadline" color="label2" align="center">
            {session
              ? 'Your expenses back up automatically and stay in sync on every phone you sign in to.'
              : 'Back up your expenses and keep them in sync across phones.'}
          </Text>
        </View>

        {session ? (
          <>
            <InsetGroup footer={WHAT}>
              <Cell key="account" title="Account" value={session.user.email} />
              <Cell
                key="last"
                title="Last synced"
                value={syncing ? 'Syncing…' : lastSynced(lastSyncedAt)}
              />
            </InsetGroup>
            <View style={styles.actions}>
              <Button
                label={syncing ? 'Syncing…' : 'Back Up Now'}
                onPress={() => !syncing && syncNow()}
              />
            </View>
            <InsetGroup>
              <Cell
                key="signout"
                title="Sign Out"
                titleColor="tint"
                centered
                onPress={() => setConfirm('signout')}
              />
              <Cell
                key="delete"
                title="Delete Backup & Account"
                titleColor="red"
                centered
                onPress={() => setConfirm('delete')}
              />
            </InsetGroup>
          </>
        ) : sentTo ? (
          <>
            <InsetGroup
              footer={
                codeType === 'signup'
                  ? `To confirm your account, enter the code we sent to ${sentTo}. Already have an account? Go back and sign in.`
                  : `We sent a code to ${sentTo}. It can take a minute to arrive.`
              }>
              <TextFieldCell
                key="code"
                label="Code"
                value={code}
                onChange={(t) => setCode(t.replace(/\D/g, ''))}
                placeholder="123456"
                numeric
                code
                autoFocus
                last
              />
            </InsetGroup>
            <View style={styles.actions}>
              <Button
                label={busy ? 'Checking…' : 'Verify'}
                onPress={() => !busy && code.length >= 6 && verify()}
              />
              <Button label="Back" variant="plain" onPress={() => setSentTo(null)} />
            </View>
          </>
        ) : (
          <>
            <InsetGroup footer={WHAT}>
              <TextFieldCell
                key="email"
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                email
                last={mode === 'code'}
              />
              {mode === 'password' && (
                <TextFieldCell
                  key="password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  placeholder={creating ? `${MIN_PASSWORD}+ characters` : 'Required'}
                  password={creating ? 'new' : 'current'}
                  last
                />
              )}
            </InsetGroup>
            {mode === 'password' ? (
              <View style={styles.actions}>
                <Button
                  label={busy ? 'Please wait…' : creating ? 'Create Account' : 'Sign In'}
                  onPress={() => !busy && (creating ? createAccount() : signIn())}
                />
                <Button
                  label={creating ? 'Have an account? Sign In' : 'New here? Create an Account'}
                  variant="plain"
                  onPress={() => {
                    setCreating(!creating);
                    setError(null);
                  }}
                />
                <Button
                  label="Email Me a Code Instead"
                  variant="plain"
                  onPress={() => {
                    setMode('code');
                    setError(null);
                  }}
                />
              </View>
            ) : (
              <View style={styles.actions}>
                <Button
                  label={busy ? 'Sending…' : 'Send Code'}
                  onPress={() => !busy && sendCode()}
                />
                <Button
                  label="Use a Password Instead"
                  variant="plain"
                  onPress={() => {
                    setMode('password');
                    setError(null);
                  }}
                />
              </View>
            )}
          </>
        )}

        {message && (
          <Text variant="footnote" color="red" align="center" style={styles.error}>
            {message}
          </Text>
        )}
      </ScrollView>

      <Alert
        visible={confirm !== null}
        onDismiss={() => setConfirm(null)}
        title={confirm === 'delete' ? 'Delete Backup & Account?' : 'Sign Out?'}
        message={
          confirm === 'delete'
            ? 'Your backup and account are permanently deleted. Expenses on this phone are kept.'
            : 'Expenses on this phone are kept. They stop syncing until you sign in again.'
        }
        actions={[
          { label: 'Cancel', role: 'cancel' },
          confirm === 'delete'
            ? { label: 'Delete', role: 'destructive', onPress: deleteAccount }
            : { label: 'Sign Out', onPress: signOut },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { alignItems: 'center', gap: 14, paddingTop: 20, paddingBottom: 24, paddingHorizontal: 32 },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { paddingHorizontal: 16, gap: 8, marginTop: -8, marginBottom: 24 },
  error: { paddingHorizontal: 32 },
});
