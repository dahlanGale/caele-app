import { createContext, useContext, useMemo } from 'react';

import { useColorScheme } from '@/src/hooks/useColorScheme';

import { font, radius, shadow, space, themes, type AppTheme } from './tokens';

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = useMemo<AppTheme>(() => {
    const isDark = colorScheme === 'dark';
    return {
      dark: isDark,
      color: isDark ? themes.dark : themes.light,
      space,
      radius,
      font,
      shadow,
    };
  }, [colorScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return value;
}
