import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui';
import { useAppTheme } from '@/src/theme/ThemeProvider';

const QUICK = [100, 200, 500, 1000];

type Props = {
  visible: boolean;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (monto: number, motivo: string) => void;
};

export default function ModalRetiroParcial({ visible, saving, onClose, onConfirm }: Props) {
  const { color, space, radius, font } = useAppTheme();
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMonto('');
      setMotivo('');
      setError(null);
    }
  }, [visible]);

  const submit = () => {
    setError(null);
    const montoNum = Number(monto);
    if (!monto || Number.isNaN(montoNum) || montoNum <= 0) return setError('Escribe un monto válido.');
    if (!motivo.trim()) return setError('Indica el motivo del retiro.');
    onConfirm(montoNum, motivo.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[styles.backdrop, { backgroundColor: color.overlay }]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: color.bgElevated, borderColor: color.border, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }]}>
          <View style={[styles.handle, { backgroundColor: color.textMuted }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingBottom: space[2] }}>
            <Text style={{ color: color.text, fontSize: font.size.md, fontWeight: font.weight.bold }}>Retiro parcial</Text>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={color.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: space[4], gap: space[3] }} keyboardShouldPersistTaps="handled">
            <View>
              <Text style={{ color: color.textMuted, fontSize: 13, fontWeight: '600', marginBottom: space[1] }}>Monto a retirar</Text>
              <View style={[styles.input, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md }]}>
                <MaterialCommunityIcons name="cash-minus" size={20} color={color.textMuted} />
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={color.textMuted}
                  keyboardType="decimal-pad"
                  value={monto}
                  onChangeText={setMonto}
                  style={{ flex: 1, color: color.text, marginLeft: space[2], fontSize: font.size.base }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: space[2], marginTop: space[2] }}>
                {QUICK.map((q) => (
                  <Pressable key={q} onPress={() => setMonto(String(q))} style={[styles.quick, { borderColor: color.border, borderRadius: radius.sm }]}>
                    <Text style={{ color: color.text, fontSize: font.size.sm }}>${q}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ color: color.textMuted, fontSize: 13, fontWeight: '600', marginBottom: space[1] }}>Motivo</Text>
              <View style={[styles.input, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md }]}>
                <MaterialCommunityIcons name="text-box-outline" size={20} color={color.textMuted} />
                <TextInput
                  placeholder="Ej. Pago a proveedor"
                  placeholderTextColor={color.textMuted}
                  value={motivo}
                  onChangeText={setMotivo}
                  style={{ flex: 1, color: color.text, marginLeft: space[2], fontSize: font.size.base }}
                />
              </View>
            </View>

            {error ? <Text style={{ color: color.danger, fontSize: font.size.sm }}>{error}</Text> : null}

            <Button title={saving ? 'Registrando…' : 'Registrar retiro'} variant="danger" onPress={submit} loading={saving} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderWidth: 1, maxHeight: '80%', paddingTop: 8 },
  handle: { width: 42, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 8 },
  input: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12 },
  quick: { flex: 1, alignItems: 'center', borderWidth: 1, paddingVertical: 8 },
});
