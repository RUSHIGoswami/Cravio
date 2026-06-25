import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: (string | TabItem)[];
  value?: string;
  onChange?: (value: string) => void;
}

function normalize(t: string | TabItem): TabItem {
  return typeof t === 'string' ? { value: t, label: t } : t;
}

/**
 * Cravio Tabs — underline segmented navigation for in-screen sections.
 */
export function Tabs({ tabs, value, onChange }: TabsProps) {
  const theme = useTheme();
  const normalized = tabs.map(normalize);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ borderBottomWidth: 1.5, borderBottomColor: theme.colors.borderSubtle }}
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing[6] }}>
        {normalized.map((t) => {
          const active = t.value === value;
          return (
            <Pressable
              key={t.value}
              onPress={() => onChange?.(t.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{ paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text
                style={{
                  fontFamily: theme.typography.fonts.sans,
                  fontSize: theme.typography.sizes.label,
                  fontWeight: active ? theme.typography.weights.bold : theme.typography.weights.medium,
                  color: active ? theme.colors.textPrimary : theme.colors.textSecondary,
                }}
              >
                {t.label}
              </Text>
              {t.count != null && (
                <Text
                  style={{
                    fontSize: theme.typography.sizes.micro,
                    fontWeight: theme.typography.weights.bold,
                    color: active ? theme.colors.textBrand : theme.colors.textTertiary,
                    fontVariant: theme.typography.numericTabular as unknown as ('tabular-nums' | 'lining-nums')[],
                  }}
                >
                  {t.count}
                </Text>
              )}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -1.5,
                  height: 2.5,
                  borderRadius: 3,
                  backgroundColor: active ? theme.colors.brand : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
