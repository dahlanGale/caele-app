import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
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

import { ZonaGrid } from '@/src/components/mesas/ZonaGrid';
import { Button } from '@/src/components/ui';
import { Chip } from '@/src/components/ui/Chip';
import { usePyme } from '@/src/context/PymeContext';
import { PLANTILLAS } from '@/src/services/templates';
import { elementosCollection, zonasCollection } from '@/src/services/zonas';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Elemento, ElementoForma, ElementoTipo, Zona, ZonaConElementos } from '@/src/types';

const FORMAS: ElementoForma[] = ['redonda', 'cuadrada', 'rectangular', 'barra'];
const TIPOS_PALETTE: { tipo: ElementoTipo; label: string; icon: string }[] = [
  { tipo: 'mesa', label: 'Mesa', icon: 'tablet-portrait-outline' },
  { tipo: 'entrada', label: 'Entrada', icon: 'door-open-outline' },
  { tipo: 'decoracion', label: 'Decoración', icon: 'flower-outline' },
  { tipo: 'texto', label: 'Texto', icon: 'text-outline' },
];

export default function MesasEditorScreen() {
  const { color, space, radius, font } = useAppTheme();
  const { pyme } = usePyme();
  const [zonas, setZonas] = useState<ZonaConElementos[]>([]);
  const [selectedZonaId, setSelectedZonaId] = useState<string | null>(null);
  const [selectedElementoId, setSelectedElementoId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pyme) return;
    const unsub = zonasCollection.subscribe(pyme.id, (zonaDocs) => {
      const sorted = zonaDocs.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      const unsubs: (() => void)[] = [];
      const map = new Map<string, Elemento[]>();
      sorted.forEach((z) => {
        const unsubEl = elementosCollection(pyme.id, z.id).subscribe(pyme.id, (els) => {
          map.set(z.id, els);
          setZonas(sorted.map((z2) => ({ ...z2, elementos: map.get(z2.id) ?? [] })));
        });
        unsubs.push(unsubEl);
      });
      setLoading(false);
      return () => unsubs.forEach((fn) => fn());
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pyme?.id]);

  const selectedZona = useMemo(
    () => zonas.find((z) => z.id === selectedZonaId) ?? zonas[0],
    [zonas, selectedZonaId]
  );

  const selectedElemento = useMemo(
    () => zonas.flatMap((z) => z.elementos).find((e) => e.id === selectedElementoId) ?? null,
    [zonas, selectedElementoId]
  );

  const addZona = () => {
    const pisos = Array.from(new Set(zonas.map((z) => z.piso).filter(Boolean)));
    const pisoDefault = pisos[0] ?? 'Piso 1';
    const name = `Zona ${zonas.length + 1}`;
    setZonas((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, nombre: name, piso: pisoDefault, orden: prev.length, activa: true, elementos: [] },
    ]);
  };

  const updateZona = (patch: Partial<Zona>) => {
    if (!selectedZona) return;
    setZonas((prev) => prev.map((z) => (z.id === selectedZona.id ? { ...z, ...patch } : z)));
  };

  const addElemento = (tipo: ElementoTipo) => {
    if (!selectedZona) return;
    setZonas((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZona.id) return z;
        const nextCol = z.elementos.length % 6;
        const nextRow = Math.floor(z.elementos.length / 6);
        const el: Elemento = {
          id: `new-${Date.now()}`,
          tipo,
          nombre: tipo === 'mesa' ? `M${z.elementos.length + 1}` : tipo === 'entrada' ? 'Entrada' : tipo === 'decoracion' ? 'Decoración' : 'Texto',
          forma: tipo === 'mesa' ? 'redonda' : undefined,
          capacidad: tipo === 'mesa' ? 4 : undefined,
          fila: nextRow,
          columna: nextCol,
          ancho: 1,
          estado: 'disponible',
        };
        return { ...z, elementos: [...z.elementos, el] };
      })
    );
  };

  const updateElemento = (patch: Partial<Elemento>) => {
    if (!selectedElemento || !selectedZona) return;
    setZonas((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZona.id) return z;
        return {
          ...z,
          elementos: z.elementos.map((e) => (e.id === selectedElemento.id ? { ...e, ...patch } : e)),
        };
      })
    );
  };

  const moveElemento = (dFila: number, dCol: number) => {
    if (!selectedElemento) return;
    updateElemento({
      fila: Math.max(0, selectedElemento.fila + dFila),
      columna: Math.max(0, selectedElemento.columna + dCol),
    });
  };

  const duplicarElemento = () => {
    if (!selectedElemento || !selectedZona) return;
    const clone: Elemento = {
      ...selectedElemento,
      id: `new-${Date.now()}`,
      columna: selectedElemento.columna + 1,
      nombre: `${selectedElemento.nombre} (2)`,
    };
    setZonas((prev) =>
      prev.map((z) => (z.id === selectedZona.id ? { ...z, elementos: [...z.elementos, clone] } : z))
    );
    setSelectedElementoId(clone.id);
  };

  const eliminarElemento = () => {
    if (!selectedElemento || !selectedZona) return;
    setZonas((prev) =>
      prev.map((z) => (z.id === selectedZona.id ? { ...z, elementos: z.elementos.filter((e) => e.id !== selectedElemento.id) } : z))
    );
    setSelectedElementoId(null);
  };

  const handleElementoDragEnd = (elemento: Elemento, targetRow: number, targetCol: number) => {
    if (!selectedZona) return;
    const targetOccupied = selectedZona.elementos.find(
      (e) => e.id !== elemento.id && e.fila === targetRow && e.columna === targetCol
    );
    if (targetOccupied) {
      // Intercambiar posiciones
      setZonas((prev) =>
        prev.map((z) => {
          if (z.id !== selectedZona.id) return z;
          return {
            ...z,
            elementos: z.elementos.map((e) => {
              if (e.id === elemento.id) return { ...e, fila: targetRow, columna: targetCol };
              if (e.id === targetOccupied.id) return { ...e, fila: elemento.fila, columna: elemento.columna };
              return e;
            }),
          };
        })
      );
    } else {
      updateElemento({ fila: targetRow, columna: targetCol });
    }
  };

  const restablecerOrden = () => {
    if (!selectedZona) return;
    Alert.alert('Restablecer orden', '¿Reorganizar las mesas en una cuadrícula limpia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restablecer',
        style: 'destructive',
        onPress: () => {
          setZonas((prev) =>
            prev.map((z) => {
              if (z.id !== selectedZona.id) return z;
              const cols = 8;
              let col = 0;
              let row = 0;
              const sorted = [...z.elementos].sort((a, b) => (a.fila - b.fila) * cols + a.columna - b.columna);
              const nuevos = sorted.map((e) => {
                const ancho = e.ancho ?? 1;
                const next = { ...e, fila: row, columna: col };
                col += ancho;
                if (col >= cols) {
                  col = 0;
                  row++;
                }
                return next;
              });
              return { ...z, elementos: nuevos };
            })
          );
        },
      },
    ]);
  };

  const aplicarPlantillaAZona = (plantillaKey: string) => {
    const plantilla = PLANTILLAS.find((p) => p.key === plantillaKey);
    if (!plantilla || !selectedZona) return;
    const primeraZona = plantilla.zonas[0];
    if (!primeraZona) return;
    let col = 0;
    let fila = 0;
    const nuevos: Elemento[] = Array.from({ length: primeraZona.cantidadMesas }, (_, i) => {
      const ancho = primeraZona.forma === 'rectangular' ? 2 : primeraZona.forma === 'barra' ? 3 : 1;
      const el: Elemento = {
        id: `new-${Date.now()}-${i}`,
        tipo: 'mesa',
        forma: primeraZona.forma,
        nombre: `M${i + 1}`,
        capacidad: primeraZona.capacidad,
        fila,
        columna: col,
        ancho,
        estado: 'disponible',
      };
      col += ancho;
      if (col >= 6) {
        col = 0;
        fila++;
      }
      return el;
    });
    setZonas((prev) =>
      prev.map((z) => (z.id === selectedZona.id ? { ...z, elementos: nuevos } : z))
    );
  };

  const guardar = async () => {
    if (!pyme) return;
    setSaving(true);
    try {
      await Promise.all(
        zonas.map((z, i) =>
          zonasCollection.set(pyme.id, z.id, {
            nombre: z.nombre,
            piso: z.piso,
            orden: i,
            activa: z.activa ?? true,
          })
        )
      );
      await Promise.all(
        zonas.map((z) => {
          const repo = elementosCollection(pyme.id, z.id);
          return Promise.all(
            z.elementos.map((el) =>
              repo.set(pyme.id, el.id, {
                tipo: el.tipo,
                forma: el.forma,
                nombre: el.nombre,
                capacidad: el.capacidad,
                fila: el.fila,
                columna: el.columna,
                ancho: el.ancho,
                estado: el.estado,
              })
            )
          );
        })
      );
      Alert.alert('Guardado', 'Distribución guardada correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: color.bg }}>
        <Text style={{ color: color.textMuted }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Editor de mesas', headerShown: true }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: color.bg }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: space[3], gap: space[2] }}>
            {zonas.map((z) => (
              <Pressable
                key={z.id}
                onPress={() => { setSelectedZonaId(z.id); setSelectedElementoId(null); }}
                style={[
                  styles.zonaTab,
                  {
                    backgroundColor: z.id === selectedZona?.id ? color.accentSoft : color.bgElevated,
                    borderColor: z.id === selectedZona?.id ? color.accent : color.border,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text style={{ color: color.text, fontWeight: font.weight.semibold }}>{z.nombre}</Text>
                <Text style={{ color: color.textMuted, fontSize: 11 }}>{z.piso}</Text>
              </Pressable>
            ))}
            <Pressable onPress={addZona} style={[styles.zonaTab, { backgroundColor: color.bgSubtle, borderRadius: radius.md }]}>
              <Ionicons name="add" size={20} color={color.text} />
            </Pressable>
          </ScrollView>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space[3] }}>
            {selectedZona ? (
              <ZonaGrid
                zona={selectedZona}
                dragMode={dragMode}
                selectedId={selectedElementoId}
                onElementoPress={(el) => setSelectedElementoId(el.id === selectedElementoId ? null : el.id)}
                onElementoDragEnd={handleElementoDragEnd}
              />
            ) : (
              <Text style={{ color: color.textMuted, textAlign: 'center', marginTop: 48 }}>Selecciona o agrega una zona</Text>
            )}
          </ScrollView>

          <View style={[styles.panel, { backgroundColor: color.bgElevated, borderTopColor: color.border, padding: space[4] }]}>
            <View style={{ flexDirection: 'row', gap: space[2], marginBottom: space[3] }}>
              <Button
                title={dragMode ? 'Listo' : 'Mover mesas'}
                variant={dragMode ? 'primary' : 'outline'}
                onPress={() => setDragMode((v) => !v)}
              />
              <Button title="Restablecer orden" variant="outline" onPress={restablecerOrden} />
            </View>
            {!selectedElemento ? (
              <View style={{ gap: space[3] }}>
                <Text style={[styles.panelTitle, { color: color.text, fontWeight: font.weight.semibold }]}>
                  {selectedZona?.nombre}
                </Text>
                <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>Piso</Text>
                <TextInput
                  value={selectedZona?.piso ?? 'Piso 1'}
                  onChangeText={(v) => updateZona({ piso: v })}
                  style={[styles.input, { color: color.text, borderColor: color.border, backgroundColor: color.bg }]}
                />
                <Text style={[styles.panelTitle, { color: color.text, fontWeight: font.weight.semibold }]}>
                  Paleta de elementos
                </Text>
                <View style={{ flexDirection: 'row', gap: space[2] }}>
                  {TIPOS_PALETTE.map((p) => (
                    <Pressable
                      key={p.tipo}
                      onPress={() => addElemento(p.tipo)}
                      style={[styles.paletteItem, { backgroundColor: color.bgSubtle, borderRadius: radius.md }]}
                    >
                      <Ionicons name={p.icon as any} size={22} color={color.text} />
                      <Text style={{ color: color.text, fontSize: font.size.xs }}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.panelTitle, { color: color.text, fontWeight: font.weight.semibold, marginTop: space[2] }]}>
                  Plantillas rápidas
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
                  {PLANTILLAS.map((p) => (
                    <Chip key={p.key} label={p.nombre} onPress={() => aplicarPlantillaAZona(p.key)} />
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ gap: space[3] }}>
                <Text style={[styles.panelTitle, { color: color.text, fontWeight: font.weight.semibold }]}>
                  {selectedElemento.nombre}
                </Text>
                <TextInput
                  value={selectedElemento.nombre}
                  onChangeText={(v) => updateElemento({ nombre: v })}
                  style={[styles.input, { color: color.text, borderColor: color.border, backgroundColor: color.bg }]}
                />
                {selectedElemento.tipo === 'mesa' && (
                  <>
                    <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>Forma</Text>
                    <View style={{ flexDirection: 'row', gap: space[2] }}>
                      {FORMAS.map((f) => (
                        <Chip key={f} label={f} active={selectedElemento.forma === f} onPress={() => updateElemento({ forma: f })} />
                      ))}
                    </View>
                    <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>Capacidad</Text>
                    <TextInput
                      value={String(selectedElemento.capacidad ?? '')}
                      onChangeText={(v) => updateElemento({ capacidad: Math.max(0, parseInt(v, 10) || 0) })}
                      keyboardType="number-pad"
                      style={[styles.input, { color: color.text, borderColor: color.border, backgroundColor: color.bg }]}
                    />
                  </>
                )}
                <View style={{ flexDirection: 'row', gap: space[2] }}>
                  <Pressable onPress={() => moveElemento(-1, 0)} style={[styles.arrowBtn, { backgroundColor: color.bgSubtle }]}>
                    <Ionicons name="arrow-up" size={20} color={color.text} />
                  </Pressable>
                  <Pressable onPress={() => moveElemento(1, 0)} style={[styles.arrowBtn, { backgroundColor: color.bgSubtle }]}>
                    <Ionicons name="arrow-down" size={20} color={color.text} />
                  </Pressable>
                  <Pressable onPress={() => moveElemento(0, -1)} style={[styles.arrowBtn, { backgroundColor: color.bgSubtle }]}>
                    <Ionicons name="arrow-back" size={20} color={color.text} />
                  </Pressable>
                  <Pressable onPress={() => moveElemento(0, 1)} style={[styles.arrowBtn, { backgroundColor: color.bgSubtle }]}>
                    <Ionicons name="arrow-forward" size={20} color={color.text} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', gap: space[2] }}>
                  <Button title="Duplicar" variant="outline" onPress={duplicarElemento} />
                  <Button title="Eliminar" variant="outline" onPress={eliminarElemento} />
                </View>
              </View>
            )}
            <View style={{ marginTop: space[4] }}>
              <Button title="Guardar distribución" onPress={guardar} loading={saving} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  zonaTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  panel: {
    borderTopWidth: 1,
  },
  panelTitle: {
    fontSize: 16,
  },
  paletteItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    minWidth: 64,
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  arrowBtn: {
    padding: 10,
    borderRadius: 8,
  },
});
