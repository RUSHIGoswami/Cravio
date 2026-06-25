import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/buttons/Button';
import { Input } from '../components/forms/Input';
import { Chip } from '../components/forms/Chip';
import { VerifiedBadge } from '../components/data-display/VerifiedBadge';

const ALL_NICHES = ['Fashion', 'Beauty', 'Food', 'Tech', 'Fitness', 'Travel', 'Gaming', 'Finance'];

export interface OnboardingScreenProps {
  onDone?: () => void;
}

/** Onboarding — influencer sign-up + verification handoff. */
export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [niches, setNiches] = useState<Record<string, boolean>>({ Fashion: true, Beauty: true });
  const toggle = (k: string) => setNiches((s) => ({ ...s, [k]: !s[k] }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgSurface }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: theme.spacing[7], gap: theme.spacing[5] }}>
        <Text style={{ ...theme.typography.textStyles.display, color: theme.colors.textPrimary }}>
          Get verified,{'\n'}get paid.
        </Text>
        <Text style={{ ...theme.typography.textStyles.bodyLg, color: theme.colors.textSecondary }}>
          Set up your creator profile. Brands find you by niche, language and verified reach — commission-free.
        </Text>

        <View style={{ gap: theme.spacing[4] }}>
          <Input label="Display name" placeholder="Your public name" value={name} onChangeText={setName} />
          <Input label="Instagram handle" placeholder="@yourhandle" value={handle} onChangeText={setHandle} />
        </View>

        <View>
          <Text style={{ ...theme.typography.textStyles.label, color: theme.colors.textPrimary, marginBottom: theme.spacing[3] }}>
            Pick your niches
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[3] }}>
            {ALL_NICHES.map((n) => (
              <Chip key={n} selected={!!niches[n]} onPress={() => toggle(n)}>
                {n}
              </Chip>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing[3], backgroundColor: theme.colors.verifiedSubtle, borderRadius: theme.radius.md, padding: theme.spacing[4] }}>
          <VerifiedBadge size="md" />
          <Text style={{ flex: 1, ...theme.typography.textStyles.caption, color: theme.colors.verifiedHover }}>
            <Text style={{ fontWeight: theme.typography.weights.bold }}>Next: verify your account. </Text>
            We confirm your reach across platforms — usually under 24h. Verified creators get 3× more campaign invites.
          </Text>
        </View>
      </ScrollView>

      <View style={{ padding: theme.spacing[5], borderTopWidth: 1.5, borderTopColor: theme.colors.borderSubtle }}>
        <Button variant="primary" size="lg" block onPress={onDone}>
          Continue to verification
        </Button>
      </View>
    </View>
  );
}
