import React from 'react';
import { ActivityIndicator, Pressable, Text, type GestureResponderEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual intent. @default "primary" */
  variant?: ButtonVariant;
  /** md/lg meet the 44px touch minimum. @default "md" */
  size?: ButtonSize;
  /** Stretch to container width */
  block?: boolean;
  /** Show spinner, disable interaction */
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
}

/**
 * Cravio Button — primary marketplace action.
 * Press = scale(0.97), per the design-system's press-feedback convention.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  leadingIcon = null,
  trailingIcon = null,
  onPress,
}: ButtonProps) {
  const theme = useTheme();
  const sizes: Record<ButtonSize, { h: number; px: number; fs: number; gap: number }> = {
    sm: { h: 36, px: 14, fs: theme.typography.sizes.caption, gap: 6 },
    md: { h: 44, px: 18, fs: theme.typography.sizes.label, gap: 8 },
    lg: { h: 52, px: 22, fs: theme.typography.sizes.bodyLg, gap: 8 },
  };
  const s = sizes[size];

  const palette: Record<ButtonVariant, { bg: string; color: string; border: string; elevation: 0 | 1 }> = {
    primary: { bg: theme.colors.brand, color: theme.colors.textOnBrand, border: 'transparent', elevation: 1 },
    secondary: { bg: theme.colors.bgSurface, color: theme.colors.textBrand, border: theme.colors.borderDefault, elevation: 0 },
    tertiary: { bg: 'transparent', color: theme.colors.textBrand, border: 'transparent', elevation: 0 },
    destructive: { bg: theme.colors.error, color: '#fff', border: 'transparent', elevation: 1 },
  };
  const p = palette[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignSelf: block ? 'stretch' : 'flex-start',
          alignItems: 'center',
          justifyContent: 'center',
          gap: s.gap,
          height: s.h,
          paddingHorizontal: s.px,
          backgroundColor: p.bg,
          borderWidth: 1.5,
          borderColor: p.border,
          borderRadius: theme.radius.md,
          opacity: isDisabled ? 0.5 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
        },
        p.elevation === 1 && theme.elevation[1],
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={p.color} />
      ) : (
        leadingIcon
      )}
      {!loading && (
        <Text
          style={{
            fontFamily: theme.typography.fonts.sans,
            fontSize: s.fs,
            fontWeight: theme.typography.weights.semibold,
            color: p.color,
          }}
        >
          {children}
        </Text>
      )}
      {!loading && trailingIcon}
    </Pressable>
  );
}
