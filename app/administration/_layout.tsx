import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AdministrationLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="ajustes" />
      <Stack.Screen name="mesas-wizard" />
      <Stack.Screen name="mesas-editor" />
    </Stack>
  );
}
