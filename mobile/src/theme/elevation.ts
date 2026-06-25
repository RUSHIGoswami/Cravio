/**
 * Cravio — Elevation / shadow tokens (React Native)
 * Derived from tokens/elevation.css.
 *
 * The web tokens use multi-layer box-shadows; RN supports a single shadow.
 * Each level below is collapsed to one representative shadow plus an Android
 * `elevation` value (Android ignores iOS shadow props and uses `elevation`).
 * Spread these objects directly onto a View's style.
 *
 * `shadowBrand` is the brand-tinted glow — reserve it for the primary CTA /
 * selected emphasis only.
 */

export type ShadowToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
};

const COOL = '#151B26'; // cool-tinted shadow ink (light theme)

export const lightElevation = {
  0: { shadowColor: COOL, shadowOffset: { width: 0, height: 0 },  shadowOpacity: 0,    shadowRadius: 0,  elevation: 0 },
  1: { shadowColor: COOL, shadowOffset: { width: 0, height: 1 },  shadowOpacity: 0.08, shadowRadius: 2,  elevation: 1 },
  2: { shadowColor: COOL, shadowOffset: { width: 0, height: 2 },  shadowOpacity: 0.10, shadowRadius: 6,  elevation: 3 },
  3: { shadowColor: COOL, shadowOffset: { width: 0, height: 8 },  shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  4: { shadowColor: COOL, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 40, elevation: 16 },
} as const satisfies Record<number, ShadowToken>;

export const darkElevation = {
  0: { shadowColor: '#000000', shadowOffset: { width: 0, height: 0 },  shadowOpacity: 0,    shadowRadius: 0,  elevation: 0 },
  1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 },  shadowOpacity: 0.40, shadowRadius: 2,  elevation: 1 },
  2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 },  shadowOpacity: 0.45, shadowRadius: 8,  elevation: 3 },
  3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.55, shadowRadius: 24, elevation: 8 },
  4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.65, shadowRadius: 48, elevation: 16 },
} as const satisfies Record<number, ShadowToken>;

/** Brand-tinted glow — primary CTA / selected only. */
export const shadowBrand = {
  light: { shadowColor: '#2D5BFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 18, elevation: 8 },
  dark:  { shadowColor: '#2D5BFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 8 },
} as const satisfies Record<'light' | 'dark', ShadowToken>;
