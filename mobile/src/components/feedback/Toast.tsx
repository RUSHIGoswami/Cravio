import React from 'react';
import { Pressable, View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  /** @default "info" */
  variant?: ToastVariant;
  title?: string;
  message?: string;
  onClose?: () => void;
  action?: React.ReactNode;
}

/**
 * Cravio Toast — transient notification.
 * variant pairs an accent stripe + icon glyph (color-independent).
 */
export function Toast({ variant = 'info', title, message, onClose, action }: ToastProps) {
  const theme = useTheme();
  const map: Record<ToastVariant, { accent: string; glyph: string }> = {
    info: { accent: theme.colors.brand, glyph: 'i' },
    success: { accent: theme.colors.verified, glyph: '✓' },
    warning: { accent: theme.colors.warning, glyph: '!' },
    error: { accent: theme.colors.error, glyph: '✕' },
  };
  const c = map[variant];

  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[4],
        maxWidth: 420,
        padding: theme.spacing[4],
        backgroundColor: theme.colors.bgSurface,
        borderWidth: 1.5,
        borderColor: theme.colors.borderSubtle,
        borderLeftWidth: 4,
        borderLeftColor: c.accent,
        borderRadius: theme.radius.md,
        ...theme.elevation[3],
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          marginTop: 1,
          borderRadius: theme.radius.pill,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: theme.typography.weights.bold, color: '#fff' }}>{c.glyph}</Text>
      </View>
      <View style={{ flex: 1 }}>
        {title ? (
          <Text
            style={{
              fontFamily: theme.typography.fonts.sans,
              fontSize: theme.typography.sizes.label,
              fontWeight: theme.typography.weights.bold,
              color: theme.colors.textPrimary,
            }}
          >
            {title}
          </Text>
        ) : null}
        {message ? (
          <Text
            style={{
              fontFamily: theme.typography.fonts.sans,
              fontSize: theme.typography.sizes.caption,
              color: theme.colors.textSecondary,
              marginTop: title ? 2 : 0,
            }}
          >
            {message}
          </Text>
        ) : null}
        {action ? <View style={{ marginTop: theme.spacing[3] }}>{action}</View> : null}
      </View>
      {onClose ? (
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" style={{ padding: 2 }}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6 6 18M6 6l12 12" stroke={theme.colors.textTertiary} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}
