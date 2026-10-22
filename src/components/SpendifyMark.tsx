import Svg, { Path } from 'react-native-svg';

// The Spendify "S": two stroked arcs plus two vertical stubs.
export function SpendifyMark({ size = 60, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Path
        d="M40 20a10 10 0 1 0-10 10M30 30a10 10 0 1 1-10 10M30 4.5V10M30 50v5.5"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </Svg>
  );
}
