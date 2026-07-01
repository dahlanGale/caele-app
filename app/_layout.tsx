import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/src/context/AuthContext';

// Tema claro 
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8FAFC', // fondo general
    card: '#FFFFFF',        // headers/drawer
    primary: '#0F172A',
    text: '#0F172A',
    border: '#E5E7EB',
  },
} as const;

// Tema oscuro 
const DarkThemeCustom = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0B0F19', // fondo general oscuro
    card: '#111827',        // headers/drawer
    primary: '#93C5FD',
    text: '#FFFFFF',
    border: '#1F2937',
  },
} as const;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const theme = colorScheme === 'dark' ? DarkThemeCustom : LightTheme;

  return (
    <AuthProvider>
      <ThemeProvider value={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(drawer)" />
          <Stack.Screen name="perfil" />
          <Stack.Screen name="administration" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </AuthProvider>
  );
}
