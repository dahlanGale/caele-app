import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function DashboardScreen() {
  const { color, space, font } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: color.bg, padding: space[4] }]}>
      <Text style={[styles.title, { color: color.text, fontSize: font.size.lg }]}>Inicio</Text>
      <Text style={{ color: color.textMuted }}>Resumenes de ventas y mesas (Próximamente).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 8,
  },
});
