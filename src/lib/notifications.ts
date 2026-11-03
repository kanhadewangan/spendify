import type { CapturedNotification } from '../../modules/spendify-notifications';

import { TODAY } from './seed';
import type { Category, Expense } from './types';

// Turns payment / order alerts into expenses. Pure, so it can be unit-tested without a device.

// "₹450", "Rs.450", "INR 450", or bank SMS wording like "debited by 85.0".
const AMOUNT = /(?:₹|\brs\.?|\binr|debited (?:by|for))\s?([\d,]+(?:\.\d{1,2})?)/i;

// Money left the account (or an order was placed).
const SPENT =
  /\b(paid|debited|sent|spent|payment of|payment successful|purchase|order (?:placed|confirmed)|txn|withdrawn)\b/i;

// Money came in, or it is not a completed payment. "Credited" only counts when it's into your own
// account: ICICI debit SMS end "…; Amazon Pay credited", naming the payee.
const IGNORE =
  /\b(credited (?:to|in|into|with)\b|received|refund(?:ed)?|cashback|otp|one time password|collect request|requested|request(?:ing)? (?:money|payment)|reminder|due|failed|declined|reversed|offer|win|save up to)\b/i;

const MERCHANT =
  /\b(?:paid to|sent to|payment to|trf to|to|at|towards)\s+([A-Za-z0-9&.'-]+(?:\s+[A-Za-z0-9&.'-]+){0,3}?)(?=\s+(?:on|via|using|from|for|ref|refno|upi|txn|is|has|was|of|a\/c)\b|[.,!(]|$)/i;

// Bank SMS often name the payee only by UPI ID: "to VPA zepto@ybl" → "zepto".
const VPA = /\b(?:to|trf to)\s+(?:vpa\s+)?([a-z0-9._-]+)@[a-z]+/i;

// Apps whose own alerts name the merchant (the app is where the money went).
const MERCHANT_APPS: Record<string, string> = {
  'in.swiggy.android': 'Swiggy',
  'com.application.zomato': 'Zomato',
  'com.zeptoconsumerapp': 'Zepto',
  'com.grofers.customerapp': 'Blinkit',
  'in.amazon.mShop.android.shopping': 'Amazon',
  'com.flipkart.android': 'Flipkart',
  'com.myntra.android': 'Myntra',
  'com.ubercab': 'Uber',
  'com.olacabs.customer': 'Ola',
  'com.rapido.passenger': 'Rapido',
  'com.bigbasket.mobileapp': 'BigBasket',
};

// UPI apps: the money went through them, the merchant is in the text.
const UPI_APPS: Record<string, string> = {
  'com.google.android.apps.nbu.paisa.user': 'Google Pay',
  'com.phonepe.app': 'PhonePe',
  'net.one97.paytm': 'Paytm',
  'in.org.npci.upiapp': 'BHIM',
  'com.dreamplug.androidapp': 'CRED',
  'in.amazon.mShop.android.shopping.upi': 'Amazon Pay',
};

const CATEGORY_WORDS: [Category, RegExp][] = [
  [
    'food',
    /swiggy|zomato|domino|pizza|kfc|mcdonald|burger|cafe|coffee|starbucks|restaurant|eats|biryani|chai|bakery/i,
  ],
  [
    'groceries',
    /zepto|blinkit|bigbasket|instamart|grocer|dmart|jiomart|more retail|reliance fresh|kirana|milk/i,
  ],
  [
    'shopping',
    /amazon|flipkart|myntra|ajio|meesho|nykaa|croma|reliance digital|decathlon|ikea|mall|store/i,
  ],
  [
    'travel',
    /uber|ola|rapido|irctc|redbus|metro|fuel|petrol|diesel|indigo|air ?india|makemytrip|goibibo|fastag|parking/i,
  ],
];

const categorize = (s: string): Category =>
  CATEGORY_WORDS.find(([, re]) => re.test(s))?.[0] ?? 'others';

const tidy = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:mr|ms|m\/s)\.?\s+/i, '')
    // Bank SMS shout ("UBER INDIA"); title-case those, keep mixed case ("McDonald's") as sent.
    .replace(/^[^a-z]+$/, (all) => all.toLowerCase())
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

// SMS app packages. With SMS access on, their notifications are skipped: the SMS itself is read
// from the inbox, so logging the notification too would double-count.
export const SMS_APPS = new Set([
  'com.google.android.apps.messaging',
  'com.android.mms',
  'com.samsung.android.messaging',
  'com.oneplus.mms',
  'com.truecaller',
]);

// Indian SMS sender IDs: "VM-HDFCBK-S" → "HDFCBK". Phone numbers stay as they are.
const senderName = (address: string) =>
  address
    .trim()
    .replace(/^[A-Z]{2}-/i, '')
    .replace(/-[A-Z]$/i, '')
    .toUpperCase();

export function parseNotification(
  n: CapturedNotification,
  source: 'notification' | 'sms' = 'notification'
): Omit<Expense, 'id'> | null {
  const body = `${n.title}. ${n.text}`;
  if (IGNORE.test(body)) return null;

  const amountMatch = body.match(AMOUNT);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0;
  if (!amount || !Number.isFinite(amount)) return null;

  const merchantApp = MERCHANT_APPS[n.packageName];
  if (!merchantApp && !SPENT.test(body)) return null;

  const upi = UPI_APPS[n.packageName];
  const vpa = body.match(VPA)?.[1].replace(/[._-]+/g, ' ');
  const named = vpa ?? body.match(MERCHANT)?.[1];
  // No payee: a known brand in the text ("Your Zepto order…"), then the UPI app's own name — both
  // beat a bank SMS sender code like "HDFCBK".
  const brand = Object.values(MERCHANT_APPS).find((b) => new RegExp(`\\b${b}\\b`, 'i').test(body));
  const fallback = brand ?? upi ?? 'UPI payment';
  const merchant = (merchantApp ?? (named ? tidy(named) : fallback)).slice(0, 28);

  // Like manual entries, captured spends land on the mock data's "today", at the alert's time of day.
  const posted = new Date(n.postedAt);
  const at = new Date(TODAY);
  at.setHours(posted.getHours(), posted.getMinutes(), posted.getSeconds());

  const sms = source === 'sms';
  return {
    merchant,
    initial: merchant[0]?.toUpperCase() ?? '?',
    category: categorize(`${merchant} ${n.appName}`),
    amount: Math.round(amount),
    at: at.toISOString(),
    status: 'paid',
    source,
    sourceApp: sms ? senderName(n.appName) : n.appName,
    paymentMethod: upi
      ? `UPI · ${upi}`
      : merchantApp
        ? undefined
        : sms
          ? 'Bank SMS'
          : `${n.appName} alert`,
    countInTotals: true,
    notificationKey: n.key,
  };
}

// The same payment often triggers two alerts (bank SMS + UPI app). Treat equal amounts captured
// automatically (notification or SMS) within ten minutes of each other as one spend.
const WINDOW = 10 * 60 * 1000;

export function isDuplicate(candidate: Omit<Expense, 'id'>, existing: Expense[], merge: boolean) {
  return existing.some(
    (e) =>
      e.notificationKey === candidate.notificationKey ||
      (merge &&
        e.source !== 'manual' &&
        e.amount === candidate.amount &&
        Math.abs(Date.parse(e.at) - Date.parse(candidate.at)) < WINDOW)
  );
}
