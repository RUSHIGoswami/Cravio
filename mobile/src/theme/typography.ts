/**
 * Cravio — Typography tokens (React Native)
 * Derived from tokens/typography.css + tokens/fonts.css.
 *
 * RN does not cascade font families: each Text picks ONE `fontFamily`.
 * Bundle the fonts below (e.g. via expo-font / react-native.config.js) and
 * use the exact PostScript family names. For Indic scripts, set the matching
 * Noto family on the affected <Text> (see `scriptFonts`) — there is no
 * automatic fallback chain like on the web.
 *
 * letterSpacing on the web scale is in `em`; RN takes points, so each text
 * style below ships a pre-computed px value (em * fontSize).
 */

export const fonts = {
  /** Latin UI family — bundle weights 400/500/600/700/800 (+400/600 italic). */
  sans: 'Plus Jakarta Sans',
  /** Technical IDs / monospace. */
  mono: 'JetBrains Mono',
} as const;

/** Per-script overrides for the regional-language roadmap (set on <Text>). */
export const scriptFonts = {
  devanagari: 'Noto Sans Devanagari',
  tamil: 'Noto Sans Tamil',
  telugu: 'Noto Sans Telugu',
  bengali: 'Noto Sans Bengali',
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/**
 * Tabular + lining figures for dense data (follower counts, %, budgets).
 * Apply with: style={{ fontVariant: numericTabular }}.
 */
export const numericTabular = ['tabular-nums', 'lining-nums'] as const;

export type TextStyleToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: string;
};

/**
 * Type scale — ready-to-spread RN text styles. Sizes/line-heights match the
 * web scale (px); weights are the system default per role (override freely).
 */
export const textStyles = {
  display: { fontFamily: fonts.sans, fontSize: 34, lineHeight: 40, letterSpacing: -0.68, fontWeight: fontWeights.bold },
  h1:      { fontFamily: fonts.sans, fontSize: 28, lineHeight: 34, letterSpacing: -0.28, fontWeight: fontWeights.bold },
  h2:      { fontFamily: fonts.sans, fontSize: 22, lineHeight: 28, letterSpacing: -0.22, fontWeight: fontWeights.bold },
  h3:      { fontFamily: fonts.sans, fontSize: 18, lineHeight: 24, letterSpacing: -0.18, fontWeight: fontWeights.semibold },
  bodyLg:  { fontFamily: fonts.sans, fontSize: 17, lineHeight: 26, letterSpacing: 0,     fontWeight: fontWeights.regular },
  body:    { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, letterSpacing: 0,     fontWeight: fontWeights.regular },
  label:   { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, letterSpacing: 0.07,  fontWeight: fontWeights.semibold },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, letterSpacing: 0,     fontWeight: fontWeights.regular },
  /** Overline / eyebrow — the only uppercase usage. */
  overline:{ fontFamily: fonts.sans, fontSize: 11, lineHeight: 14, letterSpacing: 0.66,  fontWeight: fontWeights.semibold },
} as const satisfies Record<string, TextStyleToken>;

/** Raw scale values if you need them outside the composed text styles. */
export const fontSizes = {
  display: 34, h1: 28, h2: 22, h3: 18, bodyLg: 17, body: 15, label: 14, caption: 13, micro: 11,
} as const;

export const lineHeights = {
  display: 40, h1: 34, h2: 28, h3: 24, bodyLg: 26, body: 22, label: 20, caption: 18, micro: 14,
} as const;
