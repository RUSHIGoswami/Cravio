/**
 * OnboardingScreen — A4 influencer onboarding flow (mobile).
 * Acceptance criteria asserted here, then implemented to green:
 *  1. End-to-end flow completes against stubbed verification and shows
 *     verified metrics + badge.
 *  2. Validation errors are surfaced inline; flow is resumable if abandoned.
 *  3. On completion the user lands on the campaign discovery feed (onComplete fires).
 */
jest.mock('react-native-safe-area-context', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SafeAreaProvider: ({ children }: { children: any }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../src/services/influencerService', () => ({
  ensureProfile: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  connectSocial: jest.fn(),
}));

jest.mock('../src/services/socialProvider', () => ({
  authorizeSocial: jest.fn(async (p: string) => `stub-oauth-${p}`),
}));

jest.mock('../src/services/authService', () => ({
  getStoredToken: jest.fn(async () => 'stored-jwt'),
}));

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { ensureProfile, updateProfile, connectSocial } from '../src/services/influencerService';
import { authorizeSocial } from '../src/services/socialProvider';

const EMPTY = { user_id: 'u1', niche: null, bio: null, categories: [], verified: false, social_accounts: [] };
const CONNECTED = {
  user_id: 'u1',
  niche: null,
  bio: null,
  categories: [],
  verified: true,
  social_accounts: [
    { platform: 'instagram', followers: 12000, reach: 48000, engagement_rate: 4.2, connected_at: '2026-01-01T00:00:00Z' },
  ],
};
const FILLED = { ...CONNECTED, niche: 'Fashion', categories: ['Fashion'] };

// OnboardingScreen loads its profile in an async mount effect. Wrapping the
// render in act() lets that effect's promises settle inside an act scope, so the
// first step renders deterministically (jest-expo's env otherwise leaves the
// mount update unflushed — flaky "render has not been called" / act warnings).
async function renderScreen(onComplete = jest.fn()) {
  await act(async () => {
    render(
      <SafeAreaProvider>
        <ThemeProvider scheme="light">
          <OnboardingScreen onComplete={onComplete} />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
  });
  return { onComplete };
}

// Chained interactions depend on prior state being committed. jest-expo's renderer
// doesn't flush synchronous fireEvents between each other, so wrap each in act().
async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}
async function pressText(text: string) {
  await act(async () => {
    fireEvent.press(screen.getByText(text));
  });
}
async function type(testID: string, value: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), value);
  });
}

describe('OnboardingScreen (A4)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('criterion 1 — connecting Instagram shows verified metrics + badge', async () => {
    (ensureProfile as jest.Mock).mockResolvedValue(EMPTY);
    (connectSocial as jest.Mock).mockResolvedValue(CONNECTED);

    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('btn-connect-instagram')).toBeTruthy());
    await press('btn-connect-instagram');

    await waitFor(() => {
      expect(authorizeSocial).toHaveBeenCalledWith('instagram');
      expect(connectSocial).toHaveBeenCalledWith('stored-jwt', 'instagram', 'stub-oauth-instagram');
      // badge (VerifiedBadge exposes accessibilityLabel "Verified")
      expect(screen.getAllByLabelText('Verified').length).toBeGreaterThan(0);
      // verified follower count, Indian-compact (12000 -> 12K)
      expect(screen.getByText(/12K/)).toBeTruthy();
    });
  });

  test('criterion 3 — completing the flow fires onComplete (lands on feed)', async () => {
    (ensureProfile as jest.Mock).mockResolvedValue(EMPTY);
    (connectSocial as jest.Mock).mockResolvedValue(CONNECTED);
    (updateProfile as jest.Mock).mockResolvedValue(FILLED);

    const { onComplete } = await renderScreen();

    await waitFor(() => expect(screen.getByTestId('btn-connect-instagram')).toBeTruthy());
    await press('btn-connect-instagram');
    await waitFor(() => expect(screen.getByText(/12K/)).toBeTruthy());

    // advance to profile step
    await press('btn-next');
    await waitFor(() => expect(screen.getByTestId('input-niche')).toBeTruthy());

    await type('input-niche', 'Fashion');
    await pressText('Fashion');
    await press('btn-next');

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith('stored-jwt', expect.objectContaining({
        niche: 'Fashion',
        categories: expect.arrayContaining(['Fashion']),
      })),
    );

    // Collab Pass placeholder step -> finish
    await waitFor(() => expect(screen.getByTestId('btn-finish')).toBeTruthy());
    await press('btn-finish');

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });

  test('criterion 2a — invalid profile step surfaces an inline error and does not submit', async () => {
    // resume straight into the profile step (account connected, no niche yet)
    (ensureProfile as jest.Mock).mockResolvedValue(CONNECTED);

    const { onComplete } = await renderScreen();

    await waitFor(() => expect(screen.getByTestId('input-niche')).toBeTruthy());
    // press continue with empty niche + no category selected
    await press('btn-next');

    await waitFor(() => expect(screen.getByTestId('error-profile')).toBeTruthy());
    expect(updateProfile).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('criterion 2b — resumable: a connected-but-incomplete profile skips the connect step', async () => {
    (ensureProfile as jest.Mock).mockResolvedValue(CONNECTED);

    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('input-niche')).toBeTruthy());
    // connect step is behind us — its buttons should not be on screen
    expect(screen.queryByTestId('btn-connect-instagram')).toBeNull();
  });

  test('criterion 2b — resumable: a fully filled profile resumes at the Collab Pass step', async () => {
    (ensureProfile as jest.Mock).mockResolvedValue(FILLED);

    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('btn-finish')).toBeTruthy());
    expect(screen.queryByTestId('input-niche')).toBeNull();
  });
});
