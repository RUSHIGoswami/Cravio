import React from 'react';
import { Pressable, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children?: React.ReactNode;
  /** @default "md" */
  padding?: CardPadding;
  /** Adds press feedback */
  interactive?: boolean;
  /** Shadow level 0–4. @default 1 */
  elevation?: 0 | 1 | 2 | 3 | 4;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cravio Card — generic content surface. Padding presets + optional
 * interactive press feedback (scale 0.99, per the design system).
 */
export function Card({ children, padding = 'md', interactive = false, elevation = 1, onPress, style }: CardProps) {
  const theme = useTheme();
  const pad = { none: 0, sm: theme.spacing[4], md: theme.spacing[5], lg: theme.spacing[7] }[padding];
  const base = {
    backgroundColor: theme.colors.bgSurface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radius.lg,
    padding: pad,
    ...theme.elevation[elevation],
  };

  if (!interactive) {
    return <View style={[base, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [base, { transform: [{ scale: pressed ? 0.99 : 1 }] }, style]}
    >
      {children}
    </Pressable>
  );
}
