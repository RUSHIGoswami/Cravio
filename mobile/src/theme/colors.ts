/**
 * Cravio — Color tokens (React Native)
 * Auto-derived from the Cravio Design System (tokens/colors.css).
 *
 * RN has no CSS variables or color-mix(): every value below is fully
 * RESOLVED to a literal hex / rgba string. Light + dark semantic sets
 * share one shape (ThemeColors) so screens can switch on `mode`.
 *
 * Trust-first rule: `verified` (green) is reserved ONLY for trust /
 * positive states (verification, payout-success, approvals). Do not use
 * it as a generic accent — `brand` (indigo) carries all actions.
 */

/** Raw palette — theme-independent ramps. Prefer the semantic sets below. */
export const palette = {
  blue: {
    50: '#EEF2FF', 100: '#DCE4FF', 200: '#B9C9FF', 300: '#8EA6FF',
    400: '#5C7CFF', 500: '#2D5BFF', 600: '#1E45E6', 700: '#1838B8',
    800: '#162F8F', 900: '#162A6B',
  },
  green: {
    50: '#E7F8F1', 100: '#C5EFDD', 200: '#97E2C2', 300: '#5FD3A6',
    400: '#34C68C', 500: '#1FB87A', 600: '#159463', 700: '#0F7A52',
  },
  amber: {
    50: '#FEF6E7', 100: '#FCEAC4', 400: '#F7B23B', 500: '#EF9D1E', 600: '#CC8210',
  },
  red: {
    50: '#FDECEC', 100: '#FBD5D6', 400: '#ED5A60', 500: '#E5484D', 600: '#C93A3F',
  },
  neutral: {
    0: '#FFFFFF', 25: '#FBFCFD', 50: '#F5F7FA', 100: '#EDF0F5', 200: '#DEE3EC',
    300: '#C7CEDB', 400: '#9AA4B6', 500: '#6B7689', 600: '#4D586B', 700: '#374152',
    800: '#232B38', 900: '#151B26', 950: '#0C111A',
  },
} as const;

export type ThemeColors = {
  // brand (indigo — all actions)
  brand: string;
  brandHover: string;
  brandPress: string;
  brandSubtle: string;
  brandSubtle2: string;
  // verified / success (reserved for trust + positive states)
  verified: string;
  verifiedHover: string;
  verifiedSubtle: string;
  verifiedSubtle2: string;
  // warning / pending (amber)
  warning: string;
  warningSubtle: string;
  warningText: string;
  // error (red)
  error: string;
  errorHover: string;
  errorSubtle: string;
  // surfaces
  bgBase: string;
  bgSurface: string;
  bgSubtle: string;
  bgSunken: string;
  bgInverse: string;
  // borders
  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;
  borderBrand: string;
  // text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textBrand: string;
  textOnBrand: string;
  textOnDark: string;
  // focus
  focusRing: string;
};

export const lightColors: ThemeColors = {
  brand: '#2D5BFF',
  brandHover: '#1E45E6',
  brandPress: '#1838B8',
  brandSubtle: '#EEF2FF',
  brandSubtle2: '#DCE4FF',

  verified: '#1FB87A',
  verifiedHover: '#159463',
  verifiedSubtle: '#E7F8F1',
  verifiedSubtle2: '#C5EFDD',

  warning: '#EF9D1E',
  warningSubtle: '#FEF6E7',
  warningText: '#CC8210',

  error: '#E5484D',
  errorHover: '#C93A3F',
  errorSubtle: '#FDECEC',

  bgBase: '#F5F7FA',
  bgSurface: '#FFFFFF',
  bgSubtle: '#EDF0F5',
  bgSunken: '#EDF0F5',
  bgInverse: '#151B26',

  borderSubtle: '#DEE3EC',
  borderDefault: '#C7CEDB',
  borderStrong: '#9AA4B6',
  borderBrand: '#2D5BFF',

  textPrimary: '#151B26',
  textSecondary: '#6B7689',
  textTertiary: '#9AA4B6',
  textBrand: '#1E45E6',
  textOnBrand: '#FFFFFF',
  textOnDark: '#FFFFFF',

  focusRing: 'rgba(45, 91, 255, 0.45)',
};

export const darkColors: ThemeColors = {
  brand: '#5C7CFF',
  brandHover: '#8EA6FF',
  brandPress: '#2D5BFF',
  // color-mix(in srgb, blue-500 18%/28%, neutral-900) resolved:
  brandSubtle: '#19274D',
  brandSubtle2: '#1C2D63',

  verified: '#34C68C',
  verifiedHover: '#5FD3A6',
  verifiedSubtle: '#173735',
  verifiedSubtle2: '#18473E',

  warning: '#F7B23B',
  warningSubtle: '#3C3225',
  warningText: '#F7B23B',

  error: '#ED5A60',
  errorHover: '#E5484D',
  errorSubtle: '#3A232D',

  bgBase: '#0C111A',
  bgSurface: '#151B26',
  bgSubtle: '#232B38',
  bgSunken: '#070B12',
  bgInverse: '#F5F7FA',

  // white-alpha borders (color-mix(... neutral-0 N%, transparent))
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderDefault: 'rgba(255, 255, 255, 0.14)',
  borderStrong: 'rgba(255, 255, 255, 0.24)',
  borderBrand: '#5C7CFF',

  textPrimary: '#EEF1F6',
  textSecondary: '#9AA4B6',
  textTertiary: '#6B7689',
  textBrand: '#8EA6FF',
  textOnBrand: '#0C111A',
  textOnDark: '#FFFFFF',

  focusRing: 'rgba(92, 124, 255, 0.55)',
};
