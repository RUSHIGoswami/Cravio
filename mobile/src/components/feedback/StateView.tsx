import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type StateViewMode = 'empty' | 'loading' | 'error';

export interface StateViewProps {
  /** @default "empty" */
  mode?: StateViewMode;
  title?: string;
  message?: string;
  /** Glyph/icon node for empty + error modes */
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Cravio StateView — empty / loading / error placeholders.
 * One component, three modes, so screens stay consistent.
 */
export function StateView({ mode = 'empty', title, message, icon, action }: StateViewProps) {
  const theme = useTheme();
  const wrap = {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing[4],
    paddingVertical: theme.spacing[10],
    paddingHorizontal: theme.spacing[7],
  };
  const msgStyle = {
    fontFamily: theme.typography.fonts.sans,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
    maxWidth: 280,
    textAlign: 'center' as const,
  };

  if (mode === 'loading') {
    return (
      <View style={wrap}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
        <Text style={msgStyle}>{message || 'Loading…'}</Text>
      </View>
    );
  }

  const isError = mode === 'error';
  return (
    <View style={wrap}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isError ? theme.colors.errorSubtle : theme.colors.bgSubtle,
        }}
      >
        {icon ?? (
          <Text style={{ fontSize: 26, color: isError ? theme.colors.error : theme.colors.textTertiary }}>
            {isError ? '!' : '○'}
          </Text>
        )}
      </View>
      <Text
        style={{
          fontFamily: theme.typography.fonts.sans,
          fontSize: theme.typography.sizes.h3,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.textPrimary,
          textAlign: 'center',
        }}
      >
        {title || (isError ? 'Something went wrong' : 'Nothing here yet')}
      </Text>
      {message ? <Text style={msgStyle}>{message}</Text> : null}
      {action ? <View style={{ marginTop: theme.spacing[4] }}>{action}</View> : null}
    </View>
  );
}
