import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/buttons/Button';
import { IconButton } from '../components/buttons/IconButton';
import { Input } from '../components/forms/Input';
import { Select } from '../components/forms/Select';
import { Chip } from '../components/forms/Chip';
import { Card } from '../components/surfaces/Card';
import { Icons } from '../components/icons/Icon';

const STEPS = ['Basics', 'Audience', 'Deliverables', 'Budget', 'Review'];
const AUDIENCE_NICHES = ['Fashion', 'Beauty', 'Festive', 'Lifestyle', 'Food', 'Fitness'];

export interface BuilderScreenProps {
  onClose?: () => void;
}

/** 5-step campaign builder (brand side) — stepper + per-step forms. */
export function BuilderScreen({ onClose }: BuilderScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [niches, setNiches] = useState<Record<string, boolean>>({ Fashion: true });
  const toggle = (k: string) => setNiches((s) => ({ ...s, [k]: !s[k] }));

  const reviewRows: [string, string][] = [
    ['Title', 'Summer ethnic-wear haul'],
    ['Type', 'Reel + Story'],
    ['Niches', Object.keys(niches).filter((k) => niches[k]).join(', ') || '—'],
    ['Language', 'Hindi'],
    ['Budget', '₹15,000 / creator'],
    ['Deadline', '5 days'],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgSurface }}>
      <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: insets.top + theme.spacing[4], paddingBottom: theme.spacing[4], borderBottomWidth: 1.5, borderBottomColor: theme.colors.borderSubtle }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing[4] }}>
          <IconButton variant="ghost" label="Back" onPress={() => (step > 0 ? setStep(step - 1) : onClose?.())}>
            <Icons.Back size={20} color={theme.colors.textSecondary} />
          </IconButton>
          <Text style={{ ...theme.typography.textStyles.h3, color: theme.colors.textPrimary }}>New campaign</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flex: 1 }}>
              <View style={{ height: 4, borderRadius: 3, backgroundColor: i <= step ? theme.colors.brand : theme.colors.borderDefault }} />
              <Text
                style={{
                  fontSize: theme.typography.sizes.micro,
                  color: i === step ? theme.colors.textBrand : theme.colors.textTertiary,
                  fontWeight: i === step ? theme.typography.weights.bold : theme.typography.weights.medium,
                  marginTop: 5,
                }}
              >
                {s}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
        {step === 0 && (
          <>
            <Input label="Campaign title" placeholder="e.g. Summer ethnic-wear haul" />
            <Select label="Campaign type" value="Reel + Story" options={['Reel', 'Story + Post', 'Reel + Story', 'Long-form video', 'UGC']} />
          </>
        )}
        {step === 1 && (
          <>
            <View>
              <Text style={{ ...theme.typography.textStyles.label, color: theme.colors.textPrimary, marginBottom: theme.spacing[3] }}>
                Target niches
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[3] }}>
                {AUDIENCE_NICHES.map((n) => (
                  <Chip key={n} selected={!!niches[n]} onPress={() => toggle(n)}>
                    {n}
                  </Chip>
                ))}
              </View>
            </View>
            <Select label="Primary language" value="Hindi" options={['Hindi', 'Tamil', 'Telugu', 'Bengali', 'English']} />
            <Input label="Min. followers" keyboardType="numeric" placeholder="50000" helper="Verified creators only is recommended" />
          </>
        )}
        {step === 2 && (
          <>
            <Input label="Deliverables" placeholder="1 Reel + 2 Stories" />
            <Input label="Brief / usage rights" placeholder="Describe the ask, dos & don'ts…" />
          </>
        )}
        {step === 3 && (
          <>
            <Input label="Budget per creator" keyboardType="numeric" placeholder="15000" leadingIcon={<Text style={{ fontWeight: theme.typography.weights.bold, color: theme.colors.textTertiary }}>₹</Text>} />
            <Input label="Application deadline" placeholder="5 days from now" />
            <Card padding="sm" elevation={0} style={{ backgroundColor: theme.colors.verifiedSubtle, borderColor: 'transparent' }}>
              <Text style={{ ...theme.typography.textStyles.caption, color: theme.colors.verifiedHover }}>
                Payment is held in escrow and released on approved delivery — commission-free for both sides.
              </Text>
            </Card>
          </>
        )}
        {step === 4 && (
          <>
            <Text style={{ ...theme.typography.textStyles.h3, color: theme.colors.textPrimary }}>Review & publish</Text>
            {reviewRows.map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing[3], borderBottomWidth: 1, borderBottomColor: theme.colors.borderSubtle }}>
                <Text style={{ ...theme.typography.textStyles.body, color: theme.colors.textSecondary }}>{k}</Text>
                <Text style={{ ...theme.typography.textStyles.body, fontWeight: theme.typography.weights.semibold, color: theme.colors.textPrimary, maxWidth: 200, textAlign: 'right' }}>
                  {v}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={{ padding: theme.spacing[4], borderTopWidth: 1.5, borderTopColor: theme.colors.borderSubtle }}>
        <Button variant="primary" size="lg" block onPress={() => (step < 4 ? setStep(step + 1) : onClose?.())}>
          {step < 4 ? 'Continue' : 'Publish campaign'}
        </Button>
      </View>
    </View>
  );
}
