import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { MetodoPago, PaymentData } from '@/src/types';

const METODOS: { value: MetodoPago; label: string; icon: any }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: 'cash' },
  { value: 'tarjeta', label: 'Tarjeta', icon: 'credit-card-outline' },
  { value: 'transferencia', label: 'Transferencia', icon: 'bank-transfer' },
  { value: 'pendiente', label: 'Pendiente', icon: 'clock-outline' },
];

const QUICK = [50, 100, 200, 500];

type Props = {
  visible: boolean;
  total: number;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (data: PaymentData) => void;
};

export default function ModalPago({ visible, total, saving, onClose, onConfirm }: Props) {
  const { color, space, radius, font } = useAppTheme();
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [recibido, setRecibido] = useState('');

  useEffect(() => {
    if (visible) {
      setMetodo('efectivo');
      setRecibido('');
    }
  }, [visible]);

  const money = (n: number) => `$${n.toFixed(2)}`;
  const recibidoNum = Number(recibido) || 0;
  const cambio = useMemo(() => Math.max(0, recibidoNum - total), [recibidoNum, total]);
  const faltante = useMemo(() => Math.max(0, total - recibidoNum), [recibidoNum, total]);

  const efectivoInsuficiente = metodo === 'efectivo' && recibidoNum > 0 && recibidoNum < total;

  const confirm = () => {
    if (metodo === 'efectivo') {
      const monto = recibidoNum || total;
      onConfirm({ metodoPago: 'efectivo', montoRecibido: monto, cambio: Math.max(0, monto - total) });
    } else {
      onConfirm({ metodoPago: metodo, montoRecibido: total, cambio: 0 });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[styles.backdrop, { backgroundColor: color.overlay }]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: color.bgElevated, borderColor: color.border, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }]}>
          <View style={[styles.handle, { backgroundColor: color.textMuted }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingBottom: space[2] }}>
            <Text style={{ color: color.text, fontSize: font.size.md, fontWeight: font.weight.bold }}>Cobrar</Text>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={color.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: space[4], gap: space[3] }} keyboardShouldPersistTaps="handled">
            <View style={[styles.totalBox, { backgroundColor: color.accentSoft, borderRadius: radius.md, padding: space[4] }]}>
              <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>Total a cobrar</Text>
              <Text style={{ color: color.accent, fontSize: font.size.xxl, fontWeight: font.weight.black }}>{money(total)}</Text>
            </View>

            <View>
              <Text style={{ color: color.textMuted, fontSize: 13, fontWeight: '600', marginBottom: space[2] }}>Método de pago</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
                {METODOS.map((m) => {
                  const active = metodo === m.value;
                  return (
                    <Pressable
                      key={m.value}
                      onPress={() => setMetodo(m.value)}
                      style={[styles.metodo, { backgroundColor: active ? color.accentSoft : color.bgSubtle, borderColor: active ? color.accent : color.border, borderRadius: radius.md }]}
                    >
                      <MaterialCommunityIcons name={m.icon} size={20} color={active ? color.accent : color.textMuted} />
                      <Text style={{ color: active ? color.accent : color.text, fontWeight: font.weight.semibold, marginLeft: space[2] }}>{m.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {metodo === 'efectivo' && (
              <View style={{ gap: space[2] }}>
                <Text style={{ color: color.textMuted, fontSize: 13, fontWeight: '600' }}>Monto recibido</Text>
                <View style={[styles.input, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md }]}>
                  <MaterialCommunityIcons name="cash" size={20} color={color.textMuted} />
                  <TextInput
                    placeholder={money(total)}
                    placeholderTextColor={color.textMuted}
                    keyboardType="decimal-pad"
                    value={recibido}
                    onChangeText={setRecibido}
                    style={{ flex: 1, color: color.text, marginLeft: space[2], fontSize: font.size.base }}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: space[2] }}>
                  <Pressable onPress={() => setRecibido(String(total))} style={[styles.quick, { borderColor: color.border, borderRadius: radius.sm }]}>
                    <Text style={{ color: color.text, fontSize: font.size.sm }}>Exacto</Text>
                  </Pressable>
                  {QUICK.map((q) => (
                    <Pressable key={q} onPress={() => setRecibido(String(q))} style={[styles.quick, { borderColor: color.border, borderRadius: radius.sm }]}>
                      <Text style={{ color: color.text, fontSize: font.size.sm }}>${q}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space[1] }}>
                  <Text style={{ color: color.textMuted }}>{faltante > 0 ? 'Faltante' : 'Cambio'}</Text>
                  <Text style={{ color: faltante > 0 ? color.danger : color.success, fontWeight: font.weight.bold }}>
                    {money(faltante > 0 ? faltante : cambio)}
                  </Text>
                </View>
              </View>
            )}

            <Button
              title={saving ? 'Procesando…' : metodo === 'pendiente' ? 'Guardar como pendiente' : 'Confirmar pago'}
              onPress={confirm}
              loading={saving}
              disabled={total <= 0 || efectivoInsuficiente}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderWidth: 1, maxHeight: '88%', paddingTop: 8 },
  handle: { width: 42, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 8 },
  totalBox: { alignItems: 'center' },
  metodo: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  input: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12 },
  quick: { flex: 1, alignItems: 'center', borderWidth: 1, paddingVertical: 8 },
});
