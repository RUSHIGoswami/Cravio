import React from 'react';
import { Pressable, Text, type GestureResponderEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

export interface ChipProps {
  children?: React.ReactNode;
  /** Filled brand-subtle + check when true */
  selected?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
  /** Renders a dismiss × when provided */
  onDismiss?: () => void;
  leadingIcon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

/**
 * Cravio Chip — filter pill used heavily in discovery.
 * selected = filled brand-subtle with check; supports count + dismiss.
 */
export function Chip({ children, selected = false, onPress, onDismiss, leadingIcon = null, count, disabled = false }: ChipProps) {
  const theme = useTheme();
  const fg = selected ? theme.colors.textBrand : theme.colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 14,
        backgroundColor: selected ? theme.colors.brandSubtle : theme.colors.bgSurface,
        borderWidth: 1.5,
        borderColor: selected ? theme.colors.brand : theme.colors.borderDefault,
        borderRadius: theme.radius.pill,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {selected && !leadingIcon && (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6 9 17l-5-5" stroke={fg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
      {leadingIcon}
      <Text style={{ fontFamily: theme.typography.fonts.sans, fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weights.medium, color: fg }}>
        {children}
      </Text>
      {count != null && (
        <Text
          style={{
            fontVariant: theme.typography.numericTabular as unknown as ('tabular-nums' | 'lining-nums')[],
            color: selected ? theme.colors.textBrand : theme.colors.textTertiary,
          }}
        >
          {count}
        </Text>
      )}
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8} style={{ marginRight: -4 }}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6 6 18M6 6l12 12" stroke={fg} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </Pressable>
      )}
    </Pressable>
  );
}
