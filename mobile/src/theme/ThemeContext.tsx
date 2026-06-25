import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type Theme } from './index';

const ThemeContext = createContext<Theme>(themes.light);

export function ThemeProvider({
  children,
  scheme,
}: {
  children: React.ReactNode;
  /** Force a scheme; omit to follow the OS setting. */
  scheme?: 'light' | 'dark';
}) {
  const osScheme = useColorScheme();
  const theme = useMemo(() => themes[scheme ?? osScheme ?? 'light'], [scheme, osScheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
