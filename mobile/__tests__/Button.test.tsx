import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { Button } from '../src/components/buttons/Button';

function renderWithTheme(node: React.ReactElement) {
  return render(<ThemeProvider scheme="light">{node}</ThemeProvider>);
}

test('renders the shared design-system Button using synced tokens', () => {
  renderWithTheme(<Button>Apply to campaign</Button>);
  expect(screen.getByText('Apply to campaign')).toBeTruthy();
});

test('fires onPress when not disabled or loading', () => {
  const onPress = jest.fn();
  renderWithTheme(<Button onPress={onPress}>Continue</Button>);
  fireEvent.press(screen.getByText('Continue'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('does not fire onPress when disabled', () => {
  const onPress = jest.fn();
  renderWithTheme(
    <Button onPress={onPress} disabled>
      Continue
    </Button>,
  );
  fireEvent.press(screen.getByText('Continue'));
  expect(onPress).not.toHaveBeenCalled();
});
