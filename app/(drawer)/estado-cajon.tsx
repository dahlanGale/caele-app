import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui';
import { Input } from '@/src/components/ui/Input';
import { useAuth } from '@/src/context/AuthContext';
import { usePyme } from '@/src/context/PymeContext';
import { useCorteActivo } from '@/src/hooks/useCorteActivo';
import { useTerminal } from '@/src/hooks/useTerminal';
import { abrirCorte } from '@/src/services/cortes';
import { useAppTheme } from '@/src/theme/ThemeProvider';

// PIN de supervisor para ver el detalle del cajón. Para la demo es una constante;
// fuera de la demo debe moverse a la configuración de la pyme / rol.
const SUPERVISOR_PIN = '1234';

export default function EstadoCajonScreen() {
  const { color, space, radius, font, shadow } = useAppTheme();
  const { pyme } = usePyme();
  const { user } = useAuth();
  const { terminal } = useTerminal();
  const { corte, loading } = useCorteActivo(terminal?.id);

  const money = (n: number) => `$${n.toFixed(2)}`;

  // --- Abrir corte ---
  const [fondo, setFondo] = useState('');
  const [abriendo, setAbriendo] = useState(false);

  const onAbrirCorte = async () => {
    if (!pyme || !terminal || !user) return;
    const fondoNum = Number(fondo) || 0;
    if (fondoNum < 0) return;
    setAbriendo(true);
    try {
      await abrirCorte(pyme.id, {
        terminalId: terminal.id,
        usuarioId: user.uid,
        usuarioNombre: user.displayName ?? user.email ?? undefined,
        efectivoInicial: fondoNum,
      });
      setFondo('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo abrir el corte.');
    } finally {
      setAbriendo(false);
    }
  };

  // --- Detalle con PIN ---
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const tryUnlock = () => {
    if (pin === SUPERVISOR_PIN) {
      setUnlocked(true);
      setPin('');
      setPinError(null);
    } else {
      setPinError('PIN incorrecto.');
    }
  };

  const efectivoEsperado = useMemo(() => {
    if (!corte) return 0;
    return corte.efectivoInicial + corte.totales.efectivo - corte.totales.retiros;
  }, [corte]);

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: color.textMuted }}>Cargando caja…</Text>
      </View>
    );
  }

  // --- Sin corte: formulario de apertura ---
  if (!corte) {
    return (
      <View style={[styles.root, { backgroundColor: color.bg }]}>
        <ScrollView contentContainerStyle={styles.center}>
          <View style={[styles.card, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.lg, padding: space[5], ...shadow.md }]}>
            <View style={{ alignItems: 'center', marginBottom: space[4] }}>
              <View style={[styles.iconWrap, { backgroundColor: color.accentSoft, borderRadius: radius.full }]}>
                <MaterialCommunityIcons name="cash-register" size={30} color={color.accent} />
              </View>
              <Text style={{ color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: space[3] }}>Abrir corte de caja</Text>
              <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginTop: space[1], textAlign: 'center' }}>
                Ingresa el fondo de caja inicial (efectivo con el que abres el turno).
              </Text>
            </View>
            <View style={{ gap: space[3] }}>
              <Input
                icon={<MaterialCommunityIcons name="cash" size={20} color={color.textMuted} />}
                placeholder="Fondo de caja (ej. 500)"
                keyboardType="decimal-pad"
                value={fondo}
                onChangeText={setFondo}
              />
              <Button title={abriendo ? 'Abriendo…' : 'Abrir corte'} onPress={onAbrirCorte} loading={abriendo} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- Con corte: estado del cajón ---
  return (
    <View style={[styles.root, { backgroundColor: color.bg }]}>
      <ScrollView contentContainerStyle={{ padding: space[4], gap: space[3], maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          <MaterialCommunityIcons name="cash-register" size={24} color={color.success} />
          <Text style={{ color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold }}>Estado de cajón</Text>
        </View>

        {/* Quick stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
          <StatCard label="Efectivo esperado" value={money(efectivoEsperado)} icon="cash" tint={color.success} />
          <StatCard label="Total ventas" value={money(corte.totales.ventas)} icon="chart-line" tint={color.accent} />
          <StatCard label="Retiros" value={money(corte.totales.retiros)} icon="cash-minus" tint={color.danger} />
          <StatCard label="Fondo inicial" value={money(corte.efectivoInicial)} icon="wallet-outline" tint={color.textMuted} />
        </View>

        {/* Detalle con PIN */}
        <View style={[styles.panel, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.lg, padding: space[4] }]}>
          {!unlocked ? (
            <View style={{ gap: space[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={color.textMuted} />
                <Text style={{ color: color.text, fontWeight: font.weight.semibold }}>Detalle protegido (supervisor)</Text>
              </View>
              <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>Ingresa el PIN para ver el desglose por método de pago y retiros.</Text>
              <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.pinInput, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md }]}>
                    <TextInput
                      placeholder="PIN"
                      placeholderTextColor={color.textMuted}
                      value={pin}
                      onChangeText={setPin}
                      secureTextEntry
                      keyboardType="number-pad"
                      style={{ color: color.text, fontSize: font.size.base, paddingVertical: 12 }}
                    />
                  </View>
                </View>
                <Pressable onPress={tryUnlock} style={[styles.unlockBtn, { backgroundColor: color.accent, borderRadius: radius.md }]}>
                  <Text style={{ color: color.textInverse, fontWeight: font.weight.bold }}>Ver</Text>
                </Pressable>
              </View>
              {pinError ? <Text style={{ color: color.danger, fontSize: font.size.sm }}>{pinError}</Text> : null}
            </View>
          ) : (
            <View style={{ gap: space[1] }}>
              <Text style={{ color: color.text, fontWeight: font.weight.bold, marginBottom: space[2] }}>Desglose de ventas</Text>
              <DetailRow label="Efectivo" value={money(corte.totales.efectivo)} color={color} />
              <DetailRow label="Tarjeta" value={money(corte.totales.tarjeta)} color={color} />
              <DetailRow label="Transferencia" value={money(corte.totales.transferencia)} color={color} />
              <DetailRow label="Pendiente" value={money(corte.totales.pendiente)} color={color} />
              <View style={{ height: 1, backgroundColor: color.border, marginVertical: space[2] }} />
              <Text style={{ color: color.text, fontWeight: font.weight.bold, marginBottom: space[2] }}>Retiros ({corte.retiros.length})</Text>
              {corte.retiros.length === 0 ? (
                <Text style={{ color: color.textMuted }}>Sin retiros</Text>
              ) : (
                corte.retiros.map((r) => (
                  <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                    <Text style={{ color: color.textMuted, flex: 1 }} numberOfLines={1}>{r.motivo}</Text>
                    <Text style={{ color: color.danger, fontWeight: font.weight.semibold }}>-{money(r.monto)}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <Button
          title="Ir a corte final"
          variant="outline"
          icon={<MaterialCommunityIcons name="file-document-outline" size={18} color={color.text} />}
          onPress={() => router.push('/(drawer)/corte-final')}
        />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, tint }: { label: string; value: string; icon: any; tint: string }) {
  const { color, space, radius, font } = useAppTheme();
  return (
    <View style={[styles.stat, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.md, padding: space[3] }]}>
      <MaterialCommunityIcons name={icon} size={20} color={tint} />
      <Text style={{ color: color.textMuted, fontSize: font.size.xs, marginTop: space[1] }}>{label}</Text>
      <Text style={{ color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold }}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={{ color: color.textMuted }}>{label}</Text>
      <Text style={{ color: color.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 460, borderWidth: 1 },
  iconWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  panel: { borderWidth: 1 },
  stat: { flexGrow: 1, flexBasis: 150, borderWidth: 1 },
  pinInput: { borderWidth: 1, paddingHorizontal: 12 },
  unlockBtn: { paddingHorizontal: 20, paddingVertical: 12 },
});
