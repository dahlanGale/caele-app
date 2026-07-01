import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Button } from '@/src/components/ui';
import { Chip } from '@/src/components/ui/Chip';
import { usePyme } from '@/src/context/PymeContext';
import { pymeCollection } from '@/src/services/firestore';
import { PLANTILLAS, plantillasPorTipo, TIPOS_DISTRIBUCION } from '@/src/services/templates';
import { crearZona } from '@/src/services/zonas';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ConfiguracionZona, ElementoForma, TipoDistribucion } from '@/src/types';

const CAPACIDADES = [2, 4, 6, 8];
const TOTAL_STEPS = 6;

export default function MesasWizardScreen() {
  const { color, space, radius, font } = useAppTheme();
  const { pyme } = usePyme();
  const [step, setStep] = useState(1);
  const [nombreNegocio, setNombreNegocio] = useState(pyme?.nombreNegocio ?? pyme?.nombre ?? '');
  const [tipo, setTipo] = useState<TipoDistribucion>('restaurante');
  const [pisos, setPisos] = useState<string[]>(['Piso 1']);
  const [zonas, setZonas] = useState<ConfiguracionZona[]>([]);
  const [loading, setLoading] = useState(false);

  const plantillas = plantillasPorTipo(tipo);

  const aplicarPlantilla = (key: string) => {
    const plantilla = PLANTILLAS.find((p) => p.key === key);
    if (!plantilla) return;
    const pisosPlantilla = Array.from(new Set(plantilla.zonas.map((z) => z.piso)));
    if (pisosPlantilla.length > 0) setPisos(pisosPlantilla);
    setZonas(plantilla.zonas.map((z) => ({ ...z })));
  };

  const addPiso = () => {
    setPisos((prev) => [...prev, `Piso ${prev.length + 1}`]);
  };

  const updatePiso = (idx: number, value: string) => {
    const old = pisos[idx];
    setPisos((prev) => prev.map((p, i) => (i === idx ? value : p)));
    if (old && value !== old) {
      setZonas((prev) => prev.map((z) => (z.piso === old ? { ...z, piso: value } : z)));
    }
  };

  const removePiso = (idx: number) => {
    const piso = pisos[idx];
    if (pisos.length <= 1) {
      Alert.alert('Debes tener al menos un piso');
      return;
    }
    const pisoDefault = pisos[0] === piso ? pisos[1] : pisos[0];
    setPisos((prev) => prev.filter((_, i) => i !== idx));
    setZonas((prev) => prev.map((z) => (z.piso === piso ? { ...z, piso: pisoDefault } : z)));
  };

  const addZona = () => {
    setZonas((prev) => [
      ...prev,
      { nombre: `Zona ${prev.length + 1}`, piso: pisos[0] ?? 'Piso 1', cantidadMesas: 4, forma: 'redonda', capacidad: 4 },
    ]);
  };

  const updateZona = (idx: number, patch: Partial<ConfiguracionZona>) => {
    setZonas((prev) => prev.map((z, i) => (i === idx ? { ...z, ...patch } : z)));
  };

  const removeZona = (idx: number) => {
    setZonas((prev) => prev.filter((_, i) => i !== idx));
  };

  const generar = async () => {
    if (!pyme) {
      Alert.alert('Error', 'No hay una sesión activa.');
      return;
    }
    if (pisos.length === 0) {
      Alert.alert('Agrega al menos un piso');
      return;
    }
    if (zonas.length === 0) {
      Alert.alert('Agrega al menos una zona');
      return;
    }
    setLoading(true);
    try {
      await pymeCollection.set(pyme.id, pyme.id, { nombreNegocio });
      await Promise.all(
        zonas.map((z, i) => crearZona(pyme.id, z.nombre, z.piso, i, z))
      );
      router.replace('/(drawer)/mesas');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo generar la distribución');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={{ gap: space[4] }}>
            <Text style={[styles.title, { color: color.text, fontSize: font.size.xl, fontWeight: font.weight.bold }]}>
              Configura tu restaurante
            </Text>
            <Text style={[styles.subtitle, { color: color.textMuted, fontSize: font.size.base }]}>
              Paso 1 de {TOTAL_STEPS}: ¿cómo se llama tu negocio?
            </Text>
            <TextInput
              value={nombreNegocio}
              onChangeText={setNombreNegocio}
              placeholder="Ej. La Esquina"
              placeholderTextColor={color.textMuted}
              style={[styles.input, { color: color.text, borderColor: color.border, backgroundColor: color.bgElevated }]}
            />
          </View>
        );
      case 2:
        return (
          <View style={{ gap: space[4] }}>
            <Text style={[styles.title, { color: color.text, fontSize: font.size.xl, fontWeight: font.weight.bold }]}>
              Tipo de distribución
            </Text>
            <Text style={[styles.subtitle, { color: color.textMuted, fontSize: font.size.base }]}>
              Paso 2 de {TOTAL_STEPS}: selecciona el tipo de espacio.
            </Text>
            <View style={{ gap: space[3] }}>
              {TIPOS_DISTRIBUCION.map((t) => {
                const active = t.key === tipo;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setTipo(t.key)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: active ? color.accentSoft : color.bgElevated,
                        borderColor: active ? color.accent : color.border,
                      },
                    ]}
                  >
                    <Text style={{ color: color.text, fontWeight: font.weight.semibold, fontSize: font.size.md }}>
                      {t.label}
                    </Text>
                    <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>{t.descripcion}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={{ gap: space[4] }}>
            <Text style={[styles.title, { color: color.text, fontSize: font.size.xl, fontWeight: font.weight.bold }]}>
              Pisos / Plantas
            </Text>
            <Text style={[styles.subtitle, { color: color.textMuted, fontSize: font.size.base }]}>
              Paso 3 de {TOTAL_STEPS}: define los pisos o plantas del restaurante. Las zonas se asignarán a estos pisos.
            </Text>
            <View style={{ gap: space[3] }}>
              {pisos.map((p, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.pisoCard,
                    { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.md },
                  ]}
                >
                  <TextInput
                    value={p}
                    onChangeText={(v) => updatePiso(idx, v)}
                    style={[styles.pisoInput, { color: color.text, borderColor: color.border }]}
                  />
                  <Pressable onPress={() => removePiso(idx)} style={{ padding: space[2] }}>
                    <Ionicons name="trash-outline" size={20} color={color.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
            <Button title="+ Agregar piso" variant="outline" onPress={addPiso} />
          </View>
        );
      case 4:
        return (
          <View style={{ gap: space[4] }}>
            <Text style={[styles.title, { color: color.text, fontSize: font.size.xl, fontWeight: font.weight.bold }]}>
              Zonas
            </Text>
            <Text style={[styles.subtitle, { color: color.textMuted, fontSize: font.size.base }]}>
              Paso 4 de {TOTAL_STEPS}: agrega zonas y asígnalas a un piso. Puedes usar una plantilla como punto de partida.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
              {plantillas.map((p) => (
                <Chip key={p.key} label={p.nombre} onPress={() => aplicarPlantilla(p.key)} />
              ))}
            </View>
            <View style={{ gap: space[3] }}>
              {zonas.map((z, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.zonaCard,
                    { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.md },
                  ]}
                >
                  <TextInput
                    value={z.nombre}
                    onChangeText={(v) => updateZona(idx, { nombre: v })}
                    style={[styles.zonaInput, { color: color.text, borderColor: color.border }]}
                  />
                  <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'center', marginBottom: space[2] }}>
                    <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>Piso</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: space[2] }}>
                        {pisos.map((p) => (
                          <Chip key={p} label={p} active={z.piso === p} onPress={() => updateZona(idx, { piso: p })} />
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'center' }}>
                    <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>Mesas</Text>
                    <TextInput
                      value={String(z.cantidadMesas)}
                      onChangeText={(v) => updateZona(idx, { cantidadMesas: Math.max(0, parseInt(v, 10) || 0) })}
                      keyboardType="number-pad"
                      style={[styles.smallInput, { color: color.text, borderColor: color.border }]}
                    />
                    <Pressable onPress={() => removeZona(idx)} style={{ padding: space[2] }}>
                      <Ionicons name="trash-outline" size={20} color={color.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            <Button title="+ Agregar zona" variant="outline" onPress={addZona} />
          </View>
        );
      case 5:
        return (
          <View style={{ gap: space[4] }}>
            <Text style={[styles.title, { color: color.text, fontSize: font.size.xl, fontWeight: font.weight.bold }]}>
              Detalles por zona
            </Text>
            <Text style={[styles.subtitle, { color: color.textMuted, fontSize: font.size.base }]}>
              Paso 5 de {TOTAL_STEPS}: forma y capacidad de cada zona.
            </Text>
            <View style={{ gap: space[4] }}>
              {zonas.map((z, idx) => (
                <View key={idx} style={[styles.zonaCard, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.md }]}>
                  <Text style={{ color: color.text, fontWeight: font.weight.semibold, marginBottom: space[2] }}>
                    {z.nombre} · {z.piso}
                  </Text>
                  <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginBottom: space[2] }}>Forma</Text>
                  <View style={{ flexDirection: 'row', gap: space[2], marginBottom: space[3] }}>
                    {(['redonda', 'cuadrada', 'rectangular', 'barra'] as ElementoForma[]).map((f) => (
                      <Chip
                        key={f}
                        label={f.charAt(0).toUpperCase() + f.slice(1)}
                        active={z.forma === f}
                        onPress={() => updateZona(idx, { forma: f })}
                      />
                    ))}
                  </View>
                  <Text style={{ color: color.textMuted, fontSize: font.size.sm, marginBottom: space[2] }}>Capacidad</Text>
                  <View style={{ flexDirection: 'row', gap: space[2] }}>
                    {CAPACIDADES.map((c) => (
                      <Chip
                        key={c}
                        label={String(c)}
                        active={z.capacidad === c}
                        onPress={() => updateZona(idx, { capacidad: c })}
                      />
                    ))}
                    <Chip
                      label="Otra"
                      active={!CAPACIDADES.includes(z.capacidad)}
                      onPress={() => {}}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      case 6:
        return (
          <View style={{ gap: space[4] }}>
            <Text style={[styles.title, { color: color.text, fontSize: font.size.xl, fontWeight: font.weight.bold }]}>
              ¡Listo!
            </Text>
            <Text style={[styles.subtitle, { color: color.textMuted, fontSize: font.size.base }]}>
              Paso 6 de {TOTAL_STEPS}: vamos a generar {zonas.reduce((acc, z) => acc + z.cantidadMesas, 0)} mesas en {zonas.length} zonas y {pisos.length} pisos.
            </Text>
            <View style={[styles.summary, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.md }]}>
              {pisos.map((piso) => (
                <View key={piso} style={{ marginBottom: space[4] }}>
                  <Text style={{ color: color.text, fontWeight: font.weight.bold, marginBottom: space[2] }}>
                    {piso}
                  </Text>
                  {zonas
                    .filter((z) => z.piso === piso)
                    .map((z, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: space[2] }}>
                        <Text style={{ color: color.text }}>{z.nombre}</Text>
                        <Text style={{ color: color.textMuted }}>
                          {z.cantidadMesas} mesas · {z.capacidad} pax · {z.forma}
                        </Text>
                      </View>
                    ))}
                </View>
              ))}
            </View>
            {loading && <ActivityIndicator color={color.accent} />}
          </View>
        );
    }
  };

  const canNext = () => {
    if (step === 1) return nombreNegocio.trim().length > 0;
    if (step === 3) return pisos.length > 0 && pisos.every((p) => p.trim().length > 0);
    if (step === 4 || step === 5 || step === 6) return zonas.length > 0;
    return true;
  };

  const next = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else generar();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Configuración de mesas', headerShown: true }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={styles.content}>
          <View style={styles.steps}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: s === step ? color.accent : s < step ? color.success : color.border,
                  },
                ]}
              />
            ))}
          </View>
          {renderStep()}
          <View style={[styles.footer, { gap: space[3], marginTop: space[6] }]}>
            <Button title="Atrás" variant="outline" onPress={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || loading} />
            <Button title={step === TOTAL_STEPS ? 'Generar distribución' : 'Siguiente'} onPress={next} disabled={!canNext() || loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  steps: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  pisoCard: {
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pisoInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    flex: 1,
  },
  zonaCard: {
    borderWidth: 1,
    padding: 16,
  },
  zonaInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 56,
    textAlign: 'center',
  },
  summary: {
    borderWidth: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
  },
});
