import React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type IconButtonVariant = 'ghost' | 'surface' | 'brand';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps {
  children?: React.ReactNode;
  /** @default "ghost" */
  variant?: IconButtonVariant;
  /** @default "md" */
  size?: IconButtonSize;
  /** Accessible label (required — icon-only) */
  label: string;
  disabled?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
}

/**
 * Cravio IconButton — a square, icon-only control. Always 44px+ for touch.
 */
export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  label,
  disabled = false,
  onPress,
}: IconButtonProps) {
  const theme = useTheme();
  const dims = { sm: 36, md: 44, lg: 52 }[size];
  const palette: Record<IconButtonVariant, { bg: string; color: string; border: string }> = {
    ghost: { bg: 'transparent', color: theme.colors.textSecondary, border: 'transparent' },
    surface: { bg: theme.colors.bgSurface, color: theme.colors.textPrimary, border: theme.colors.borderDefault },
    brand: { bg: theme.colors.brand, color: theme.colors.textOnBrand, border: 'transparent' },
  };
  const p = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        width: dims,
        height: dims,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: p.bg,
        borderWidth: 1.5,
        borderColor: p.border,
        borderRadius: theme.radius.md,
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
      })}
    >
      {children}
    </Pressable>
  );
}
