import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

// Completes a web OAuth redirect if this page was opened as the popup (no-op on native).
WebBrowser.maybeCompleteAuthSession();

// Where Supabase sends the browser back: spendify://auth-callback on Android.
// Must be listed under Supabase → Authentication → URL Configuration → Redirect URLs.
export const AUTH_CALLBACK = Linking.createURL('auth-callback');

// Google sign-in through Supabase Auth: open Google in an in-app browser, receive a one-time code
// on the callback URL, and exchange it for a session (PKCE).
// Resolves to an error message, or null when signed in or cancelled.
export async function signInWithGoogle(): Promise<string | null> {
  if (!supabase) return 'Backup isn’t set up in this build.';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: AUTH_CALLBACK, skipBrowserRedirect: true },
  });
  if (error) return error.message;

  const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_CALLBACK);
  if (result.type !== 'success') return null;

  const params = new URL(result.url).searchParams;
  const code = params.get('code');
  if (!code) return params.get('error_description') ?? 'Google sign-in didn’t finish.';

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return exchangeError?.message ?? null;
}
