import React from 'react';
import { Image, Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { Theme } from '../../theme';
import { StatusPill, type CampaignStatus } from '../data-display/StatusPill';
import { Tag } from '../data-display/Tag';

export interface CampaignTileProps {
  title: string;
  brand: string;
  brandLogo?: string;
  /** e.g. "Reel", "Story + Post", "UGC" */
  type?: string;
  /** Pre-formatted budget string, e.g. "₹15K" */
  budget: string;
  /** Pre-formatted deadline string, e.g. "5 days left" */
  deadline: string;
  /** AI match score 0–100 */
  match?: number;
  status?: CampaignStatus;
  niches?: string[];
  onPress?: (e: GestureResponderEvent) => void;
}

/**
 * Cravio CampaignTile — brand campaign in the feed.
 * Title, type, budget, deadline, and a match indicator.
 */
export function CampaignTile({ title, brand, brandLogo, type, budget, deadline, match, status, niches = [], onPress }: CampaignTileProps) {
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
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[4] }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.brandSubtle,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {brandLogo ? (
            <Image source={{ uri: brandLogo }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={{ fontWeight: theme.typography.weights.bold, fontSize: theme.typography.sizes.h3, color: theme.colors.textBrand }}>
              {(brand || '?')[0]}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: theme.typography.fonts.sans,
              fontSize: theme.typography.sizes.bodyLg,
              fontWeight: theme.typography.weights.bold,
              color: theme.colors.textPrimary,
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary, marginTop: 2 }}>
            {brand}{type ? ` · ${type}` : ''}
          </Text>
        </View>
        {status && <StatusPill status={status} />}
      </View>

      {niches.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {niches.map((n) => (
            <Tag key={n}>{n}</Tag>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[5] }}>
        <Field theme={theme} label="Budget" value={budget} />
        <Field theme={theme} label="Deadline" value={deadline} />
        {match != null && (
          <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: theme.typography.sizes.h3,
                fontWeight: theme.typography.weights.bold,
                color: theme.colors.textBrand,
                fontVariant: theme.typography.numericTabular as unknown as ('tabular-nums' | 'lining-nums')[],
              }}
            >
              {match}%
            </Text>
            <Text style={{ fontSize: theme.typography.sizes.micro, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.66, marginTop: 3 }}>
              Match
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function Field({ theme, label, value }: { theme: Theme; label: string; value: string }) {
  return (
    <View>
      <Text
        style={{
          fontSize: theme.typography.sizes.body,
          fontWeight: theme.typography.weights.bold,
          color: theme.colors.textPrimary,
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
