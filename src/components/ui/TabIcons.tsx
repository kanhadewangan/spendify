import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type TabName = 'home' | 'expenses' | 'insights' | 'settings';

interface TabIconProps {
  name: TabName;
  filled: boolean;
  color: string;
  // Background colour used to punch details out of filled glyphs.
  cutout: string;
  size?: number;
}

const GEAR =
  'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915';

// Outlined when inactive, filled when active (SF Symbols convention).
export function TabIcon({ name, filled, color, cutout, size = 26 }: TabIconProps) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  const body = filled ? { fill: color, ...stroke } : { fill: 'none', ...stroke };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (
        <Path
          d="M3.5 10.5 12 3.5l8.5 7V19a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5A1.5 1.5 0 0 1 3.5 19z"
          {...body}
        />
      )}
      {name === 'expenses' && (
        <>
          <Rect x={2.75} y={4.25} width={18.5} height={15.5} rx={3.5} {...body} />
          {[8.5, 12, 15.5].map((y) => (
            <Path
              key={y}
              d={`M7 ${y}h.01M10.5 ${y}H17`}
              stroke={filled ? cutout : color}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          ))}
        </>
      )}
      {name === 'insights' && (
        <>
          <Rect x={3.25} y={3.25} width={17.5} height={17.5} rx={4.5} {...body} />
          {[
            [8, 12.5],
            [12, 8.5],
            [16, 14.5],
          ].map(([x, y]) => (
            <Path
              key={x}
              d={`M${x} ${y}V16.5`}
              stroke={filled ? cutout : color}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          ))}
        </>
      )}
      {name === 'settings' && (
        <>
          <Path d={GEAR} {...body} />
          <Circle
            cx={12}
            cy={12}
            r={3}
            fill={filled ? cutout : 'none'}
            stroke={filled ? cutout : color}
            strokeWidth={1.8}
          />
        </>
      )}
    </Svg>
  );
}
