import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/lib/ThemeProvider';

// Soft tint glow behind the top of a screen. Sits under content and never takes touches.
export function Backdrop({ height = 380 }: { height?: number }) {
  const { c } = useTheme();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[c.glow, c.glowMid, c.glowFade]}
      locations={[0, 0.55, 1]}
      style={[styles.backdrop, { height }]}
    />
  );
}

interface GradientCardProps {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

// Card surface (--bg-2) with a faint diagonal tint sheen from the top-left corner.
export function GradientCard({ style, children }: GradientCardProps) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.bg2,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.cardStroke,
          borderCurve: 'continuous',
        },
        style,
      ]}>
      <LinearGradient
        pointerEvents="none"
        colors={[c.sheen, c.sheenFade]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0 },
});

const glassAvailable = isLiquidGlassAvailable();

// iOS 26 Liquid Glass surface. Falls back to the gradient card where glass isn't available
// (older iOS, Android, web).
export function GlassCard({ style, children }: GradientCardProps) {
  const { c, scheme } = useTheme();
  if (!glassAvailable) return <GradientCard style={style}>{children}</GradientCard>;
  return (
    <GlassView
      glassEffectStyle="regular"
      colorScheme={scheme}
      tintColor={c.glassTint}
      style={[{ overflow: 'hidden', borderCurve: 'continuous' }, style]}>
      {children}
    </GlassView>
  );
}

// Two soft colour orbs for the glass to refract. Decorative; sits behind a GlassCard.
export function GlassOrbs() {
  const { c } = useTheme();
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <RadialGradient id="orbA" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={c.orbA} />
          <Stop offset="0.4" stopColor={c.orbA} stopOpacity="0.6" />
          <Stop offset="1" stopColor={c.orbA} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="orbB" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={c.orbB} />
          <Stop offset="0.4" stopColor={c.orbB} stopOpacity="0.5" />
          <Stop offset="1" stopColor={c.orbB} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="orbC" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={c.tint} stopOpacity="0.3" />
          <Stop offset="1" stopColor={c.tint} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx="15%" cy="25%" rx="38%" ry="42%" fill="url(#orbA)" />
      <Ellipse cx="88%" cy="75%" rx="32%" ry="38%" fill="url(#orbB)" />
      <Ellipse cx="50%" cy="90%" rx="28%" ry="24%" fill="url(#orbC)" />
    </Svg>
  );
}
