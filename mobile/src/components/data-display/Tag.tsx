import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type TagTone = 'default' | 'brand';

export interface TagProps {
  children?: React.ReactNode;
  /** @default "default" */
  tone?: TagTone;
}

/**
 * Cravio Tag — niche/category label (Fashion, Food, Tech…).
 * Outline by default; subtle fill optional. Not interactive (use Chip for filters).
 */
export function Tag({ children, tone = 'default' }: TagProps) {
  const theme = useTheme();
  const tones: Record<TagTone, { fg: string; border: string; bg: string }> = {
    default: { fg: theme.colors.textSecondary, border: theme.colors.borderDefault, bg: 'transparent' },
    brand: { fg: theme.colors.textBrand, border: theme.colors.brandSubtle2, bg: theme.colors.brandSubtle },
  };
  const t = tones[tone];

  return (
    <View
      style={{
        height: 24,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.bg,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: theme.radius.sm,
      }}
    >
      <Text
        style={{
          fontFamily: theme.typography.fonts.sans,
          fontSize: theme.typography.sizes.caption,
          fontWeight: theme.typography.weights.medium,
          color: t.fg,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
