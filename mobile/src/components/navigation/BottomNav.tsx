import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface BottomNavItem {
  key: string;
  label: string;
  /** Node, or (active: boolean) => node to swap icon state */
  icon: React.ReactNode | ((active: boolean) => React.ReactNode);
  /** Notification count bubble */
  badge?: number | string;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  value?: string;
  onChange?: (key: string) => void;
}

/**
 * Cravio BottomNav — mobile tab bar with active state + notification badges.
 */
export function BottomNav({ items, value, onChange }: BottomNavProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.bgSurface,
        borderTopWidth: 1.5,
        borderTopColor: theme.colors.borderSubtle,
      }}
    >
      {items.map((it) => {
        const active = it.key === value;
        const icon = typeof it.icon === 'function' ? it.icon(active) : it.icon;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange?.(it.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              minHeight: 56,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <View>
              {icon}
              {it.badge != null && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 4,
                    backgroundColor: theme.colors.error,
                    borderRadius: theme.radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: theme.colors.bgSurface,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: theme.typography.weights.bold, color: '#fff' }}>{it.badge}</Text>
                </View>
              )}
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: active ? theme.typography.weights.semibold : theme.typography.weights.medium,
                color: active ? theme.colors.brand : theme.colors.textTertiary,
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
