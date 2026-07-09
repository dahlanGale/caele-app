import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/ui';
import { usePyme } from '@/src/context/PymeContext';
import { useFirestoreCollection } from '@/src/hooks/useFirestore';
import { useRestaurante } from '@/src/hooks/useRestaurante';
import { ordenesCollection } from '@/src/services/firestore';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Orden } from '@/src/types';

/** Convierte un valor de Firestore (Timestamp | Date | string | number) a Date. */
function toDate(value: any): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  return new Date(value);
}

export default function DashboardScreen() {
  const { color, space, radius, font } = useAppTheme();
  const { pyme } = usePyme();
  const { items: ordenes, loading: loadingOrdenes } = useFirestoreCollection(ordenesCollection);
  const { estadisticas, loading: loadingRestaurante } = useRestaurante(pyme?.id);

  const today = useMemo(() => new Date().toDateString(), []);

  const stats = useMemo(() => {
    const ordenesPagadas = (ordenes as Orden[]).filter((o) => o.estado === 'pagada');
    const ventasHoy = ordenesPagadas
      .filter((o) => toDate(o.createdAt).toDateString() === today)
      .reduce((acc, o) => acc + o.total, 0);
    const abiertas = (ordenes as Orden[]).filter((o) => o.estado === 'abierta').length;
    const totalVentas = ordenesPagadas.reduce((acc, o) => acc + o.total, 0);
    const mesasOcupadas = estadisticas.ocupadas;
    return { ventasHoy, abiertas, totalVentas, mesasOcupadas, ordenesCount: ordenes.length };
  }, [ordenes, estadisticas, today]);

  const money = (n: number) => `$${n.toFixed(2)}`;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.bg }}>
      <View style={[styles.container, { padding: space[4] }]}>
        <Text style={[styles.title, { color: color.text, fontSize: font.size.xl, fontWeight: font.weight.bold }]}>
          {pyme?.nombreNegocio ?? 'Inicio'}
        </Text>
        <Text style={{ color: color.textMuted, marginBottom: space[4], fontSize: font.size.base }}>
          Resumen de hoy
        </Text>

        <View style={[styles.grid, { gap: space[3], marginBottom: space[4] }]}>
          <Card style={{ flex: 1, minWidth: 140, padding: space[4], borderRadius: radius.lg }}>
            <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginBottom: space[1] }}>Ventas hoy</Text>
            <Text style={{ color: color.success, fontSize: font.size.xl, fontWeight: font.weight.bold }}>
              {loadingOrdenes ? '...' : money(stats.ventasHoy)}
            </Text>
          </Card>
          <Card style={{ flex: 1, minWidth: 140, padding: space[4], borderRadius: radius.lg }}>
            <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginBottom: space[1] }}>Ordenes abiertas</Text>
            <Text style={{ color: color.warning, fontSize: font.size.xl, fontWeight: font.weight.bold }}>
              {loadingOrdenes ? '...' : stats.abiertas}
            </Text>
          </Card>
          <Card style={{ flex: 1, minWidth: 140, padding: space[4], borderRadius: radius.lg }}>
            <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginBottom: space[1] }}>Mesas ocupadas</Text>
            <Text style={{ color: color.accent, fontSize: font.size.xl, fontWeight: font.weight.bold }}>
              {loadingRestaurante ? '...' : stats.mesasOcupadas}
            </Text>
          </Card>
          <Card style={{ flex: 1, minWidth: 140, padding: space[4], borderRadius: radius.lg }}>
            <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginBottom: space[1] }}>Ventas totales</Text>
            <Text style={{ color: color.text, fontSize: font.size.xl, fontWeight: font.weight.bold }}>
              {loadingOrdenes ? '...' : money(stats.totalVentas)}
            </Text>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: color.text, fontSize: font.size.lg, fontWeight: font.weight.semibold, marginBottom: space[3] }]}>
          Órdenes recientes
        </Text>

        {(ordenes as Orden[]).length === 0 ? (
          <Card style={{ padding: space[4], borderRadius: radius.lg }}>
            <Text style={{ color: color.textMuted, textAlign: 'center' }}>No hay órdenes registradas aún.</Text>
          </Card>
        ) : (
          (ordenes as Orden[]).slice(0, 5).map((orden) => (
            <Card key={orden.id} style={{ padding: space[3], borderRadius: radius.md, marginBottom: space[2] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: color.text, fontWeight: font.weight.semibold }}>
                    Orden {orden.id.slice(0, 6)}
                  </Text>
                  <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>
                    {orden.items.length} productos · {orden.estado === 'pagada' ? 'Pagada' : 'Abierta'}
                  </Text>
                </View>
                <Text style={{ color: color.text, fontWeight: font.weight.bold, fontSize: font.size.lg }}>
                  {money(orden.total)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    marginTop: 8,
  },
});
