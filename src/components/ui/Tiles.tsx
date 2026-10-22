import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './Text';

import { useTheme } from '@/lib/ThemeProvider';
import { radius, size as sizes, tileTextColor, type ColorToken } from '@/lib/theme';

interface LetterTileProps {
  initial: string;
  color: ColorToken;
  size?: number;
}

export function LetterTile({ initial, color, size = sizes.tile }: LetterTileProps) {
  const { c } = useTheme();
  const text: ColorToken = color === 'bg3' || color === 'fill' ? 'label' : tileTextColor(color);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: c[color],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        color={text}
        weight="600"
        style={{ fontSize: size * 0.45, lineHeight: size * 0.55, letterSpacing: 0 }}>
        {initial}
      </Text>
    </View>
  );
}

interface SymbolTileProps {
  icon: (color: string, size: number) => ReactNode;
  color: ColorToken;
  size?: number;
}

// iOS Settings-style icon square.
export function SymbolTile({ icon, color, size = sizes.icon }: SymbolTileProps) {
  const { c } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size === sizes.icon ? radius.icon : size / 4,
        backgroundColor: c[color],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {icon(c[tileTextColor(color)], Math.round(size * 0.62))}
    </View>
  );
}
