/**
 * SignInScreen — criterion 1: Google/Apple/OTP flows navigate to RolePicker
 * when role_set is false; navigate to Main when role_set is true.
 */
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async () => {}),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => {}),
}));

jest.mock('../src/services/authService', () => ({
  login: jest.fn(),
}));

jest.mock('../src/services/authProvider', () => ({
  signInWithGoogle: jest.fn(async () => 'stub-google-xyz'),
  signInWithApple: jest.fn(async () => 'stub-apple-xyz'),
  signInWithOTP: jest.fn(async (_phone: string) => 'stub-otp-xyz'),
}));

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { SignInScreen } from '../src/screens/SignInScreen';
import { login } from '../src/services/authService';

const mockNavigation = { replace: jest.fn(), navigate: jest.fn() };

async function renderScreen() {
  await render(
    <SafeAreaProvider>
      <ThemeProvider scheme="light">
        <SignInScreen navigation={mockNavigation as never} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('SignInScreen (criterion 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Google sign-in → login called → RolePicker when role_set false', async () => {
    (login as jest.Mock).mockResolvedValueOnce({
      access_token: 'jwt-g',
      token_type: 'bearer',
      role: null,
      role_set: false,
    });

    await renderScreen();
    fireEvent.press(screen.getByTestId('btn-google'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('stub-google-xyz');
      expect(mockNavigation.replace).toHaveBeenCalledWith('RolePicker');
    });
  });

  test('Apple sign-in → login called → RolePicker when role_set false', async () => {
    (login as jest.Mock).mockResolvedValueOnce({
      access_token: 'jwt-a',
      token_type: 'bearer',
      role: null,
      role_set: false,
    });

    await renderScreen();
    fireEvent.press(screen.getByTestId('btn-apple'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('stub-apple-xyz');
      expect(mockNavigation.replace).toHaveBeenCalledWith('RolePicker');
    });
  });

  test('OTP sign-in → login called → RolePicker when role_set false', async () => {
    (login as jest.Mock).mockResolvedValueOnce({
      access_token: 'jwt-otp',
      token_type: 'bearer',
      role: null,
      role_set: false,
    });

    await renderScreen();
    fireEvent.press(screen.getByTestId('btn-otp'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('stub-otp-xyz');
      expect(mockNavigation.replace).toHaveBeenCalledWith('RolePicker');
    });
  });

  test('returning user (role_set true) → skip RolePicker → Main', async () => {
    (login as jest.Mock).mockResolvedValueOnce({
      access_token: 'jwt-returning',
      token_type: 'bearer',
      role: 'influencer',
      role_set: true,
    });

    await renderScreen();
    fireEvent.press(screen.getByTestId('btn-google'));

    await waitFor(() => {
      expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
    });
  });
});
