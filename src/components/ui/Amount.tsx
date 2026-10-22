import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { Text } from './Text';

import { formatINR } from '@/lib/format';
import type { ColorToken, TypeVariant } from '@/lib/theme';

interface AmountProps {
  value: number;
  size?: 'xl' | 'lg' | 'md';
  animate?: boolean;
  color?: ColorToken;
}

const variant: Record<NonNullable<AmountProps['size']>, TypeVariant> = {
  xl: 'amountXL',
  lg: 'amountL',
  md: 'title2',
};

const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;

// Counts up from 0 (or the previous value) over 800 ms with smoother easing. Screen readers get only the final value.
export function Amount({ value, size = 'xl', animate, color = 'label' }: AmountProps) {
  const reduced = useReducedMotion();
  const counting = animate && !reduced;
  const [shown, setShown] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (!counting) {
      current.current = value;
      return;
    }
    const from = current.current;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / 800);
      current.current = from + (value - from) * easeOutQuart(p);
      setShown(current.current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, counting]);

  return (
    <Text
      variant={variant[size]}
      color={color}
      tabular
      accessibilityLabel={formatINR(value)}
      accessibilityLiveRegion="none"
      numberOfLines={1}>
      {formatINR(counting ? shown : value)}
    </Text>
  );
}
