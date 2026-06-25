import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { Theme } from '../../theme';

export type CampaignStatus = 'applied' | 'under-review' | 'selected' | 'approved' | 'paid' | 'declined';

export interface StatusPillProps {
  /** @default "applied" */
  status?: CampaignStatus;
  /** Override the default label text */
  label?: string;
}

const STATES = (theme: Theme): Record<CampaignStatus, { label: string; fg: string; bg: string; dot: string }> => ({
  applied: { label: 'Applied', fg: theme.colors.textSecondary, bg: theme.colors.bgSubtle, dot: '•' },
  'under-review': { label: 'Under review', fg: theme.colors.warningText, bg: theme.colors.warningSubtle, dot: '◐' },
  selected: { label: 'Selected', fg: theme.colors.textBrand, bg: theme.colors.brandSubtle, dot: '★' },
  approved: { label: 'Approved', fg: theme.colors.verifiedHover, bg: theme.colors.verifiedSubtle, dot: '✓' },
  paid: { label: 'Paid', fg: theme.colors.verifiedHover, bg: theme.colors.verifiedSubtle2, dot: '✓' },
  declined: { label: 'Declined', fg: theme.colors.error, bg: theme.colors.errorSubtle, dot: '✕' },
});

/**
 * Cravio StatusPill — campaign/application lifecycle state.
 * Each state pairs a color WITH a glyph so it reads without color.
 */
export function StatusPill({ status = 'applied', label }: StatusPillProps) {
  const theme = useTheme();
  const s = STATES(theme)[status];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        height: 24,
        paddingHorizontal: 10,
        backgroundColor: s.bg,
        borderRadius: theme.radius.pill,
      }}
    >
      <Text style={{ fontSize: 10, color: s.fg }}>{s.dot}</Text>
      <Text
        style={{
          fontFamily: theme.typography.fonts.sans,
          fontSize: theme.typography.sizes.micro,
          fontWeight: theme.typography.weights.semibold,
          letterSpacing: 0.66,
          textTransform: 'uppercase',
          color: s.fg,
        }}
      >
        {label || s.label}
      </Text>
    </View>
  );
}
