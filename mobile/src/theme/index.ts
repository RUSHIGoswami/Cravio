/**
 * Cravio — Theme entry point (React Native)
 * Composes the token modules into `light` / `dark` themes plus shared
 * scales. This is the file `/mobile` consumes; screens read from the active
 * theme rather than hard-coding values (per mobile/CLAUDE.md + ADR-0012).
 *
 * Usage:
 *   import { themes, type Theme } from './theme';
 *   const theme = themes[colorScheme ?? 'light'];
 *   <View style={{ backgroundColor: theme.colors.bgSurface, ...theme.elevation[1] }} />
 *
 * Pair with a React context / useColorScheme() to switch light/dark.
 */

import { lightColors, darkColors, palette, type ThemeColors } from './colors';
import {
  fonts, scriptFonts, fontWeights, fontSizes, lineHeights,
  textStyles, numericTabular, type TextStyleToken,
} from './typography';
import { spacing, touchMin, layout } from './spacing';
import { radius } from './radius';
import {
  lightElevation, darkElevation, shadowBrand,
  type ShadowToken,
} from './elevation';
import { breakpoints } from './breakpoints';

export type Theme = {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  elevation: Record<keyof typeof lightElevation, ShadowToken>;
  shadowBrand: ShadowToken;
  // shared, theme-independent scales
  spacing: typeof spacing;
  radius: typeof radius;
  breakpoints: typeof breakpoints;
  touchMin: number;
  layout: typeof layout;
  typography: {
    fonts: typeof fonts;
    scriptFonts: typeof scriptFonts;
    weights: typeof fontWeights;
    sizes: typeof fontSizes;
    lineHeights: typeof lineHeights;
    textStyles: typeof textStyles;
    numericTabular: typeof numericTabular;
  };
};

const typography = {
  fonts,
  scriptFonts,
  weights: fontWeights,
  sizes: fontSizes,
  lineHeights,
  textStyles,
  numericTabular,
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  elevation: lightElevation,
  shadowBrand: shadowBrand.light,
  spacing,
  radius,
  breakpoints,
  touchMin,
  layout,
  typography,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  elevation: darkElevation,
  shadowBrand: shadowBrand.dark,
  spacing,
  radius,
  breakpoints,
  touchMin,
  layout,
  typography,
};

export const themes = { light: lightTheme, dark: darkTheme } as const;

// re-exports for direct access
export { palette };
export type { ThemeColors, TextStyleToken, ShadowToken };
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './elevation';
export * from './breakpoints';
