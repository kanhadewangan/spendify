import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { Text } from './Text';

import { rowEntering, rowExiting, rowLayout } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';
import { radius, size } from '@/lib/theme';

interface InsetGroupProps {
  header?: string;
  headerTrailing?: ReactNode;
  footer?: string;
  children: ReactNode;
  // Stagger rows in on mount and collapse them on removal.
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function InsetGroup({
  header,
  headerTrailing,
  footer,
  children,
  animated,
  style,
}: InsetGroupProps) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  // The last row drops its separator.
  const rows = Children.toArray(children)
    .filter(isValidElement)
    .map((row, i, all) =>
      i === all.length - 1
        ? cloneElement(row as ReactElement<{ last?: boolean }>, { last: true })
        : row
    );
  return (
    <Animated.View layout={animated ? rowLayout : undefined} style={[styles.section, style]}>
      {(header || headerTrailing) && (
        <View style={styles.header}>
          {header ? (
            <Text variant="footnote" color="label2" upper accessibilityRole="header">
              {header}
            </Text>
          ) : (
            <View />
          )}
          {typeof headerTrailing === 'string' ? (
            <Text variant="footnote" color="label2" tabular>
              {headerTrailing}
            </Text>
          ) : (
            headerTrailing
          )}
        </View>
      )}
      <View role="list" style={[styles.group, { backgroundColor: c.bg2 }]}>
        {rows.map((row, i) =>
          animated ? (
            <Animated.View
              role="listitem"
              key={row.key}
              entering={rowEntering(i, reduced)}
              exiting={rowExiting(reduced)}
              layout={rowLayout}>
              {row}
            </Animated.View>
          ) : (
            <View role="listitem" key={row.key}>
              {row}
            </View>
          )
        )}
      </View>
      {footer && (
        <Text variant="footnote" color="label2" style={styles.footer}>
          {footer}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: size.headerInset,
    paddingRight: size.headerInset,
    paddingBottom: 7,
    minHeight: 25,
  },
  group: {
    marginHorizontal: size.inset,
    borderRadius: radius.group,
    overflow: 'hidden',
  },
  footer: { paddingHorizontal: size.headerInset, paddingTop: 7 },
});
