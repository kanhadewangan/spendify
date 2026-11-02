import { useRouter } from 'expo-router';
import { useEffect } from 'react';

// Landing route for spendify://auth-callback. The in-app browser already handed the code to
// signInWithGoogle(); if the OS also routes the link here, just return to where the user was.
export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/backup');
  }, [router]);
  return null;
}
