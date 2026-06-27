import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/buttons/Button';
import { Icons } from '../components/icons/Icon';
import { getStoredToken } from '../services/authService';
import { getBrandProfile, saveBrandProfile } from '../services/brandService';

export interface BrandOnboardingScreenProps {
  /** Called when the profile is saved — host routes the brand into the campaign builder. */
  onComplete?: () => void;
}

/**
 * A5 — Brand profile setup.
 * Company name, industry, website, optional GST → brand lands ready to create a campaign.
 * Resumable: an existing profile pre-fills the form.
 */
export function BrandOnboardingScreen({ onComplete }: BrandOnboardingScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [gst, setGst] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const t = await getStoredToken();
        if (!t) throw new Error('No auth token — please sign in again.');
        const p = await getBrandProfile(t);
        if (!active) return;
        setToken(t);
        if (p) {
          setCompany(p.company_name);
          setIndustry(p.industry);
          setWebsite(p.website);
          setGst(p.gst ?? '');
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load brand setup.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    if (!token) return;
    if (!company.trim() || !industry.trim() || !website.trim()) {
      setFormError('Add your company name, industry, and website to continue.');
      return;
    }
    setFormError(null);
    setBusy(true);
    setError(null);
    try {
      await saveBrandProfile(token, {
        company_name: company.trim(),
        industry: industry.trim(),
        website: website.trim(),
        gst: gst.trim() || null,
      });
      onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile. Check your details.');
    } finally {
      setBusy(false);
    }
  }

  const fieldStyle = {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.bgSurface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderDefault,
    borderRadius: theme.radius.md,
    fontFamily: theme.typography.fonts.sans,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  } as const;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bgSurface }}>
        <ActivityIndicator color={theme.colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgSurface }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing[5], paddingTop: insets.top + theme.spacing[7], gap: theme.spacing[5] }}
      >
        {error ? (
          <Text testID="error-global" style={{ ...theme.typography.textStyles.caption, color: theme.colors.error ?? theme.colors.textSecondary }}>
            {error}
          </Text>
        ) : null}

        <View style={{ gap: theme.spacing[3] }}>
          <Text style={{ ...theme.typography.textStyles.display, color: theme.colors.textPrimary }}>Set up{'\n'}your brand.</Text>
          <Text style={{ ...theme.typography.textStyles.bodyLg, color: theme.colors.textSecondary }}>
            A few details and you're ready to launch your first campaign — commission-free.
          </Text>
        </View>

        <Field label="Company name" theme={theme}>
          <TextInput
            testID="input-company"
            value={company}
            onChangeText={setCompany}
            placeholder="e.g. Acme Foods"
            placeholderTextColor={theme.colors.textTertiary}
            style={fieldStyle}
          />
        </Field>

        <Field label="Industry" theme={theme}>
          <TextInput
            testID="input-industry"
            value={industry}
            onChangeText={setIndustry}
            placeholder="e.g. FMCG, Fashion, Tech"
            placeholderTextColor={theme.colors.textTertiary}
            style={fieldStyle}
          />
        </Field>

        <Field label="Website" theme={theme}>
          <TextInput
            testID="input-website"
            value={website}
            onChangeText={setWebsite}
            placeholder="https://your-brand.com"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
            style={fieldStyle}
          />
        </Field>

        <Field label="GST number (optional)" theme={theme}>
          <TextInput
            testID="input-gst"
            value={gst}
            onChangeText={setGst}
            placeholder="15-digit GSTIN"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="characters"
            style={fieldStyle}
          />
        </Field>

        {formError ? (
          <View testID="error-form" style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            <Icons.Bell size={16} color={theme.colors.error ?? theme.colors.textSecondary} />
            <Text style={{ ...theme.typography.textStyles.caption, color: theme.colors.error ?? theme.colors.textSecondary }}>{formError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ padding: theme.spacing[5], borderTopWidth: 1.5, borderTopColor: theme.colors.borderSubtle }}>
        <Button testID="btn-save" variant="primary" size="lg" block disabled={busy} onPress={handleSave}>
          Create my brand
        </Button>
      </View>
    </View>
  );
}

interface FieldProps {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any;
  children: React.ReactNode;
}

function Field({ label, theme, children }: FieldProps) {
  return (
    <View style={{ gap: theme.spacing[2] }}>
      <Text style={{ ...theme.typography.textStyles.label, color: theme.colors.textPrimary }}>{label}</Text>
      {children}
    </View>
  );
}
