import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/ui';
import { Input } from '@/src/components/ui/Input';
import { useAuth } from '@/src/context/AuthContext';
import { usePyme } from '@/src/context/PymeContext';
import { abrirSesion, registrarTerminal } from '@/src/services/terminales';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { getDeviceInfo } from '@/src/utils/deviceInfo';
import type { DeviceInfo, TipoMaquina } from '@/src/types';

const TIPOS: { value: TipoMaquina; label: string; icon: any }[] = [
  { value: 'punto_de_venta', label: 'Punto de venta', icon: 'point-of-sale' },
  { value: 'administrativo', label: 'Administrativo', icon: 'monitor-dashboard' },
];

export default function RegistroEquipoScreen() {
  const { color, space, radius, font, shadow } = useAppTheme();
  const { pyme } = usePyme();
  const { user } = useAuth();

  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [tipoMaquina, setTipoMaquina] = useState<TipoMaquina>('punto_de_venta');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeviceInfo()
      .then((info) => {
        setDevice(info);
        setNombreEquipo((prev) => prev || info.modelo || 'Terminal');
      })
      .catch(() => setDevice(null));
  }, []);

  const onRegistrar = async () => {
    setError(null);
    if (!pyme) {
      setError('No se encontró la pyme activa.');
      return;
    }
    if (!device) {
      setError('Aún no se detecta el dispositivo. Espera un momento.');
      return;
    }
    if (!nombreEquipo.trim()) {
      setError('Escribe un nombre para el equipo.');
      return;
    }
    setSaving(true);
    try {
      const terminal = await registrarTerminal(pyme.id, {
        nombreEquipo: nombreEquipo.trim(),
        tipoMaquina,
        device,
        usuarioRegistro: { uid: user?.uid ?? '', email: user?.email ?? undefined },
      });
      await abrirSesion(pyme.id, terminal.id, user?.displayName ?? user?.email ?? undefined);
      router.replace('/(drawer)/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo registrar la terminal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: color.bg }]}>
      <ScrollView contentContainerStyle={styles.center}>
        <View
          style={[
            styles.card,
            { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.lg, padding: space[5], ...shadow.md },
          ]}
        >
          <View style={{ alignItems: 'center', marginBottom: space[4] }}>
            <View style={[styles.iconWrap, { backgroundColor: color.accentSoft, borderRadius: radius.full }]}>
              <MaterialCommunityIcons name="cash-register" size={32} color={color.accent} />
            </View>
            <Text style={[styles.title, { color: color.text, fontSize: font.size.xl, marginTop: space[3] }]}>
              Registrar terminal
            </Text>
            <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginTop: space[1], textAlign: 'center' }}>
              Configura este equipo como punto de venta para empezar a operar.
            </Text>
          </View>

          <View style={{ gap: space[3] }}>
            <View>
              <Text style={[styles.label, { color: color.textMuted, marginBottom: space[1] }]}>Nombre del equipo</Text>
              <Input
                icon={<MaterialCommunityIcons name="tag-outline" size={20} color={color.textMuted} />}
                placeholder="Ej. Caja 1"
                value={nombreEquipo}
                onChangeText={setNombreEquipo}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: color.textMuted, marginBottom: space[1] }]}>Tipo de máquina</Text>
              <View style={{ flexDirection: 'row', gap: space[2] }}>
                {TIPOS.map((t) => {
                  const active = tipoMaquina === t.value;
                  return (
                    <Pressable
                      key={t.value}
                      onPress={() => setTipoMaquina(t.value)}
                      style={[
                        styles.tipoBtn,
                        {
                          backgroundColor: active ? color.accentSoft : color.bgSubtle,
                          borderColor: active ? color.accent : color.border,
                          borderRadius: radius.md,
                          padding: space[3],
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name={t.icon} size={22} color={active ? color.accent : color.textMuted} />
                      <Text style={{ color: active ? color.accent : color.text, fontWeight: font.weight.semibold, marginTop: space[1], fontSize: font.size.sm }}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.deviceBox, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md, padding: space[3] }]}>
              <Text style={[styles.label, { color: color.textMuted, marginBottom: space[2] }]}>Dispositivo detectado</Text>
              {device ? (
                <>
                  <DeviceRow label="ID" value={device.machineId} color={color} />
                  {device.modelo ? <DeviceRow label="Modelo" value={device.modelo} color={color} /> : null}
                  {device.marca ? <DeviceRow label="Marca" value={device.marca} color={color} /> : null}
                  {device.so ? <DeviceRow label="Sistema" value={device.so} color={color} /> : null}
                </>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
                  <ActivityIndicator color={color.accent} />
                  <Text style={{ color: color.textMuted }}>Detectando dispositivo…</Text>
                </View>
              )}
            </View>

            {error ? <Text style={{ color: color.danger, fontSize: font.size.sm }}>{error}</Text> : null}

            <Button title={saving ? 'Registrando…' : 'Registrar terminal'} onPress={onRegistrar} loading={saving} disabled={!device} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DeviceRow({ label, value, color }: { label: string; value: string; color: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, gap: 12 }}>
      <Text style={{ color: color.textMuted, fontSize: 13 }}>{label}</Text>
      <Text numberOfLines={1} style={{ color: color.text, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 460, borderWidth: 1 },
  iconWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600' },
  tipoBtn: { flex: 1, alignItems: 'center', borderWidth: 1 },
  deviceBox: { borderWidth: 1 },
});
