import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { VerifiedBadge, type VerifiedBadgeSize } from './VerifiedBadge';

export interface AvatarProps {
  src?: string;
  /** Used for initials fallback + alt text */
  name?: string;
  /** Pixel diameter. @default 44 */
  size?: number;
  /** Overlay the verified tick in the corner */
  verified?: boolean;
}

const BADGE_SIZE_FOR: Record<number, VerifiedBadgeSize> = { 28: 'sm', 36: 'sm', 44: 'md', 56: 'md', 72: 'lg' };

/**
 * Cravio Avatar — round profile image with initials fallback and
 * optional verified tick overlapping the corner.
 */
export function Avatar({ src, name = '', size = 44, verified = false }: AvatarProps) {
  const theme = useTheme();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const badgeSize = BADGE_SIZE_FOR[size] ?? 'md';

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: theme.radius.pill,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.brandSubtle,
          borderWidth: 1.5,
          borderColor: theme.colors.borderSubtle,
        }}
      >
        {src ? (
          <Image source={{ uri: src }} accessibilityLabel={name} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text
            style={{
              fontFamily: theme.typography.fonts.sans,
              fontWeight: theme.typography.weights.bold,
              fontSize: Math.round(size * 0.38),
              color: theme.colors.textBrand,
            }}
          >
            {initials}
          </Text>
        )}
      </View>
      {verified && (
        <View
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            backgroundColor: theme.colors.bgSurface,
            borderRadius: theme.radius.pill,
            padding: 1.5,
          }}
        >
          <VerifiedBadge size={badgeSize} />
        </View>
      )}
    </View>
  );
}
