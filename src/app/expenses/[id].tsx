import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Alert,
  Amount,
  Backdrop,
  Cell,
  EmptyState,
  InlineNavBar,
  InsetGroup,
  LetterTile,
  StatusPill,
  Switch,
  Text,
} from '@/components/ui';
import { formatINR, formatShortDate, formatTime } from '@/lib/format';
import { useStore } from '@/lib/store';
import { categoryColor } from '@/lib/theme';
import { categoryLabel, type Expense, type Status } from '@/lib/types';

const STATUS: Record<Status, { label: string; tone: 'tint' | 'orange' | 'gray' }> = {
  delivered: { label: '✓ Delivered', tone: 'tint' },
  paid: { label: '✓ Paid', tone: 'tint' },
  placed: { label: 'Order Placed', tone: 'orange' },
  refunded: { label: 'Refunded', tone: 'gray' },
};

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const found = useStore((s) => s.expenses.find((e) => e.id === id));
  const updateExpense = useStore((s) => s.updateExpense);
  const removeExpense = useStore((s) => s.removeExpense);
  const [confirming, setConfirming] = useState(false);

  // Keep rendering the deleted expense while the screen pops.
  const [deleted, setDeleted] = useState<Expense | null>(null);
  const e = found ?? deleted;

  if (!e) {
    return (
      <View style={styles.fill}>
        <InlineNavBar title="Expense" back={{ label: 'Expenses', href: '/expenses' }} />
        <EmptyState
          title="Expense Not Found"
          message="It may have been deleted."
          action={{ label: 'Back to Expenses', onPress: () => router.replace('/expenses') }}
        />
      </View>
    );
  }

  const at = new Date(e.at);
  const status = STATUS[e.status];

  return (
    <View style={styles.fill}>
      <Backdrop />
      <InlineNavBar
        title="Expense"
        back={{ label: 'Expenses', href: '/expenses' }}
        action={{
          label: 'Edit',
          onPress: () => router.push({ pathname: '/expense-form', params: { id: e.id } }),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.hero}>
          <LetterTile initial={e.initial} color={e.tile ?? categoryColor[e.category]} size={68} />
          <View style={styles.heroText}>
            <Text variant="title2" align="center" accessibilityRole="header">
              {e.merchant}
            </Text>
            <Text variant="subheadline" color="label2" align="center">
              {categoryLabel[e.category]} · {formatShortDate(at)}, {formatTime(at)}
            </Text>
          </View>
          <Amount value={e.amount} size="xl" />
          <StatusPill label={status.label} tone={status.tone} />
        </View>

        {(!!e.vendor || !!e.items?.length) && (
          <InsetGroup header="Order">
            {e.vendor && <Cell key="vendor" title="Restaurant" value={e.vendor} />}
            {e.items?.map((item) => (
              <Cell
                key={item.name}
                title={`${item.qty} × ${item.name}`}
                value={formatINR(item.amount)}
              />
            ))}
          </InsetGroup>
        )}

        <InsetGroup
          header="Payment"
          footer={
            e.source === 'notification'
              ? 'Amounts are read on-device from the app’s notification. Nothing leaves your phone.'
              : undefined
          }>
          <Cell key="method" title="Method" value={e.paymentMethod ?? '—'} />
          {e.orderId && <Cell key="order" title="Order ID" value={e.orderId} />}
          <Cell
            key="source"
            title="Detected from"
            value={e.source === 'notification' ? `${e.sourceApp} notification` : 'Added manually'}
          />
        </InsetGroup>

        <InsetGroup>
          <Cell
            key="count"
            title="Count in daily total"
            trailing={
              <Switch
                label="Count in daily total"
                checked={e.countInTotals}
                onChange={(v) => updateExpense(e.id, { countInTotals: v })}
              />
            }
          />
        </InsetGroup>

        <InsetGroup>
          <Cell
            key="delete"
            title="Delete Expense"
            titleColor="red"
            centered
            onPress={() => setConfirming(true)}
          />
        </InsetGroup>
      </ScrollView>

      <Alert
        visible={confirming}
        onDismiss={() => setConfirming(false)}
        title="Delete Expense?"
        message={`${e.merchant} · ${formatINR(e.amount)} will be removed from your totals.`}
        actions={[
          { label: 'Cancel', role: 'cancel' },
          {
            label: 'Delete',
            role: 'destructive',
            onPress: () => {
              setDeleted(e);
              removeExpense(e.id);
              if (router.canGoBack()) router.back();
              else router.replace('/expenses');
            },
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { alignItems: 'center', paddingTop: 16, paddingBottom: 28, paddingHorizontal: 16, gap: 10 },
  heroText: { gap: 2, alignItems: 'center' },
});
