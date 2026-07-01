import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function AjustesScreen() {
  const { color, space, radius, font } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Ajustes' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: color.bg }}
        contentContainerStyle={styles.content}
      >
        <Section title="Perfil">
          <Row label="Tu perfil" onPress={() => router.push('/administration/perfil')} />
          <Row label="Etiquetas guardadas" onPress={() => {}} />
          <Row label="Tarjetas guardadas" onPress={() => {}} />
          <Row label="Notificaciones y correos" onPress={() => {}} isLast />
        </Section>

        <Section title="Privacidad y seguridad">
          <Row label="Contraseña de la aplicación" onPress={() => {}} />
          <Row label="Verificación OTP" onPress={() => {}} isLast />
        </Section>

        <Section title="Soporte">
          <Row label="Contactar soporte" onPress={() => {}} />
          <Row label="Acerca de" onPress={() => {}} />
          <Row label="Legal" onPress={() => {}} isLast />
        </Section>
      </ScrollView>
    </>
  );

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <View style={[styles.section, { marginTop: space[3] }]}>
        <Text style={[styles.sectionTitle, { color: color.textMuted, fontSize: font.size.xs, marginBottom: space[2] }]}>
          {title}
        </Text>
        <View
          style={[
            styles.group,
            { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.md },
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  function Row({ label, onPress, isLast }: { label: string; onPress: () => void; isLast?: boolean }) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: color.overlay }}
        style={({ pressed }) => [
          styles.row,
          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.border },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Text style={[styles.rowLabel, { color: color.text, fontSize: font.size.base }]}>{label}</Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={color.text} />
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {},
  sectionTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  group: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontWeight: '500',
  },
});
