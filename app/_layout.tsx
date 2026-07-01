import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/context/AuthContext';
import { PymeProvider } from '@/src/context/PymeContext';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { navigationDarkTheme, navigationLightTheme } from '@/src/theme/navigationTheme';
import { ThemeProvider } from '@/src/theme/ThemeProvider';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const navigationTheme = colorScheme === 'dark' ? navigationDarkTheme : navigationLightTheme;

  return (
    <AuthProvider>
      <PymeProvider>
        <ThemeProvider>
          <NavigationThemeProvider value={navigationTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(drawer)" />
            <Stack.Screen name="perfil" />
            <Stack.Screen name="administration" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </NavigationThemeProvider>
      </ThemeProvider>
    </PymeProvider>
    </AuthProvider>
  );
}
