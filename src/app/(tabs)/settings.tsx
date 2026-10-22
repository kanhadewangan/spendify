import {
  BellRing,
  ChevronRight,
  CircleQuestionMark,
  Gauge,
  LayoutGrid,
  Merge,
  Share,
  ShieldCheck,
  SunMoon,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
  Alert,
  Cell,
  InsetGroup,
  LargeTitleScreen,
  PressableHighlight,
  SymbolTile,
  Switch,
  Text,
  type AlertAction,
} from '@/components/ui';
import { exportCSV } from '@/lib/csv';
import { formatINR } from '@/lib/format';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/ThemeProvider';
import { radius, size, type ColorToken } from '@/lib/theme';
import { CATEGORIES, type ThemeSetting } from '@/lib/types';

const tile = (Icon: LucideIcon, color: ColorToken) => (
  <SymbolTile color={color} icon={(fg, px) => <Icon size={px} strokeWidth={2.25} color={fg} />} />
);

const THEME_LABEL: Record<ThemeSetting, string> = {
  system: 'System',
  dark: 'Dark',
  light: 'Light',
};
const LIMITS = [2000, 3000, 5000];

interface Sheet {
  title: string;
  message?: string;
  actions: AlertAction[];
}

export default function Settings() {
  const { c } = useTheme();
  const settings = useStore((s) => s.settings);
  const expenses = useStore((s) => s.expenses);
  const updateSettings = useStore((s) => s.updateSettings);
  const [sheet, setSheetState] = useState<Sheet | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const setSheet = (next: Sheet) => {
    setSheetState(next);
    setSheetOpen(true);
  };
  const device = Platform.OS === 'ios' ? 'iPhone' : 'device';

  return (
    <LargeTitleScreen title="Settings">
      <InsetGroup>
        <PressableHighlight
          key="profile"
          accessibilityRole="button"
          accessibilityLabel={`${settings.profile.name}, local profile`}
          onPress={() =>
            setSheet({
              title: 'Local Profile',
              message: `Spendify doesn’t need an account. Your profile and expenses live only on this ${device}.`,
              actions: [{ label: 'OK', role: 'cancel' }],
            })
          }>
          <View style={styles.profile}>
            <View style={[styles.avatar, { backgroundColor: c.tint }]}>
              <Text variant="title2" weight="600" color="onTint">
                {settings.profile.initials}
              </Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.name}>{settings.profile.name}</Text>
              <Text variant="footnote" color="label2">
                Local profile · No account needed
              </Text>
            </View>
            <ChevronRight size={18} strokeWidth={2.5} color={c.chevron} />
          </View>
        </PressableHighlight>
      </InsetGroup>

      <InsetGroup
        header="Tracking"
        footer="When a bank SMS and an app alert describe the same payment, Spendify keeps one entry.">
        <Cell
          key="access"
          leading={tile(BellRing, 'red')}
          leadingSize={size.icon}
          title="Notification Access"
          value={settings.notificationAccess ? 'On' : 'Off'}
          chevron
          href="/onboarding"
        />
        <Cell
          key="limits"
          leading={tile(Gauge, 'orange')}
          leadingSize={size.icon}
          title="Spending Limits"
          value={`${formatINR(settings.dailyLimit)} / day`}
          chevron
          onPress={() =>
            setSheet({
              title: 'Daily Spending Limit',
              message: 'Spendify warns you when today’s total passes this amount.',
              actions: [
                ...LIMITS.map((limit) => ({
                  label: formatINR(limit),
                  onPress: () => updateSettings({ dailyLimit: limit }),
                })),
                { label: 'Cancel', role: 'cancel' as const },
              ],
            })
          }
        />
        <Cell
          key="categories"
          leading={tile(LayoutGrid, 'blue')}
          leadingSize={size.icon}
          title="Categories"
          value={String(CATEGORIES.length)}
          chevron
          href="/insights"
        />
        <Cell
          key="merge"
          leading={tile(Merge, 'purple')}
          leadingSize={size.icon}
          title="Merge duplicate alerts"
          trailing={
            <Switch
              label="Merge duplicate alerts"
              checked={settings.mergeDuplicates}
              onChange={(v) => updateSettings({ mergeDuplicates: v })}
            />
          }
        />
      </InsetGroup>

      <InsetGroup header="App">
        <Cell
          key="appearance"
          leading={tile(SunMoon, 'indigo')}
          leadingSize={size.icon}
          title="Appearance"
          value={THEME_LABEL[settings.theme]}
          chevron
          onPress={() =>
            setSheet({
              title: 'Appearance',
              actions: [
                ...(['light', 'dark', 'system'] as ThemeSetting[]).map((theme) => ({
                  label: `${THEME_LABEL[theme]}${settings.theme === theme ? ' ✓' : ''}`,
                  onPress: () => updateSettings({ theme }),
                })),
                { label: 'Cancel', role: 'cancel' as const },
              ],
            })
          }
        />
        <Cell
          key="export"
          leading={tile(Share, 'gray')}
          leadingSize={size.icon}
          title="Export Data"
          value="CSV"
          chevron
          onPress={() => exportCSV(expenses)}
        />
        <Cell
          key="help"
          leading={tile(CircleQuestionMark, 'cyan')}
          leadingSize={size.icon}
          title="Help & Support"
          chevron
          onPress={() =>
            setSheet({
              title: 'Help & Support',
              message:
                'Spendify logs expenses from order and payment notifications. Turn on Notification Access, then spend as usual — totals update on their own.',
              actions: [{ label: 'OK', role: 'cancel' }],
            })
          }
        />
      </InsetGroup>

      <View style={[styles.privacy, { backgroundColor: c.bg2 }]}>
        {tile(ShieldCheck, 'tint')}
        <View style={styles.privacyText}>
          <Text variant="subheadline" weight="600">
            Your data stays on this {device}
          </Text>
          <Text variant="footnote" color="label2">
            Notifications are read and parsed on-device. There’s no account, no server and no
            tracking — export or delete your data at any time.
          </Text>
        </View>
      </View>

      <Alert
        visible={sheetOpen}
        title={sheet?.title ?? ''}
        message={sheet?.message}
        actions={sheet?.actions ?? []}
        onDismiss={() => setSheetOpen(false)}
      />
    </LargeTitleScreen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: size.inset,
    paddingVertical: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, gap: 2 },
  name: { fontSize: 20, lineHeight: 25, fontWeight: '500', letterSpacing: 0.38 },
  privacy: {
    marginHorizontal: size.inset,
    borderRadius: radius.group,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  privacyText: { flex: 1, gap: 4 },
});
