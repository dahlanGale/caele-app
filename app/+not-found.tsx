import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function NotFoundScreen() {
  const { color, font } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: color.bg }]}>
        <Text style={[styles.title, { color: color.text, fontSize: font.size.xl, fontWeight: font.weight.bold }]}>
          Esta pantalla no existe.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={{ color: color.accent, fontSize: font.size.base, fontWeight: font.weight.semibold }}>
            Volver al inicio
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
