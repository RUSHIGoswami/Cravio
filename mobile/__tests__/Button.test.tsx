import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { Button } from '../src/components/buttons/Button';

function renderWithTheme(node: React.ReactElement) {
  return render(<ThemeProvider scheme="light">{node}</ThemeProvider>);
}

test('renders the shared design-system Button using synced tokens', async () => {
  await renderWithTheme(<Button>Apply to campaign</Button>);
  expect(screen.getByText('Apply to campaign')).toBeTruthy();
});

test('fires onPress when not disabled or loading', async () => {
  const onPress = jest.fn();
  await renderWithTheme(<Button onPress={onPress}>Continue</Button>);
  await fireEvent.press(screen.getByText('Continue'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('does not fire onPress when disabled', async () => {
  const onPress = jest.fn();
  await renderWithTheme(
    <Button onPress={onPress} disabled>
      Continue
    </Button>,
  );
  await fireEvent.press(screen.getByText('Continue'));
  expect(onPress).not.toHaveBeenCalled();
});
