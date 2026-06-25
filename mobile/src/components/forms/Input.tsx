import React, { useId, useState } from 'react';
import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface InputProps {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  helper?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Cravio Input — labeled text field with optional icon, helper, and error.
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  helper,
  error,
  leadingIcon = null,
  trailingIcon = null,
  disabled = false,
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const fieldId = useId();
  const borderColor = error ? theme.colors.error : focused ? theme.colors.borderBrand : theme.colors.borderDefault;

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text
          nativeID={fieldId}
          style={{
            fontFamily: theme.typography.fonts.sans,
            fontSize: theme.typography.sizes.label,
            fontWeight: theme.typography.weights.medium,
            color: theme.colors.textPrimary,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 48,
          paddingHorizontal: 14,
          backgroundColor: disabled ? theme.colors.bgSubtle : theme.colors.bgSurface,
          borderWidth: 1.5,
          borderColor,
          borderRadius: theme.radius.md,
        }}
      >
        {leadingIcon}
        <TextInput
          accessibilityLabelledBy={fieldId}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontFamily: theme.typography.fonts.sans,
            fontSize: theme.typography.sizes.body,
            color: theme.colors.textPrimary,
            fontVariant: keyboardType === 'numeric' ? (theme.typography.numericTabular as unknown as ('tabular-nums' | 'lining-nums')[]) : undefined,
          }}
        />
        {trailingIcon}
      </View>
      {helper || error ? (
        <Text style={{ fontFamily: theme.typography.fonts.sans, fontSize: theme.typography.sizes.caption, color: error ? theme.colors.error : theme.colors.textSecondary }}>
          {error || helper}
        </Text>
      ) : null}
    </View>
  );
}
