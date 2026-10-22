import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/lib/ThemeProvider';
import { type, type ColorToken, type TypeVariant } from '@/lib/theme';

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: ColorToken;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  upper?: boolean;
  tabular?: boolean;
}

export function Text({
  variant = 'body',
  color = 'label',
  weight,
  align,
  upper,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  const { c } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        type[variant],
        { color: c[color] },
        weight && { fontWeight: weight },
        align && { textAlign: align },
        upper && { textTransform: 'uppercase' },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
