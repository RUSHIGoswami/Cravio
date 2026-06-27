/**
 * RolePickerScreen — criterion 2: Influencer → /auth/role + Onboarding nav;
 * Brand → /auth/role + Main nav.
 */
jest.mock('react-native-safe-area-context', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SafeAreaProvider: ({ children }: { children: any }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async () => {}),
  getItemAsync: jest.fn(async () => 'stored-jwt'),
  deleteItemAsync: jest.fn(async () => {}),
}));

jest.mock('../src/services/authService', () => ({
  setRole: jest.fn(),
  getStoredToken: jest.fn(async () => 'stored-jwt'),
}));

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { RolePickerScreen } from '../src/screens/RolePickerScreen';
import { setRole } from '../src/services/authService';

const mockNavigation = { replace: jest.fn(), navigate: jest.fn() };

async function renderScreen() {
  await render(
    <SafeAreaProvider>
      <ThemeProvider scheme="light">
        <RolePickerScreen navigation={mockNavigation as never} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('RolePickerScreen (criterion 2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Influencer → calls setRole("influencer") → navigates to Onboarding', async () => {
    (setRole as jest.Mock).mockResolvedValueOnce({ role: 'influencer', role_set: true });

    await renderScreen();
    fireEvent.press(screen.getByTestId('btn-role-influencer'));

    await waitFor(() => {
      expect(setRole).toHaveBeenCalledWith('influencer', 'stored-jwt');
      expect(mockNavigation.replace).toHaveBeenCalledWith('Onboarding');
    });
  });

  test('Brand → calls setRole("brand") → navigates to BrandOnboarding', async () => {
    (setRole as jest.Mock).mockResolvedValueOnce({ role: 'brand', role_set: true });

    await renderScreen();
    fireEvent.press(screen.getByTestId('btn-role-brand'));

    await waitFor(() => {
      expect(setRole).toHaveBeenCalledWith('brand', 'stored-jwt');
      expect(mockNavigation.replace).toHaveBeenCalledWith('BrandOnboarding');
    });
  });
});
