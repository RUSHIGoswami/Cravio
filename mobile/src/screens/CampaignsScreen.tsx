import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Tabs } from '../components/navigation/Tabs';
import { CampaignTile } from '../components/marketplace/CampaignTile';
import { Card } from '../components/surfaces/Card';
import { Icons } from '../components/icons/Icon';
import { CAMPAIGNS } from '../data/demo';

/** Campaign feed — creator browsing brand campaigns. The + FAB opens the builder. */
export function CampaignsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [tab, setTab] = useState('foryou');
  const appliedCount = useMemo(() => CAMPAIGNS.filter((c) => c.status).length, []);
  const list = tab === 'applied' ? CAMPAIGNS.filter((c) => c.status) : CAMPAIGNS;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: insets.top + theme.spacing[4], backgroundColor: theme.colors.bgSurface, borderBottomWidth: 1.5, borderBottomColor: theme.colors.borderSubtle }}>
        <Text style={{ ...theme.typography.textStyles.h1, color: theme.colors.textPrimary, marginBottom: theme.spacing[3] }}>Campaigns</Text>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'foryou', label: 'For you' },
            { value: 'applied', label: 'Applied', count: appliedCount },
          ]}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(c) => c.title}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing[4] }} />}
        ListHeaderComponent={
          tab === 'foryou' ? (
            <Card padding="md" elevation={0} style={{ backgroundColor: theme.colors.brandSubtle, borderColor: theme.colors.brandSubtle2, marginBottom: theme.spacing[4], flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
              <View style={{ width: 36, height: 36, borderRadius: theme.radius.md, backgroundColor: theme.colors.brand, alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Spark size={20} color={theme.colors.textOnBrand} />
              </View>
              <Text style={{ flex: 1, ...theme.typography.textStyles.caption, color: theme.colors.textBrand }}>
                <Text style={{ fontWeight: theme.typography.weights.bold }}>AI-matched for you. </Text>
                Ranked by your niche, language and past performance.
              </Text>
            </Card>
          ) : null
        }
        renderItem={({ item }) => <CampaignTile {...item} />}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New campaign"
        onPress={() => navigation.getParent()?.navigate('Builder' as never)}
        style={{
          position: 'absolute',
          right: theme.spacing[5],
          bottom: theme.spacing[5],
          width: theme.touchMin + 8,
          height: theme.touchMin + 8,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadowBrand,
        }}
      >
        <Icons.Plus size={24} color={theme.colors.textOnBrand} />
      </Pressable>
    </View>
  );
}
