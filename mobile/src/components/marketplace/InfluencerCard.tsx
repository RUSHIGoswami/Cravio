import React from 'react';
import { Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { Theme } from '../../theme';
import { formatIndianCompact } from '../../utils/format';
import { Avatar } from '../data-display/Avatar';
import { Tag } from '../data-display/Tag';
import { VerifiedBadge } from '../data-display/VerifiedBadge';

export interface InfluencerCardProps {
  name: string;
  /** e.g. "@aanya.styles" */
  handle: string;
  avatar?: string;
  verified?: boolean;
  location?: string;
  /** Niche tags — first 3 shown, rest collapse to +N */
  niches?: string[];
  /** Raw follower count — formatted to K/L/Cr */
  followers: number;
  /** Engagement rate %, highlighted green when strong */
  engagement?: number;
  languages?: string[];
  onPress?: (e: GestureResponderEvent) => void;
  /** Trailing action node (e.g. a follow/save IconButton) */
  action?: React.ReactNode;
}

/**
 * Cravio InfluencerCard — the discovery-feed unit.
 * Avatar + handle + verified + niche tags + key metrics row.
 */
export function InfluencerCard({ name, handle, avatar, verified = false, location, niches = [], followers, engagement, languages = [], onPress, action = null }: InfluencerCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        gap: theme.spacing[4],
        backgroundColor: theme.colors.bgSurface,
        borderWidth: 1.5,
        borderColor: theme.colors.borderSubtle,
        borderRadius: theme.radius.lg,
        padding: theme.spacing[5],
        ...theme.elevation[1],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4] }}>
        <Avatar name={name} src={avatar} verified={verified} size={52} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: theme.typography.sizes.h3, fontWeight: theme.typography.weights.bold, color: theme.colors.textPrimary }}
            >
              {name}
            </Text>
            {verified && <VerifiedBadge size="sm" />}
          </View>
          <Text style={{ fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary }}>
            {handle}{location ? ` · ${location}` : ''}
          </Text>
        </View>
        {action}
      </View>

      {niches.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {niches.slice(0, 3).map((n) => (
            <Tag key={n}>{n}</Tag>
          ))}
          {niches.length > 3 && <Tag>+{niches.length - 3}</Tag>}
        </View>
      )}

      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.colors.borderSubtle, paddingTop: theme.spacing[4] }}>
        <Metric theme={theme} label="Followers" value={formatIndianCompact(followers)} />
        <Divider theme={theme} />
        <Metric theme={theme} label="Engagement" value={engagement != null ? `${engagement}%` : '—'} accent={engagement != null && engagement >= 3} />
        <Divider theme={theme} />
        <Metric theme={theme} label="Languages" value={languages.length ? languages.join(', ') : '—'} small />
      </View>
    </Pressable>
  );
}

function Metric({ theme, label, value, accent = false, small = false }: { theme: Theme; label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        numberOfLines={1}
        style={{
          fontSize: small ? theme.typography.sizes.label : theme.typography.sizes.h3,
          fontWeight: theme.typography.weights.bold,
          color: accent ? theme.colors.verifiedHover : theme.colors.textPrimary,
          fontVariant: theme.typography.numericTabular as unknown as ('tabular-nums' | 'lining-nums')[],
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: theme.typography.sizes.micro, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.66, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function Divider({ theme }: { theme: Theme }) {
  return <View style={{ width: 1, backgroundColor: theme.colors.borderSubtle, marginHorizontal: theme.spacing[4] }} />;
}
