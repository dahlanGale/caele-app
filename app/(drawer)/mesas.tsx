import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ZonaGrid } from '@/src/components/mesas';
import { Button } from '@/src/components/ui';
import { useAuth } from '@/src/context/AuthContext';
import { usePyme } from '@/src/context/PymeContext';
import { useRestaurante } from '@/src/hooks/useRestaurante';
import { ocuparMesa } from '@/src/services/ordenes';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Elemento } from '@/src/types';

export default function MesasScreen() {
  const { color, space, font } = useAppTheme();
  const { pyme } = usePyme();
  const { user } = useAuth();
  const { zonas, estadisticas, loading } = useRestaurante(pyme?.id);
  const isAdmin = pyme?.isAdmin || true; // Simplificación: en POS pequeño todos pueden editar; ajustar según rol de usuario.

  const handleElementoPress = useCallback(
    async (elemento: Elemento, zonaId: string) => {
      if (!pyme) return;
      if (elemento.estado === 'disponible') {
        await ocuparMesa(pyme.id, zonaId, elemento.id, 'ocupada');
      }
      router.push({ pathname: '/orden', params: { mesaId: elemento.id, zonaId } });
    },
    [pyme]
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: color.bg }]}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  if (zonas.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: color.bg, padding: space[6] }]}>
        <Stack.Screen options={{ title: 'Mesas' }} />
        <Ionicons name="restaurant-outline" size={56} color={color.textMuted} />
        <Text style={[styles.emptyTitle, { color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: space[4] }]}>
          Sin distribución de mesas
        </Text>
        <Text style={[styles.emptyText, { color: color.textMuted, fontSize: font.size.base, textAlign: 'center', marginVertical: space[3] }]}>
          Configura tu restaurante para comenzar a tomar órdenes.
        </Text>
        <Button title="Configurar mesas" onPress={() => router.push('/administration/mesas-wizard')} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Mesas',
          headerRight: () =>
            isAdmin ? (
              <Pressable
                onPress={() => router.push('/administration/mesas-editor')}
                style={styles.headerBtn}
              >
                <Ionicons name="create-outline" size={22} color={color.text} />
              </Pressable>
            ) : null,
        }}
      />
      <View style={[styles.screen, { backgroundColor: color.bg }]}>
        <View style={[styles.stats, { backgroundColor: color.bgElevated, padding: space[4], gap: space[4] }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold }]}>
              {estadisticas.disponibles}
            </Text>
            <Text style={[styles.statLabel, { color: color.textMuted, fontSize: font.size.xs }]}>Libres</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: color.danger, fontSize: font.size.lg, fontWeight: font.weight.bold }]}>
              {estadisticas.ocupadas}
            </Text>
            <Text style={[styles.statLabel, { color: color.textMuted, fontSize: font.size.xs }]}>Ocupadas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: color.accent, fontSize: font.size.lg, fontWeight: font.weight.bold }]}>
              {estadisticas.cuentas}
            </Text>
            <Text style={[styles.statLabel, { color: color.textMuted, fontSize: font.size.xs }]}>Cuentas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold }]}>
              {estadisticas.total}
            </Text>
            <Text style={[styles.statLabel, { color: color.textMuted, fontSize: font.size.xs }]}>Total</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space[4] }}>
          {zonas.map((zona) => (
            <ZonaGrid
              key={zona.id}
              zona={zona}
              onElementoPress={(el) => handleElementoPress(el, zona.id)}
            />
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    marginBottom: 2,
  },
  statLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerBtn: {
    padding: 8,
    marginRight: 8,
  },
});
