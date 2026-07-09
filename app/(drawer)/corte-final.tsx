import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui';
import { Input } from '@/src/components/ui/Input';
import { usePyme } from '@/src/context/PymeContext';
import { useCorteActivo } from '@/src/hooks/useCorteActivo';
import { useTerminal } from '@/src/hooks/useTerminal';
import { cerrarCorte } from '@/src/services/cortes';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Corte } from '@/src/types';

export default function CorteFinalScreen() {
  const { color, space, radius, font, shadow } = useAppTheme();
  const { pyme } = usePyme();
  const { terminal } = useTerminal();
  const { corte, loading } = useCorteActivo(terminal?.id);

  const money = (n: number) => `$${n.toFixed(2)}`;

  const [efectivoFinal, setEfectivoFinal] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const [comprobante, setComprobante] = useState<{
    corte: Corte;
    efectivoEsperado: number;
    efectivoFinal: number;
    diferencia: number;
  } | null>(null);

  const efectivoEsperado = useMemo(() => {
    if (!corte) return 0;
    return corte.efectivoInicial + corte.totales.efectivo - corte.totales.retiros;
  }, [corte]);

  const onCerrar = async () => {
    if (!pyme || !corte) return;
    const finalNum = Number(efectivoFinal);
    if (efectivoFinal === '' || Number.isNaN(finalNum) || finalNum < 0) {
      Alert.alert('Efectivo final', 'Ingresa el efectivo contado en caja.');
      return;
    }
    setCerrando(true);
    try {
      const snapshot = corte;
      const { efectivoEsperado: esperado, diferencia } = await cerrarCorte(pyme.id, corte, finalNum, observaciones);
      setComprobante({ corte: snapshot, efectivoEsperado: esperado, efectivoFinal: finalNum, diferencia });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cerrar el corte.');
    } finally {
      setCerrando(false);
    }
  };

  // --- Comprobante tras cerrar ---
  if (comprobante) {
    const dif = comprobante.diferencia;
    const difColor = dif === 0 ? color.success : dif > 0 ? color.accent : color.danger;
    const difLabel = dif === 0 ? 'Cuadrado' : dif > 0 ? 'Sobrante' : 'Faltante';
    return (
      <View style={[styles.root, { backgroundColor: color.bg }]}>
        <ScrollView contentContainerStyle={styles.center}>
          <View style={[styles.card, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.lg, padding: space[5], ...shadow.md }]}>
            <View style={{ alignItems: 'center', marginBottom: space[4] }}>
              <View style={[styles.iconWrap, { backgroundColor: color.accentSoft, borderRadius: radius.full }]}>
                <MaterialCommunityIcons name="check-decagram" size={32} color={color.success} />
              </View>
              <Text style={{ color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: space[3] }}>Corte cerrado</Text>
            </View>
            <View style={[styles.summary, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md, padding: space[4] }]}>
              <SumRow label="Fondo inicial" value={money(comprobante.corte.efectivoInicial)} color={color} />
              <SumRow label="Ventas en efectivo" value={money(comprobante.corte.totales.efectivo)} color={color} />
              <SumRow label="Retiros" value={`-${money(comprobante.corte.totales.retiros)}`} color={color} />
              <View style={{ height: 1, backgroundColor: color.border, marginVertical: space[2] }} />
              <SumRow label="Efectivo esperado" value={money(comprobante.efectivoEsperado)} color={color} bold />
              <SumRow label="Efectivo contado" value={money(comprobante.efectivoFinal)} color={color} bold />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space[2] }}>
                <Text style={{ color: difColor, fontWeight: font.weight.bold }}>{difLabel}</Text>
                <Text style={{ color: difColor, fontWeight: font.weight.black }}>{money(Math.abs(dif))}</Text>
              </View>
            </View>
            <View style={{ marginTop: space[4] }}>
              <Button title="Volver al inicio" onPress={() => router.replace('/(drawer)/dashboard')} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: color.textMuted }}>Cargando corte…</Text>
      </View>
    );
  }

  if (!corte) {
    return (
      <View style={[styles.root, { backgroundColor: color.bg }]}>
        <ScrollView contentContainerStyle={styles.center}>
          <View style={[styles.card, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.lg, padding: space[5], ...shadow.md, alignItems: 'center' }]}>
            <MaterialCommunityIcons name="cash-lock" size={40} color={color.textMuted} />
            <Text style={{ color: color.text, fontSize: font.size.md, fontWeight: font.weight.bold, marginTop: space[3] }}>No hay corte activo</Text>
            <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginTop: space[1], textAlign: 'center' }}>
              Abre un corte en “Estado de cajón” para poder cerrarlo.
            </Text>
            <View style={{ marginTop: space[4], width: '100%' }}>
              <Button title="Ir a Estado de cajón" variant="outline" onPress={() => router.replace('/(drawer)/estado-cajon')} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: color.bg }]}>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={[styles.card, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.lg, padding: space[5], ...shadow.md }]}>
          <View style={{ alignItems: 'center', marginBottom: space[4] }}>
            <View style={[styles.iconWrap, { backgroundColor: color.accentSoft, borderRadius: radius.full }]}>
              <MaterialCommunityIcons name="file-document-outline" size={30} color={color.accent} />
            </View>
            <Text style={{ color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: space[3] }}>Corte final</Text>
            <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginTop: space[1], textAlign: 'center' }}>
              Cuenta el efectivo en caja y ciérralo.
            </Text>
          </View>

          <View style={[styles.summary, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md, padding: space[4] }]}>
            <SumRow label="Fondo inicial" value={money(corte.efectivoInicial)} color={color} />
            <SumRow label="Ventas en efectivo" value={money(corte.totales.efectivo)} color={color} />
            <SumRow label="Retiros" value={`-${money(corte.totales.retiros)}`} color={color} />
            <View style={{ height: 1, backgroundColor: color.border, marginVertical: space[2] }} />
            <SumRow label="Efectivo esperado" value={money(efectivoEsperado)} color={color} bold />
          </View>

          <View style={{ gap: space[3], marginTop: space[4] }}>
            <View>
              <Text style={{ color: color.textMuted, fontSize: 13, fontWeight: '600', marginBottom: space[1] }}>Efectivo contado</Text>
              <Input
                icon={<MaterialCommunityIcons name="cash" size={20} color={color.textMuted} />}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={efectivoFinal}
                onChangeText={setEfectivoFinal}
              />
            </View>
            <View>
              <Text style={{ color: color.textMuted, fontSize: 13, fontWeight: '600', marginBottom: space[1] }}>Observaciones (opcional)</Text>
              <View style={[styles.obs, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md }]}>
                <TextInput
                  placeholder="Notas del cierre"
                  placeholderTextColor={color.textMuted}
                  value={observaciones}
                  onChangeText={setObservaciones}
                  multiline
                  style={{ color: color.text, fontSize: font.size.base, minHeight: 60, textAlignVertical: 'top' }}
                />
              </View>
            </View>
            <Button title={cerrando ? 'Cerrando…' : 'Cerrar corte'} variant="danger" onPress={onCerrar} loading={cerrando} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SumRow({ label, value, color, bold }: { label: string; value: string; color: any; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={{ color: color.textMuted }}>{label}</Text>
      <Text style={{ color: color.text, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 460, borderWidth: 1 },
  iconWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  summary: {},
  obs: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
});
