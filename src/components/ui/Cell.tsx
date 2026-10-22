import { useRouter, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableHighlight } from './Pressables';
import { Text } from './Text';

import { useTheme } from '@/lib/ThemeProvider';
import { size, type ColorToken } from '@/lib/theme';

export interface CellProps {
  leading?: ReactNode;
  // Width of the leading tile; sets the separator inset (16 + width + 12).
  leadingSize?: number;
  title: string;
  titleColor?: ColorToken;
  subtitle?: string;
  value?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  href?: Href;
  onPress?: () => void;
  centered?: boolean;
  last?: boolean;
  accessibilityLabel?: string;
}

export function Cell({
  leading,
  leadingSize,
  title,
  titleColor = 'label',
  subtitle,
  value,
  trailing,
  chevron,
  href,
  onPress,
  centered,
  last,
  accessibilityLabel,
}: CellProps) {
  const { c } = useTheme();
  const router = useRouter();
  const inset = leading && leadingSize ? size.inset + leadingSize + 12 : size.inset;
  const height = subtitle || (leadingSize ?? 0) >= size.tile ? size.cellSubtitle : size.cell;

  const body = (
    <View style={[styles.row, { minHeight: height }]}>
      {leading}
      <View style={[styles.content, centered && styles.centered]}>
        <View style={[styles.text, centered && styles.centered]}>
          <Text color={titleColor} numberOfLines={1} align={centered ? 'center' : undefined}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="subheadline" color="label2" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {typeof value === 'string' ? (
          <Text color="label2" tabular numberOfLines={1}>
            {value}
          </Text>
        ) : (
          value
        )}
        {trailing}
        {chevron && (
          <ChevronRight size={18} strokeWidth={2.5} color={c.chevron} style={styles.chevron} />
        )}
      </View>
      {!last && (
        <View
          style={[styles.separator, { left: inset, backgroundColor: c.separator }]}
          pointerEvents="none"
        />
      )}
    </View>
  );

  if (!href && !onPress) {
    return (
      <View accessible={!trailing} accessibilityLabel={accessibilityLabel}>
        {body}
      </View>
    );
  }
  return (
    <PressableHighlight
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        onPress?.();
        if (href) router.push(href);
      }}>
      {body}
    </PressableHighlight>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: size.inset,
    gap: 14,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingRight: size.inset,
    gap: 10,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  text: { flex: 1, justifyContent: 'center', paddingVertical: 10, gap: 2 },
  chevron: { marginLeft: -2, marginRight: -4 },
  separator: { position: 'absolute', right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
});
