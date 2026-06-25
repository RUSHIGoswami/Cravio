import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Input } from '../components/forms/Input';
import { Chip } from '../components/forms/Chip';
import { IconButton } from '../components/buttons/IconButton';
import { InfluencerCard } from '../components/marketplace/InfluencerCard';
import { StateView } from '../components/feedback/StateView';
import { Icons } from '../components/icons/Icon';
import { INFLUENCERS } from '../data/demo';

const NICHE_FILTERS = ['Fashion', 'Food', 'Tech'];

/** Discovery feed + filters — brand searching for creators. */
export function DiscoverScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, boolean>>({ Verified: true, Fashion: false, Food: false, Tech: false });
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setFilters((s) => ({ ...s, [k]: !s[k] }));

  const list = useMemo(() => {
    let result = INFLUENCERS;
    if (filters.Verified) result = result.filter((i) => i.verified);
    const activeNiches = NICHE_FILTERS.filter((n) => filters[n]);
    if (activeNiches.length) result = result.filter((i) => i.niches.some((n) => activeNiches.includes(n)));
    if (query) result = result.filter((i) => (i.name + i.handle).toLowerCase().includes(query.toLowerCase()));
    return result;
  }, [filters, query]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: insets.top + theme.spacing[4], paddingBottom: theme.spacing[3], backgroundColor: theme.colors.bgSurface, borderBottomWidth: 1.5, borderBottomColor: theme.colors.borderSubtle, gap: theme.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ ...theme.typography.textStyles.h1, color: theme.colors.textPrimary }}>Discover</Text>
          <IconButton variant="ghost" label="Notifications">
            <Icons.Bell size={22} color={theme.colors.textSecondary} />
          </IconButton>
        </View>
        <Input value={query} onChangeText={setQuery} placeholder="Search creators, niches…" leadingIcon={<Icons.Search size={18} color={theme.colors.textTertiary} />} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['Verified', ...NICHE_FILTERS]}
          keyExtractor={(k) => k}
          contentContainerStyle={{ gap: theme.spacing[3] }}
          renderItem={({ item }) => (
            <Chip
              selected={!!filters[item]}
              onPress={() => toggle(item)}
              leadingIcon={item === 'Verified' ? <Icons.Check size={14} color={filters.Verified ? theme.colors.textBrand : theme.colors.textSecondary} /> : undefined}
            >
              {item}
            </Chip>
          )}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(i) => i.handle}
        contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing[4] }} />}
        ListHeaderComponent={
          <Text style={{ ...theme.typography.textStyles.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing[3] }}>
            {list.length} creator{list.length !== 1 ? 's' : ''} match your filters
          </Text>
        }
        ListEmptyComponent={<StateView mode="empty" title="No matches" message="Try removing a filter to widen your search." />}
        renderItem={({ item }) => (
          <InfluencerCard
            {...item}
            action={
              <IconButton
                variant={saved[item.handle] ? 'brand' : 'surface'}
                label="Save"
                onPress={() => setSaved((s) => ({ ...s, [item.handle]: !s[item.handle] }))}
              >
                <Icons.Save size={18} color={saved[item.handle] ? theme.colors.textOnBrand : theme.colors.textPrimary} />
              </IconButton>
            }
          />
        )}
      />
    </View>
  );
}
