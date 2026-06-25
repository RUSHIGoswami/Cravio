import React, { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Avatar } from '../components/data-display/Avatar';
import { VerifiedBadge } from '../components/data-display/VerifiedBadge';
import { Tag } from '../components/data-display/Tag';
import { StatusPill } from '../components/data-display/StatusPill';
import { Card } from '../components/surfaces/Card';
import { Tabs } from '../components/navigation/Tabs';
import { Button } from '../components/buttons/Button';
import { Icons } from '../components/icons/Icon';
import { APPLICATIONS } from '../data/demo';

const STATS: [string, string][] = [
  ['1.28L', 'Followers'],
  ['4.2%', 'Engagement'],
  ['₹68K', 'Earned'],
];

/** My Influence — creator portfolio: profile header + earnings + applications. */
export function PortfolioScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('activity');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      <View style={{ backgroundColor: theme.colors.bgSurface, borderBottomWidth: 1.5, borderBottomColor: theme.colors.borderSubtle }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing[5], paddingTop: insets.top + 14, paddingBottom: 4 }}>
          <Text style={{ ...theme.typography.textStyles.h3, color: theme.colors.textPrimary }}>My Influence</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.bgSubtle,
              borderWidth: 1.5,
              borderColor: theme.colors.borderSubtle,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}
          >
            <Icons.Settings size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing[4], alignItems: 'center', paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[4] }}>
          <Avatar name="Aanya R" size={64} verified />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ ...theme.typography.textStyles.h2, color: theme.colors.textPrimary }}>Aanya R</Text>
              <VerifiedBadge size="sm" />
            </View>
            <Text style={{ ...theme.typography.textStyles.caption, color: theme.colors.textSecondary }}>@aanya.styles · Jaipur</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: theme.spacing[2] }}>
              <Tag>Fashion</Tag>
              <Tag>Beauty</Tag>
              <Tag tone="brand">Festive</Tag>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[4] }}>
          {STATS.map(([value, label], i) => (
            <View
              key={label}
              style={{
                flex: 1,
                alignItems: i === 0 ? 'flex-start' : 'center',
                borderLeftWidth: i ? 1 : 0,
                borderLeftColor: theme.colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  ...theme.typography.textStyles.h2,
                  color: i === 2 ? theme.colors.verifiedHover : theme.colors.textPrimary,
                  fontVariant: theme.typography.numericTabular as unknown as ('tabular-nums' | 'lining-nums')[],
                }}
              >
                {value}
              </Text>
              <Text style={{ fontSize: theme.typography.sizes.micro, textTransform: 'uppercase', letterSpacing: 0.66, color: theme.colors.textTertiary, marginTop: 2 }}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ paddingHorizontal: theme.spacing[4] }}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'activity', label: 'Applications', count: APPLICATIONS.length },
              { value: 'media', label: 'Media kit' },
            ]}
          />
        </View>
      </View>

      {tab === 'activity' ? (
        <FlatList
          data={APPLICATIONS}
          keyExtractor={(a) => a.title}
          contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[3] }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing[3] }} />}
          renderItem={({ item }) => (
            <Card padding="md" elevation={1} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
              <View style={{ width: 40, height: 40, borderRadius: theme.radius.md, backgroundColor: theme.colors.brandSubtle, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: theme.typography.weights.bold, color: theme.colors.textBrand }}>{item.brand[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ ...theme.typography.textStyles.body, fontWeight: theme.typography.weights.semibold, color: theme.colors.textPrimary }}>
                  {item.title}
                </Text>
                <Text style={{ ...theme.typography.textStyles.caption, color: theme.colors.textSecondary }}>
                  {item.brand} · {item.budget}
                </Text>
              </View>
              <StatusPill status={item.status} />
            </Card>
          )}
        />
      ) : (
        <View style={{ padding: theme.spacing[4] }}>
          <Card padding="lg" elevation={1} style={{ alignItems: 'center' }}>
            <Text style={{ ...theme.typography.textStyles.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing[2], textAlign: 'center' }}>
              Your media kit is ready
            </Text>
            <Text style={{ ...theme.typography.textStyles.body, color: theme.colors.textSecondary, marginBottom: theme.spacing[4], textAlign: 'center' }}>
              Share verified metrics and past collaborations with brands in one tap.
            </Text>
            <Button variant="secondary">Share media kit</Button>
          </Card>
        </View>
      )}
    </View>
  );
}
