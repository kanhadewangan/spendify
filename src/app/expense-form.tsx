import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categoryIcon } from '@/components/categoryIcon';
import { Cell, InsetGroup, SheetNavBar, SymbolTile, TextFieldCell } from '@/components/ui';
import { TODAY } from '@/lib/seed';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/ThemeProvider';
import { categoryColor, size } from '@/lib/theme';
import { CATEGORIES, categoryLabel, type Category } from '@/lib/types';

// Add (no id) or edit (?id=) an expense. Presented as a form sheet.
export default function ExpenseForm() {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.expenses.find((e) => e.id === id));
  const addExpense = useStore((s) => s.addExpense);
  const updateExpense = useStore((s) => s.updateExpense);

  const [merchant, setMerchant] = useState(existing?.merchant ?? '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [category, setCategory] = useState<Category>(existing?.category ?? 'food');

  const value = parseInt(amount.replace(/\D/g, ''), 10);
  const valid = merchant.trim().length > 0 && value > 0;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/expenses'));

  const save = () => {
    if (!valid) return;
    const name = merchant.trim();
    const patch = { merchant: name, initial: name[0].toUpperCase(), amount: value, category };
    if (existing) {
      updateExpense(existing.id, patch);
    } else {
      // New entries land on the mock data's "today", at the current time of day.
      const now = new Date();
      const at = new Date(TODAY);
      at.setHours(now.getHours(), now.getMinutes());
      addExpense({
        ...patch,
        at: at.toISOString(),
        status: 'paid',
        source: 'manual',
        paymentMethod: 'Cash',
        countInTotals: true,
      });
    }
    close();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <SheetNavBar
        title={existing ? 'Edit Expense' : 'New Expense'}
        onCancel={close}
        onDone={save}
        doneLabel={existing ? 'Done' : 'Add'}
        doneDisabled={!valid}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
        <InsetGroup>
          <TextFieldCell
            key="merchant"
            label="Merchant"
            value={merchant}
            onChange={setMerchant}
            placeholder="Swiggy"
            autoFocus={!existing}
          />
          <TextFieldCell
            key="amount"
            label="Amount (₹)"
            value={amount}
            onChange={(t) => setAmount(t.replace(/\D/g, ''))}
            placeholder="0"
            numeric
          />
        </InsetGroup>
        <InsetGroup header="Category">
          {CATEGORIES.map((cat) => {
            const Icon = categoryIcon[cat];
            return (
              <Cell
                key={cat}
                leading={
                  <SymbolTile
                    color={categoryColor[cat]}
                    icon={(color, px) => <Icon size={px} strokeWidth={2.25} color={color} />}
                  />
                }
                leadingSize={size.icon}
                title={categoryLabel[cat]}
                trailing={
                  category === cat ? <Check size={20} strokeWidth={2.75} color={c.tint} /> : null
                }
                onPress={() => setCategory(cat)}
                accessibilityLabel={`${categoryLabel[cat]}${category === cat ? ', selected' : ''}`}
              />
            );
          })}
        </InsetGroup>
      </ScrollView>
    </View>
  );
}
