import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/buttons/Button';
import { Chip } from '../components/forms/Chip';
import { VerifiedBadge } from '../components/data-display/VerifiedBadge';
import { Icons } from '../components/icons/Icon';
import { formatIndianCompact } from '../utils/format';
import { getStoredToken } from '../services/authService';
import {
  ensureProfile,
  updateProfile,
  connectSocial,
  type ProfileResponse,
  type Platform,
} from '../services/influencerService';
import { authorizeSocial } from '../services/socialProvider';

const ALL_CATEGORIES = ['Fashion', 'Beauty', 'Food', 'Tech', 'Fitness', 'Travel', 'Gaming', 'Finance'];

type Step = 'connect' | 'profile' | 'collabpass';

export interface OnboardingScreenProps {
  /** Called when onboarding completes — host navigates to the campaign feed. */
  onComplete?: () => void;
}

/** Resume point: connect until an account is linked, then profile until niche +
 *  ≥1 category, then the Collab Pass step. Makes the flow resumable if abandoned. */
function deriveStep(p: ProfileResponse): Step {
  if (p.social_accounts.length === 0) return 'connect';
  if (!p.niche || p.categories.length === 0) return 'profile';
  return 'collabpass';
}

/**
 * A4 — Influencer onboarding flow.
 * connect Instagram/YouTube → verified metrics + badge → niche/bio/categories →
 * (optional Collab Pass placeholder) → land on the campaign feed.
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [step, setStep] = useState<Step>('connect');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile-step form state, seeded from any resumed profile.
  const [niche, setNiche] = useState('');
  const [bio, setBio] = useState('');
  const [categories, setCategories] = useState<Record<string, boolean>>({});
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const t = await getStoredToken();
        if (!t) throw new Error('No auth token — please sign in again.');
        const p = await ensureProfile(t);
        if (!active) return;
        setToken(t);
        setProfile(p);
        setNiche(p.niche ?? '');
        setBio(p.bio ?? '');
        setCategories(Object.fromEntries(p.categories.map((c) => [c, true])));
        setStep(deriveStep(p));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load onboarding.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleConnect(platform: Platform) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const code = await authorizeSocial(platform);
      const updated = await connectSocial(token, platform, code);
      setProfile(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect that account. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile() {
    if (!token) return;
    const selected = ALL_CATEGORIES.filter((c) => categories[c]);
    if (!niche.trim() || selected.length === 0) {
      setProfileError('Add your niche and at least one category to continue.');
      return;
    }
    setProfileError(null);
    setBusy(true);
    setError(null);
    try {
      const updated = await updateProfile(token, { niche: niche.trim(), bio: bio.trim() || null, categories: selected });
      setProfile(updated);
      setStep('collabpass');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const connectedAccounts = profile?.social_accounts ?? [];
  const hasConnected = connectedAccounts.length > 0;

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

        {step === 'connect' && (
          <ConnectStep
            onConnect={handleConnect}
            busy={busy}
            accounts={connectedAccounts}
            verified={!!profile?.verified}
          />
        )}

        {step === 'profile' && (
          <ProfileStep
            niche={niche}
            setNiche={setNiche}
            bio={bio}
            setBio={setBio}
            categories={categories}
            toggleCategory={(k) => setCategories((s) => ({ ...s, [k]: !s[k] }))}
            error={profileError}
          />
        )}

        {step === 'collabpass' && <CollabPassStep />}
      </ScrollView>

      <View style={{ padding: theme.spacing[5], borderTopWidth: 1.5, borderTopColor: theme.colors.borderSubtle, gap: theme.spacing[3] }}>
        {step === 'connect' && (
          <Button testID="btn-next" variant="primary" size="lg" block disabled={!hasConnected || busy} onPress={() => setStep('profile')}>
            Continue
          </Button>
        )}
        {step === 'profile' && (
          <Button testID="btn-next" variant="primary" size="lg" block disabled={busy} onPress={handleSaveProfile}>
            Continue
          </Button>
        )}
        {step === 'collabpass' && (
          <>
            <Button testID="btn-finish" variant="primary" size="lg" block onPress={onComplete}>
              Explore campaigns
            </Button>
            <Button testID="btn-skip-collabpass" variant="tertiary" size="md" block onPress={onComplete}>
              Maybe later
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

interface ConnectStepProps {
  onConnect: (platform: Platform) => void;
  busy: boolean;
  accounts: ProfileResponse['social_accounts'];
  verified: boolean;
}

function ConnectStep({ onConnect, busy, accounts, verified }: ConnectStepProps) {
  const theme = useTheme();
  const connected = (p: Platform) => accounts.some((a) => a.platform === p);

  return (
    <View style={{ gap: theme.spacing[5] }}>
      <View style={{ gap: theme.spacing[3] }}>
        <Text style={{ ...theme.typography.textStyles.display, color: theme.colors.textPrimary }}>Get verified,{'\n'}get paid.</Text>
        <Text style={{ ...theme.typography.textStyles.bodyLg, color: theme.colors.textSecondary }}>
          Connect an account so brands see your real, verified reach — commission-free.
        </Text>
      </View>

      <View style={{ gap: theme.spacing[3] }}>
        <Button
          testID="btn-connect-instagram"
          variant={connected('instagram') ? 'secondary' : 'primary'}
          size="lg"
          block
          disabled={busy}
          onPress={() => onConnect('instagram')}
        >
          {connected('instagram') ? 'Instagram connected' : 'Connect Instagram'}
        </Button>
        <Button
          testID="btn-connect-youtube"
          variant={connected('youtube') ? 'secondary' : 'primary'}
          size="lg"
          block
          disabled={busy}
          onPress={() => onConnect('youtube')}
        >
          {connected('youtube') ? 'YouTube connected' : 'Connect YouTube'}
        </Button>
      </View>

      {busy ? <ActivityIndicator color={theme.colors.brand} /> : null}

      {accounts.map((a) => (
        <View
          key={a.platform}
          testID={`metrics-${a.platform}`}
          style={{ gap: theme.spacing[3], backgroundColor: theme.colors.verifiedSubtle, borderRadius: theme.radius.md, padding: theme.spacing[4] }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            {verified ? <VerifiedBadge size="md" /> : null}
            <Text style={{ ...theme.typography.textStyles.label, color: theme.colors.verifiedHover, textTransform: 'capitalize' }}>
              {a.platform}{verified ? ' · Verified' : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: theme.spacing[5] }}>
            <Metric label="Followers" value={formatIndianCompact(a.followers)} theme={theme} />
            <Metric label="Reach" value={formatIndianCompact(a.reach)} theme={theme} />
            <Metric label="Engagement" value={`${a.engagement_rate}%`} theme={theme} />
          </View>
        </View>
      ))}
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Metric({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View>
      <Text style={{ ...theme.typography.textStyles.h2, color: theme.colors.verifiedHover }}>{value}</Text>
      <Text style={{ ...theme.typography.textStyles.caption, color: theme.colors.verifiedHover }}>{label}</Text>
    </View>
  );
}

interface ProfileStepProps {
  niche: string;
  setNiche: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  categories: Record<string, boolean>;
  toggleCategory: (k: string) => void;
  error: string | null;
}

function ProfileStep({ niche, setNiche, bio, setBio, categories, toggleCategory, error }: ProfileStepProps) {
  const theme = useTheme();
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

  return (
    <View style={{ gap: theme.spacing[5] }}>
      <View style={{ gap: theme.spacing[3] }}>
        <Text style={{ ...theme.typography.textStyles.display, color: theme.colors.textPrimary }}>Tell brands{'\n'}who you are.</Text>
        <Text style={{ ...theme.typography.textStyles.bodyLg, color: theme.colors.textSecondary }}>
          This is how you show up in discovery.
        </Text>
      </View>

      <View style={{ gap: theme.spacing[2] }}>
        <Text style={{ ...theme.typography.textStyles.label, color: theme.colors.textPrimary }}>Your niche</Text>
        <TextInput
          testID="input-niche"
          value={niche}
          onChangeText={setNiche}
          placeholder="e.g. Fashion & Beauty"
          placeholderTextColor={theme.colors.textTertiary}
          style={fieldStyle}
        />
      </View>

      <View style={{ gap: theme.spacing[2] }}>
        <Text style={{ ...theme.typography.textStyles.label, color: theme.colors.textPrimary }}>Bio</Text>
        <TextInput
          testID="input-bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell brands about yourself"
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          style={[fieldStyle, { height: 96, paddingTop: 12, textAlignVertical: 'top' }]}
        />
      </View>

      <View style={{ gap: theme.spacing[3] }}>
        <Text style={{ ...theme.typography.textStyles.label, color: theme.colors.textPrimary }}>Categories</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[3] }}>
          {ALL_CATEGORIES.map((c) => (
            <Chip key={c} selected={!!categories[c]} onPress={() => toggleCategory(c)}>
              {c}
            </Chip>
          ))}
        </View>
      </View>

      {error ? (
        <View testID="error-profile" style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
          <Icons.Bell size={16} color={theme.colors.error ?? theme.colors.textSecondary} />
          <Text style={{ ...theme.typography.textStyles.caption, color: theme.colors.error ?? theme.colors.textSecondary }}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CollabPassStep() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing[5] }}>
      <View style={{ gap: theme.spacing[3] }}>
        <Text style={{ ...theme.typography.textStyles.display, color: theme.colors.textPrimary }}>You're{'\n'}all set.</Text>
        <Text style={{ ...theme.typography.textStyles.bodyLg, color: theme.colors.textSecondary }}>
          Want more invites? Collab Pass surfaces you to more brands.
        </Text>
      </View>
      <View style={{ gap: theme.spacing[3], backgroundColor: theme.colors.brandSubtle, borderRadius: theme.radius.md, padding: theme.spacing[5] }}>
        <Text style={{ ...theme.typography.textStyles.h2, color: theme.colors.textBrand }}>Collab Pass</Text>
        <Text style={{ ...theme.typography.textStyles.body, color: theme.colors.textSecondary }}>
          Coming soon — a boost for verified creators. No commission, ever.
        </Text>
      </View>
    </View>
  );
}
