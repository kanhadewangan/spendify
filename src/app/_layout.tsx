import '../../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/lib/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { c } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade', animationDuration: 350 }} />
      {/* Push to Detail: the native iOS push (incoming slides in over a dimmed, shifted page). */}
      <Stack.Screen name="expenses/[id]" options={{ animation: 'default' }} />
      <Stack.Screen
        name="expense-form"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.92],
          sheetGrabberVisible: true,
          sheetCornerRadius: 14,
          contentStyle: { backgroundColor: c.bg },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ReducedMotionConfig mode={ReduceMotion.System} />
      <ThemeProvider>
        <RootStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
