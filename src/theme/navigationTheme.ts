import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { themes } from './tokens';

export const navigationLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: themes.light.bg,
    card: themes.light.bgElevated,
    text: themes.light.text,
    border: themes.light.border,
    primary: themes.light.accent,
    notification: themes.light.accent,
  },
};

export const navigationDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: themes.dark.bg,
    card: themes.dark.bgElevated,
    text: themes.dark.text,
    border: themes.dark.border,
    primary: themes.dark.accent,
    notification: themes.dark.accent,
  },
};
