import type { ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from './Pressables';
import { Text } from './Text';

import { useTheme } from '@/lib/ThemeProvider';
import { radius, size as sizes, type ColorToken } from '@/lib/theme';

type Variant = 'filled' | 'tinted' | 'gray' | 'plain' | 'destructive';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'lg' | 'md';
  capsule?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const look: Record<Variant, { bg?: ColorToken; fg: ColorToken }> = {
  filled: { bg: 'tint', fg: 'onTint' },
  tinted: { bg: 'tintSoft', fg: 'tint' },
  gray: { bg: 'fill2', fg: 'label' },
  plain: { fg: 'tint' },
  destructive: { fg: 'red' },
};

export function Button({
  label,
  onPress,
  variant = 'filled',
  size = 'lg',
  capsule,
  icon,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { c } = useTheme();
  const { bg, fg } = look[variant];
  const height = capsule ? sizes.capsule : size === 'lg' ? sizes.buttonLg : sizes.buttonMd;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      dimTo={variant === 'filled' ? 0.88 : 1}
      hitSlop={capsule ? 4 : 0}
      style={[
        {
          height,
          minWidth: 48,
          borderRadius: capsule ? height / 2 : radius.button,
          paddingHorizontal: capsule ? 18 : 22,
          backgroundColor: bg ? c[bg] : 'transparent',
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      {icon}
      <Text variant={capsule ? 'subheadline' : 'headline'} weight="600" color={fg}>
        {label}
      </Text>
    </PressableScale>
  );
}

interface CircleButtonProps {
  onPress?: () => void;
  accessibilityLabel: string;
  accessibilityRole?: 'button' | 'link';
  size?: number;
  background?: ColorToken;
  children: ReactNode;
}

// Round icon / monogram control (38 px trailing button, 34 px period arrows).
export function CircleButton({
  onPress,
  accessibilityLabel,
  accessibilityRole = 'button',
  size = 38,
  background = 'fill2',
  children,
}: CircleButtonProps) {
  const { c } = useTheme();
  return (
    <PressableScale
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={(44 - size) / 2}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c[background],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
    </PressableScale>
  );
}
