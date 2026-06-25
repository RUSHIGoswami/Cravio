import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: (string | SelectOption)[];
  placeholder?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
}

function normalize(o: string | SelectOption): SelectOption {
  return typeof o === 'string' ? { value: o, label: o } : o;
}

/**
 * Cravio Select — labeled dropdown styled to match Input.
 * RN has no native <select>; opens a bottom-sheet-style modal list instead.
 */
export function Select({ label, value, onChange, options = [], placeholder = 'Select…', helper, error, disabled = false }: SelectProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const normalized = options.map(normalize);
  const selected = normalized.find((o) => o.value === value);
  const borderColor = error ? theme.colors.error : theme.colors.borderDefault;

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text
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
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          paddingHorizontal: 14,
          backgroundColor: disabled ? theme.colors.bgSubtle : theme.colors.bgSurface,
          borderWidth: 1.5,
          borderColor,
          borderRadius: theme.radius.md,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: theme.typography.fonts.sans,
            fontSize: theme.typography.sizes.body,
            color: selected ? theme.colors.textPrimary : theme.colors.textTertiary,
          }}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="m6 9 6 6 6-6" stroke={theme.colors.textTertiary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
      {helper || error ? (
        <Text style={{ fontFamily: theme.typography.fonts.sans, fontSize: theme.typography.sizes.caption, color: error ? theme.colors.error : theme.colors.textSecondary }}>
          {error || helper}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(12,17,26,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              backgroundColor: theme.colors.bgSurface,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              maxHeight: '60%',
              paddingVertical: theme.spacing[4],
            }}
          >
            <FlatList
              data={normalized}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange?.(item.value);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: theme.spacing[4],
                    paddingHorizontal: theme.spacing[5],
                    backgroundColor: item.value === value ? theme.colors.brandSubtle : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: theme.typography.fonts.sans,
                      fontSize: theme.typography.sizes.body,
                      color: item.value === value ? theme.colors.textBrand : theme.colors.textPrimary,
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
