/**
 * Cravio — Spacing scale (React Native)
 * Derived from tokens/spacing.css. 4 / 8-based.
 */

export const spacing = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
  11: 64,
  12: 80,
} as const;

/** Minimum touch target (WCAG / platform). Never size interactive hit areas below this. */
export const touchMin = 44;

/** Layout shortcuts. */
export const layout = {
  screenPad: spacing[5], // 16 — default phone edge gutter
  gapCard: spacing[4],   // 12
  gapList: spacing[3],   // 8
} as const;
