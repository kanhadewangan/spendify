import { Search } from 'lucide-react-native';
import { Switch as RNSwitch, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { Text } from './Text';

import { popIn } from '@/lib/motion';
import { useTheme } from '@/lib/ThemeProvider';
import { type, withAlpha } from '@/lib/theme';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

// The platform switch is the HIG switch (51 × 31, knob stretch, spring) — tinted with our tokens.
export function Switch({ checked, onChange, label }: SwitchProps) {
  const { c } = useTheme();
  return (
    <RNSwitch
      accessibilityLabel={label}
      value={checked}
      onValueChange={onChange}
      trackColor={{ true: c.tint, false: c.switchOff }}
      thumbColor={c.white}
      ios_backgroundColor={c.switchOff}
    />
  );
}

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchField({ value, onChange, placeholder = 'Search' }: SearchFieldProps) {
  const { c, scheme } = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: c.field }]}>
      <Search size={17} strokeWidth={2.25} color={c.label2} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.label2}
        accessibilityLabel={placeholder}
        inputMode="search"
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
        keyboardAppearance={scheme}
        selectionColor={c.tint}
        style={[type.body, styles.input, { color: c.label }]}
      />
    </View>
  );
}

interface StatusPillProps {
  label: string;
  tone?: 'tint' | 'orange' | 'gray';
}

export function StatusPill({ label, tone = 'tint' }: StatusPillProps) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const bg = tone === 'tint' ? c.tintSoft : withAlpha(c[tone], 0.16);
  return (
    <Animated.View
      entering={popIn(0.9, 200, 200, reduced)}
      style={[styles.pill, { backgroundColor: bg }]}>
      <Text variant="footnote" weight="600" color={tone}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: { flex: 1, height: 36, paddingVertical: 0, outlineStyle: 'none' } as object,
  fieldCell: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  fieldInput: { flex: 1, minHeight: 44, paddingVertical: 0, outlineStyle: 'none' } as object,
  tabular: { fontVariant: ['tabular-nums'] },
  fieldRule: {
    position: 'absolute',
    left: 16,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  pill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});

interface TextFieldCellProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
  autoFocus?: boolean;
  last?: boolean;
}

// Inset-group row with a label on the left and an editable value on the right.
export function TextFieldCell({
  label,
  value,
  onChange,
  placeholder,
  numeric,
  autoFocus,
  last,
}: TextFieldCellProps) {
  const { c, scheme } = useTheme();
  return (
    <View style={styles.fieldCell}>
      <Text>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.label2}
        accessibilityLabel={label}
        autoFocus={autoFocus}
        keyboardType={numeric ? 'number-pad' : 'default'}
        inputMode={numeric ? 'numeric' : 'text'}
        keyboardAppearance={scheme}
        selectionColor={c.tint}
        textAlign="right"
        style={[type.body, styles.fieldInput, numeric && styles.tabular, { color: c.label }]}
      />
      {!last && <View style={[styles.fieldRule, { backgroundColor: c.separator }]} />}
    </View>
  );
}
