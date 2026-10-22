# Spendify

A mobile-first expense tracker built from `.claude/design/design.md`. It's an Expo / React Native app (iOS first, with Android and web also supported), uses mock data, and keeps everything on-device.

## Run

```sh
npm install
npx expo start          # then press i (iOS simulator), a (Android) or w (web)
```

State persists to AsyncStorage under `spendify:v1`. To reset the seed data, delete the app from the simulator, or clear site data on web.

## Layout

```
src/
  app/                    Expo Router routes
    _layout.tsx           providers + root stack (push / sheet transitions)
    index.tsx             animated splash → /onboarding or /home
    onboarding.tsx        notification-access onboarding + alert
    (tabs)/_layout.tsx    custom TabBar, fade + rise tab transition
    (tabs)/home.tsx       Today
    (tabs)/expenses.tsx   search + segmented filter, grouped by day
    (tabs)/insights.tsx   Day / Week / Month bar chart, tap to select
    (tabs)/settings.tsx   tracking, appearance, CSV export
    expenses/[id].tsx     expense detail, count toggle, delete
    expense-form.tsx      add / edit sheet (the “+” and “Edit” buttons)
  components/ui/          design-system components (§3 of the spec)
  components/             ExpenseCell, SpendifyMark, categoryIcon
  lib/
    theme.ts              colour, type, spacing tokens (dark + light)
    motion.ts             durations, springs, easing, shared layout animations
    ThemeProvider.tsx     system / dark / light, theme crossfade, status bar
    store.ts              Zustand store persisted to AsyncStorage
    seed.ts               mock data anchored to 26 Apr 2025
    selectors.ts          derived totals, splits, day groups, insight periods
    csv.ts                CSV export (share sheet on native, download on web)
```

## Deviations from the spec

The spec targets Next.js 15 + Tailwind v4 + motion/react. This repo is an Expo app, so each piece maps to its native equivalent:

| Spec | Here |
| --- | --- |
| Next.js App Router, `app/(app)/` | Expo Router, `src/app/` with a `(tabs)` group |
| Framer Motion / `motion/react` | Reanimated 4 (shared values, layout animations, `Keyframe`) |
| `MotionConfig reducedMotion="user"` | `useReducedMotion()` — every animation falls back to a 150 ms fade |
| CSS variables + Tailwind | typed tokens in `lib/theme.ts`, read through `useTheme()` |
| localStorage | AsyncStorage (localStorage on web) |
| `<input type="checkbox">` switch | the platform `Switch`, tinted with tokens (it *is* the HIG switch) |
| Custom push slide (`navDirection` ref) | native-stack iOS push / pop, which is the spring + dimmed, shifted parent the spec describes |
| 390 px frame, HomeIndicator, 58 px fake safe area | real device safe-area insets; the OS draws the home indicator |
| PWA manifest splash | `expo-splash-screen` (light #F2F2F7 / dark #000) hands off to the animated JS splash |

Other notes:

- **Seed totals.** The spec's derived numbers don't add up from its own rows. The five rows listed for "today" already sum to ₹2,620, so ₹2,485 isn't reachable. Every total is computed from the store as required, and today gets seven small "others" rows so it has 12 transactions.
- **Weekday.** 26 Apr 2025 is a Saturday, so the Home eyebrow reads "Saturday, 26 April", which matches the Insights "SATURDAY". The spec's "Thursday" is wrong.
- **"Today" is fixed.** It is pinned to 26 Apr 2025 (`lib/seed.ts`) so the mock data reads as designed. New manual expenses land on that date at the current time of day.
- **Uber tile.** It uses `--bg-3` with `--label` text instead of white, so it stays legible in light mode.
- **Cell press highlight.** It uses `--bg-3` in dark mode and `--fill-2` in light mode, because `--bg-3` equals the page colour in light mode and wouldn't be visible.
- **Insights periods.** The spec only defines Week. I chose Day = six 4-hour buckets and Month = weeks of the month.
- **Additions.** The spec leaves the "+" and "Edit" buttons undefined, so I added an add/edit sheet. Spending Limits and Appearance open an alert action list. Help & Support shows an info alert.
- **Not built.** The optional "playful" theme preset.
- **Not applicable.** The Lighthouse checklist items are web-only and don't apply to the native build.
