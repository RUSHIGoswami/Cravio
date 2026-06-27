/**
 * BrandOnboardingScreen — A5 brand profile setup (mobile).
 * Acceptance criteria asserted here, then implemented to green:
 *  1. Brand profile validates and persists; GST optional. On save the brand
 *     lands ready to create a campaign (onComplete fires).
 *  2. Required fields are validated inline; an incomplete form does not submit.
 *  3. Resumable: an existing profile pre-fills the form.
 */
jest.mock('react-native-safe-area-context', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SafeAreaProvider: ({ children }: { children: any }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../src/services/brandService', () => ({
  getBrandProfile: jest.fn(),
  saveBrandProfile: jest.fn(),
}));

jest.mock('../src/services/authService', () => ({
  getStoredToken: jest.fn(async () => 'stored-jwt'),
}));

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { BrandOnboardingScreen } from '../src/screens/BrandOnboardingScreen';
import { getBrandProfile, saveBrandProfile } from '../src/services/brandService';

const SAVED = {
  user_id: 'u1',
  company_name: 'Acme',
  industry: 'Tech',
  website: 'https://acme.example.in',
  gst: null,
};

// Mirrors onboarding-flow.test: settle the async mount effect inside act().
async function renderScreen(onComplete = jest.fn()) {
  await act(async () => {
    render(
      <SafeAreaProvider>
        <ThemeProvider scheme="light">
          <BrandOnboardingScreen onComplete={onComplete} />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
  });
  return { onComplete };
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}
async function type(testID: string, value: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), value);
  });
}

describe('BrandOnboardingScreen (A5)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('criterion 1 — saving a valid profile (no GST) persists and fires onComplete', async () => {
    (getBrandProfile as jest.Mock).mockResolvedValue(null);
    (saveBrandProfile as jest.Mock).mockResolvedValue(SAVED);

    const { onComplete } = await renderScreen();

    await waitFor(() => expect(screen.getByTestId('input-company')).toBeTruthy());
    await type('input-company', 'Acme');
    await type('input-industry', 'Tech');
    await type('input-website', 'https://acme.example.in');
    await press('btn-save');

    await waitFor(() => {
      expect(saveBrandProfile).toHaveBeenCalledWith('stored-jwt', expect.objectContaining({
        company_name: 'Acme',
        industry: 'Tech',
        website: 'https://acme.example.in',
        gst: null,
      }));
      expect(onComplete).toHaveBeenCalled();
    });
  });

  test('criterion 2 — incomplete form surfaces an inline error and does not submit', async () => {
    (getBrandProfile as jest.Mock).mockResolvedValue(null);

    const { onComplete } = await renderScreen();

    await waitFor(() => expect(screen.getByTestId('input-company')).toBeTruthy());
    // press save with everything empty
    await press('btn-save');

    await waitFor(() => expect(screen.getByTestId('error-form')).toBeTruthy());
    expect(saveBrandProfile).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('criterion 3 — an existing profile pre-fills the form', async () => {
    (getBrandProfile as jest.Mock).mockResolvedValue(SAVED);

    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('input-company').props.value).toBe('Acme'));
    expect(screen.getByTestId('input-website').props.value).toBe('https://acme.example.in');
  });
});
