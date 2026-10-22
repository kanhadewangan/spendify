import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ease } from './motion';
import { useStore } from './store';
import { palettes, type Palette, type Scheme } from './theme';

interface ThemeValue {
  scheme: Scheme;
  c: Palette;
}

const ThemeContext = createContext<ThemeValue>({ scheme: 'dark', c: palettes.dark });

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const setting = useStore((s) => s.settings.theme);
  const system = useColorScheme();
  const scheme: Scheme = setting === 'system' ? (system === 'light' ? 'light' : 'dark') : setting;
  const value = useMemo(() => ({ scheme, c: palettes[scheme] }), [scheme]);

  // Theme change: cover the screen with the previous background and fade it out over 200 ms,
  // instead of transitioning every colour property.
  const reduced = useReducedMotion();
  const previous = useRef(scheme);
  const cover = useSharedValue(0);
  const coverColor = useSharedValue(palettes[scheme].bg);
  useEffect(() => {
    if (previous.current === scheme) return;
    coverColor.value = palettes[previous.current].bg;
    previous.current = scheme;
    cover.value = 1;
    cover.value = withTiming(0, { duration: reduced ? 150 : 200, easing: ease });
  }, [scheme, cover, coverColor, reduced]);
  const coverStyle = useAnimatedStyle(() => ({
    opacity: cover.value,
    backgroundColor: coverColor.value,
  }));

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.dataset.theme = scheme;
    document.documentElement.style.colorScheme = scheme;
    document.body.style.backgroundColor = palettes[scheme].bg;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = palettes[scheme].bg;
  }, [scheme]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={[styles.fill, { backgroundColor: value.c.bg }]}>
        {children}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, coverStyle]} />
      </View>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
