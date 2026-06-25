import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error';

export interface BadgeProps {
  children?: React.ReactNode;
  /** @default "neutral" */
  variant?: BadgeVariant;
  /** Solid fill instead of subtle */
  solid?: boolean;
}

/**
 * Cravio Badge — small status/intent label. For neutral/info/success/
 * warning/error counts and tags. (Trust uses VerifiedBadge, not this.)
 */
export function Badge({ children, variant = 'neutral', solid = false }: BadgeProps) {
  const theme = useTheme();
  const map: Record<BadgeVariant, { fg: string; bg: string; solidBg: string }> = {
    neutral: { fg: theme.colors.textSecondary, bg: theme.colors.bgSubtle, solidBg: '#4D586B' },
    brand: { fg: theme.colors.textBrand, bg: theme.colors.brandSubtle, solidBg: theme.colors.brand },
    success: { fg: theme.colors.verifiedHover, bg: theme.colors.verifiedSubtle, solidBg: theme.colors.verified },
    warning: { fg: theme.colors.warningText, bg: theme.colors.warningSubtle, solidBg: theme.colors.warning },
    error: { fg: theme.colors.error, bg: theme.colors.errorSubtle, solidBg: theme.colors.error },
  };
  const c = map[variant];

  return (
    <View
      style={{
        minWidth: 20,
        height: 20,
        paddingHorizontal: 7,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: solid ? c.solidBg : c.bg,
        borderRadius: theme.radius.pill,
      }}
    >
      <Text
        style={{
          fontFamily: theme.typography.fonts.sans,
          fontSize: theme.typography.sizes.micro,
          fontWeight: theme.typography.weights.bold,
          color: solid ? '#fff' : c.fg,
          fontVariant: theme.typography.numericTabular as unknown as ('tabular-nums' | 'lining-nums')[],
        }}
      >
        {children}
      </Text>
    </View>
  );
}
