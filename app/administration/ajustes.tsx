import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AjustesScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Ajustes' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>

        {/* Perfil */}
        <Section title="Perfil" colors={colors}>
          <Row label="Tu perfil" onPress={() => router.push('/administration/perfil')} />
          <Row label="Etiquetas guardadas" onPress={() => {}} />
          <Row label="Tarjetas guardadas" onPress={() => {}} />
          <Row label="Notificaciones y correos" onPress={() => {}} isLast />
        </Section>

        {/* Privacidad y seguridad */}
        <Section title="Privacidad y seguridad" colors={colors}>
          <Row label="Contraseña de la aplicación" onPress={() => {}} />
          <Row label="Verificación OTP" onPress={() => {}} isLast />
        </Section>

        {/* Soporte */}
        <Section title="Soporte" colors={colors}>
          <Row label="Contactar soporte" onPress={() => {}} />
          <Row label="Acerca de" onPress={() => {}} />
          <Row label="Legal" onPress={() => {}} isLast />
        </Section>
      </ScrollView>
    </>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

function Row({ label, onPress, isLast }: { label: string; onPress: () => void; isLast?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  group: {
    borderRadius: 12,
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
    fontSize: 16,
    fontWeight: '500',
  },
});
