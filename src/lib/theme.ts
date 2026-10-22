import type { TextStyle } from 'react-native';

import type { Category } from './types';

// §1 Design tokens. Components read colours from here (via useTheme), never raw hex.
const dark = {
  bg: '#0A0A0F',
  bg2: '#15151A',
  bg3: '#1E1E24',
  bgTab: '#0D0D12',
  fill: '#2A2A35',
  fill2: '#1E1E24',
  field: '#1A1A20',
  label: '#FFFFFF',
  label2: '#A0A0A8',
  chevron: '#6B6B75',
  separator: 'rgba(255,255,255,0.08)',
  tint: '#00FF94',
  tintSoft: 'rgba(0,255,148,0.15)',
  onTint: '#000000',
  red: '#FF5252',
  orange: '#FFA726',
  blue: '#448AFF',
  cyan: '#00E5FF',
  purple: '#E040FB',
  indigo: '#7C4DFF',
  gray: '#9E9E9E',
  yellow: '#FFD740',
  segBg: 'rgba(255,255,255,0.10)',
  segOn: '#3A3A45',
  switchOff: '#2A2A35',
  scrim: 'rgba(0,0,0,0.6)',
  // Gradients: page glow (tint → cyan → clear) and card sheen (tint → clear).
  glow: 'rgba(0,255,148,0.18)',
  glowMid: 'rgba(0,229,255,0.10)',
  glowFade: 'rgba(0,229,255,0)',
  sheen: 'rgba(0,255,148,0.18)',
  sheenFade: 'rgba(0,255,148,0)',
  // Hero card hairline edge and the see-through tiles that sit on its sheen.
  cardStroke: 'rgba(255,255,255,0.12)',
  tileGlass: 'rgba(255,255,255,0.08)',
  // Liquid Glass: tint laid over the glass, and the colour orbs it refracts.
  glassTint: 'rgba(20,20,25,0.40)',
  // Floating pill tab bar — a dark capsule in both themes with a white active disc.
  pill: '#1A1A20',
  pillTint: 'rgba(26,26,32,0.60)',
  pillIcon: 'rgba(255,255,255,0.70)',
  pillActive: '#FFFFFF',
  pillActiveIcon: '#000000',
  orbA: 'rgba(0,255,148,0.60)',
  orbB: 'rgba(0,229,255,0.45)',
  white: '#FFFFFF',
  black: '#000000',
};

export type Palette = typeof dark;

const light: Palette = {
  bg: '#F5F5FA',
  bg2: '#FFFFFF',
  bg3: '#F0F0F5',
  bgTab: '#FAFAFC',
  fill: '#E0E0E8',
  fill2: '#E8E8F0',
  field: '#EAEAF0',
  label: '#1A1A1F',
  label2: '#6B6B75',
  chevron: '#C0C0C8',
  separator: 'rgba(0,0,0,0.08)',
  tint: '#00C853',
  tintSoft: 'rgba(0,200,83,0.12)',
  onTint: '#FFFFFF',
  red: '#FF5252',
  orange: '#FF9800',
  blue: '#2196F3',
  cyan: '#00BCD4',
  purple: '#9C27B0',
  indigo: '#673AB7',
  gray: '#9E9E9E',
  yellow: '#FFC107',
  segBg: 'rgba(0,0,0,0.08)',
  segOn: '#FFFFFF',
  switchOff: '#E0E0E8',
  scrim: 'rgba(0,0,0,0.25)',
  glow: 'rgba(0,200,83,0.15)',
  glowMid: 'rgba(0,188,212,0.08)',
  glowFade: 'rgba(0,188,212,0)',
  sheen: 'rgba(0,200,83,0.12)',
  sheenFade: 'rgba(0,200,83,0)',
  cardStroke: 'rgba(0,0,0,0.06)',
  tileGlass: 'rgba(0,0,0,0.04)',
  glassTint: 'rgba(255,255,255,0.40)',
  pill: '#1A1A1F',
  pillTint: 'rgba(26,26,31,0.85)',
  pillIcon: 'rgba(255,255,255,0.75)',
  pillActive: '#FFFFFF',
  pillActiveIcon: '#000000',
  orbA: 'rgba(0,200,83,0.45)',
  orbB: 'rgba(0,188,212,0.38)',
  white: '#FFFFFF',
  black: '#000000',
};

export const palettes = { dark, light };
export type Scheme = keyof typeof palettes;

export type ColorToken = keyof Palette;

export const categoryColor: Record<Category, ColorToken> = {
  food: 'orange',
  shopping: 'blue',
  groceries: 'cyan',
  travel: 'purple',
  others: 'gray',
};

// Letter-tile text: black on light fills, white on saturated ones.
const darkText: ColorToken[] = ['orange', 'cyan', 'yellow', 'tint'];
export const tileTextColor = (fill: ColorToken): ColorToken =>
  darkText.includes(fill) ? 'black' : 'white';

export const type = {
  largeTitle: { fontSize: 36, lineHeight: 44, fontWeight: '800', letterSpacing: -0.5 },
  title1: { fontSize: 30, lineHeight: 38, fontWeight: '700', letterSpacing: -0.3 },
  title2: { fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: -0.2 },
  headline: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400', letterSpacing: -0.2 },
  subheadline: { fontSize: 15, lineHeight: 22, fontWeight: '500', letterSpacing: -0.1 },
  footnote: { fontSize: 13, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  caption2: { fontSize: 11, lineHeight: 16, fontWeight: '500', letterSpacing: 0.1 },
  amountXL: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '800',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  amountL: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 36 } as const;

export const radius = {
  group: 12,
  hero: 20,
  // Liquid Glass hero card and the tiles inside it (inner = outer − 16 px padding).
  glass: 32,
  glassInner: 16,
  button: 16,
  seg: 10,
  segThumb: 8,
  tile: 12,
  icon: 8,
} as const;

export const size = {
  inset: 18,
  headerInset: 36,
  buttonLg: 54,
  buttonMd: 48,
  capsule: 38,
  seg: 34,
  tile: 44,
  icon: 32,
  tabBar: 52,
  pill: 68,
  pillDisc: 56,
  cell: 48,
  cellSubtitle: 64,
} as const;

// Soft fill for a solid token, e.g. a status pill background.
export function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
