import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

function makeIcon(paths: string[]) {
  return function CravioIcon({ size = 22, color = 'currentColor', filled = false }: IconProps) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
        {paths.map((d, i) => (
          <Path key={i} d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    );
  };
}

/** Lucide-style inline icon set, ported 1:1 from the design system's kit.js. */
export const Icons = {
  Compass: makeIcon(['M12 2l3 7 7 .5-5.5 4.5 1.8 6.8L12 17l-6.1 3.8 1.8-6.8L2.2 9.5 9.3 9z']),
  Brief: makeIcon(['M4 7h16v12H4z', 'M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2']),
  Chat: makeIcon(['M21 11.5a8.4 8.4 0 0 1-9 8 9 9 0 0 1-4-1L3 20l1.5-4.5A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z']),
  User: makeIcon(['M20 21a8 8 0 0 0-16 0', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z']),
  Search: makeIcon(['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.3-4.3']),
  Sliders: makeIcon(['M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6']),
  Bell: makeIcon(['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0']),
  Save: makeIcon(['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z']),
  Chevron: makeIcon(['m9 18 6-6-6-6']),
  Back: makeIcon(['m15 18-6-6 6-6']),
  Check: makeIcon(['M20 6 9 17l-5-5']),
  Plus: makeIcon(['M12 5v14M5 12h14']),
  Settings: makeIcon([
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  ]),
  Spark: makeIcon([
    'M12 3v4M12 17v4M3 12h4M17 12h4',
    'M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1',
  ]),
} as const;
