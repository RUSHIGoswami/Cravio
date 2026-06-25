import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

export type VerifiedBadgeSize = 'sm' | 'md' | 'lg';

export interface VerifiedBadgeProps {
  /** @default "md" */
  size?: VerifiedBadgeSize;
  /** Render the "VERIFIED" text pill instead of just the shield mark */
  showLabel?: boolean;
  label?: string;
}

/**
 * Cravio VerifiedBadge — THE trust signal.
 * Distinguishable without color: a shield silhouette + check.
 * Use ONLY for cross-platform-verified identities. Never decorative.
 */
export function VerifiedBadge({ size = 'md', showLabel = false, label = 'Verified' }: VerifiedBadgeProps) {
  const theme = useTheme();
  const dims = { sm: 16, md: 20, lg: 24 }[size];

  const mark = (
    <Svg width={dims} height={dims} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5 4.5 5.5v6.2c0 4.5 3.1 7.7 7.5 9.3 4.4-1.6 7.5-4.8 7.5-9.3V5.5L12 2.5Z"
        fill={theme.colors.verified}
      />
      <Path
        d="M8.2 12.2 11 15l5-5.4"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  if (!showLabel) {
    return (
      <View accessible accessibilityLabel={label} accessibilityRole="image">
        {mark}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        height: 24,
        paddingLeft: 6,
        paddingRight: 9,
        backgroundColor: theme.colors.verifiedSubtle,
        borderRadius: theme.radius.pill,
      }}
    >
      {mark}
      <Text
        style={{
          fontFamily: theme.typography.fonts.sans,
          fontSize: theme.typography.sizes.micro,
          fontWeight: theme.typography.weights.semibold,
          letterSpacing: 0.66,
          textTransform: 'uppercase',
          color: theme.colors.verifiedHover,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
