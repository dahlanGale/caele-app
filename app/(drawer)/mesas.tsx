import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, LayoutChangeEvent, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { usePyme } from '@/src/context/PymeContext';
import { ocuparMesa } from '@/src/services/ordenes';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Mesa } from '@/src/types';
import FirestoreRestaurante from '../../firebase/FirestoreRestaurante';

function clamp(n: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, n));
}

const GRID = 16;
const snap = (v: number) => Math.round(v / GRID) * GRID;
const LAYOUT_ID = 'default';

type Template = 'fila' | '2x2' | '3x3' | 'l-shape';

const TEMPLATES: { key: Template; label: string; desc: string }[] = [
  { key: 'fila', label: 'Fila', desc: '1 fila de 6 mesas' },
  { key: '2x2', label: '2×2', desc: '4 mesas en cuadrícula' },
  { key: '3x3', label: '3×3', desc: '9 mesas en cuadrícula' },
  { key: 'l-shape', label: 'L', desc: '4 mesas en forma de L' },
];

function generarMesas(tipo: Template, startIndex = 1): Mesa[] {
  const margin = 0.12;
  const size = 1 - margin * 2;
  const create = (idx: number, x: number, y: number): Mesa => ({
    id: Math.random().toString(36).slice(2),
    x: clamp(x, margin, 1 - margin),
    y: clamp(y, margin, 1 - margin),
    label: String(startIndex + idx),
    shape: 'circle',
    estado: 'libre',
  });

  switch (tipo) {
    case 'fila': {
      const count = 6;
      return Array.from({ length: count }, (_, i) =>
        create(i, margin + (size / (count - 1)) * i, 0.5)
      );
    }
    case '2x2': {
      return [
        create(0, margin + size * 0.25, margin + size * 0.25),
        create(1, margin + size * 0.75, margin + size * 0.25),
        create(2, margin + size * 0.25, margin + size * 0.75),
        create(3, margin + size * 0.75, margin + size * 0.75),
      ];
    }
    case '3x3': {
      return Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        return create(
          i,
          margin + (size / 2) * col,
          margin + (size / 2) * row
        );
      });
    }
    case 'l-shape': {
      return [
        create(0, margin + size * 0.1, margin + size * 0.1),
        create(1, margin + size * 0.1, margin + size * 0.5),
        create(2, margin + size * 0.1, margin + size * 0.9),
        create(3, margin + size * 0.6, margin + size * 0.9),
      ];
    }
  }
}

export default function RestaurantSandbox() {
  const { color, space, radius, font } = useAppTheme();
  const { pyme } = usePyme();
  const [tables, setTables] = useState<Mesa[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<Mesa | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [sizeVersion, setSizeVersion] = useState(0);

  const canvasW = useSharedValue(1);
  const canvasH = useSharedValue(1);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    canvasW.value = width;
    canvasH.value = height;
    setSizeVersion((v) => v + 1);
  };

  const applyTemplate = (tipo: Template) => {
    const generated = generarMesas(tipo, 1);
    setTables(generated);
    setTemplatesOpen(false);
  };

  const addSingleTable = () => {
    setTables((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        x: 0.5,
        y: 0.5,
        label: String(prev.length + 1),
        shape: 'circle',
        estado: 'libre',
      },
    ]);
  };

  const tapToAdd = useMemo(
    () =>
      Gesture.Tap().onEnd((e) => {
        'worklet';
        if (!addMode) return;
        const nx = clamp(e.x / canvasW.value, 0, 1);
        const ny = clamp(e.y / canvasH.value, 0, 1);
        runOnJS(setTables)((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            x: nx,
            y: ny,
            label: String(prev.length + 1),
            shape: 'circle',
            estado: 'libre',
          },
        ]);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addMode]
  );

  const handleCommitTable = useCallback((id: string, nx: number, ny: number) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, x: nx, y: ny } : t)));
  }, []);

  const handleSave = useCallback(async () => {
    if (!pyme) return;
    try {
      await FirestoreRestaurante.guardarMesas(LAYOUT_ID, tables);
      Alert.alert('Guardado', 'Disposición de mesas guardada.');
    } catch (err) {
      console.error('mesas.handleSave error', err);
    }
  }, [tables, pyme]);

  const handleLoad = useCallback(async () => {
    if (!pyme) return;
    try {
      const data = await FirestoreRestaurante.cargarMesas(LAYOUT_ID);
      if (data?.length) setTables(data as Mesa[]);
    } catch (err) {
      console.error('mesas.handleLoad error', err);
    }
  }, [pyme]);

  const selected = useMemo(() => tables.find((t) => t.id === selectedId), [tables, selectedId]);

  const handleOpenOrder = useCallback(async () => {
    if (!selected || !pyme) return;
    if (selected.estado === 'libre') {
      await ocuparMesa(pyme.id, LAYOUT_ID, selected.id);
    }
    setSelectedId(null);
    router.push({ pathname: '/orden', params: { mesaId: selected.id } });
  }, [selected, pyme]);

  const handleEdit = (table: Mesa) => {
    setEditingTable(table);
    setSelectedId(table.id);
  };

  const handleSaveEdit = () => {
    if (!editingTable) return;
    setTables((prev) =>
      prev.map((t) => (t.id === editingTable.id ? { ...t, label: editingTable.label, capacidad: editingTable.capacidad } : t))
    );
    setEditingTable(null);
  };

  const handleDelete = () => {
    if (!editingTable) return;
    setTables((prev) => prev.filter((t) => t.id !== editingTable.id));
    setEditingTable(null);
    setSelectedId(null);
  };

  return (
    <View style={[styles.screen, { backgroundColor: color.bg }]}>
      <View style={[styles.toolbar, { backgroundColor: color.bgElevated, padding: space[3], gap: space[3] }]}>
        <Pressable style={[styles.btn, { backgroundColor: color.bgSubtle }]} onPress={() => setTemplatesOpen(true)}>
          <Text style={[styles.btnText, { color: color.text }]}>Plantillas</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, { backgroundColor: color.bgSubtle }]} onPress={() => setAddMode((v) => !v)}
        >
          <Text style={[styles.btnText, { color: color.text }]}>{addMode ? 'Toque para colocar' : 'Agregar'}</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: color.bgSubtle }]} onPress={addSingleTable}>
          <Text style={[styles.btnText, { color: color.text }]}>+1 Mesa</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: color.bgSubtle }]} onPress={() => setTables([])}>
          <Text style={[styles.btnText, { color: color.text }]}>Limpiar</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: color.bgSubtle }]} onPress={handleSave}>
          <Text style={[styles.btnText, { color: color.text }]}>Guardar</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: color.bgSubtle }]} onPress={handleLoad}>
          <Text style={[styles.btnText, { color: color.text }]}>Cargar</Text>
        </Pressable>
        {selected && (
          <Pressable style={[styles.btn, { backgroundColor: color.accent }]} onPress={handleOpenOrder}>
            <Text style={[styles.btnText, { color: color.textInverse }]}>
              {selected.estado === 'libre' ? 'Abrir orden' : 'Ver orden'}
            </Text>
          </Pressable>
        )}
      </View>

      {selected && (
        <View style={[styles.selectedBar, { backgroundColor: color.bgSubtle }]}>
          <Text style={[styles.selectedText, { color: color.text, fontSize: font.size.sm }]}>
            Mesa {selected.label ?? selected.id} - {selected.estado ?? 'libre'}
          </Text>
        </View>
      )}

      <GestureDetector gesture={tapToAdd}>
        <View style={styles.canvasWrapper} onLayout={onLayout} collapsable={false}>
          <Animated.View style={styles.canvasContent}>
            <GridBackground color={color.borderSubtle} />
            {Array.isArray(tables) &&
              tables.map((t) => (
                <DraggableTable
                  key={t.id}
                  table={t}
                  selected={t.id === selectedId}
                  canvasW={canvasW}
                  canvasH={canvasH}
                  sizeVersion={sizeVersion}
                  onCommit={handleCommitTable}
                  onSelect={() => setSelectedId(t.id)}
                  onEdit={() => handleEdit(t)}
                  colors={color}
                />
              ))}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Templates modal */}
      <Modal visible={templatesOpen} transparent animationType="slide" onRequestClose={() => setTemplatesOpen(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: color.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: color.bgElevated, borderRadius: radius.lg, padding: space[4] }]}>
            <Text style={[styles.modalTitle, { color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold }]}>
              Plantillas de mesas
            </Text>
            {TEMPLATES.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => applyTemplate(t.key)}
                style={({ pressed }) => [
                  styles.templateRow,
                  {
                    backgroundColor: pressed ? color.accentSoft : color.bgSubtle,
                    borderColor: color.border,
                    borderRadius: radius.md,
                    padding: space[3],
                    marginBottom: space[2],
                  },
                ]}
              >
                <Text style={{ color: color.text, fontWeight: font.weight.semibold }}>{t.label}</Text>
                <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>{t.desc}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setTemplatesOpen(false)}
              style={[styles.btn, { backgroundColor: color.accent, marginTop: space[2] }]}
            >
              <Text style={[styles.btnText, { color: color.textInverse }]}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Edit modal */}
      <Modal visible={!!editingTable} transparent animationType="slide" onRequestClose={() => setEditingTable(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: color.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: color.bgElevated, borderRadius: radius.lg, padding: space[4] }]}>
            <Text style={[styles.modalTitle, { color: color.text, fontSize: font.size.lg, fontWeight: font.weight.bold }]}>
              Editar mesa
            </Text>
            <Text style={[styles.label, { color: color.textMuted, fontSize: font.size.sm, marginBottom: space[1] }]}>Número</Text>
            <TextInput
              value={editingTable?.label ?? ''}
              onChangeText={(text) => setEditingTable((t) => (t ? { ...t, label: text } : t))}
              style={[
                styles.input,
                {
                  backgroundColor: color.bgSubtle,
                  color: color.text,
                  borderColor: color.border,
                  borderRadius: radius.md,
                  padding: space[3],
                  marginBottom: space[3],
                },
              ]}
            />
            <Text style={[styles.label, { color: color.textMuted, fontSize: font.size.sm, marginBottom: space[1] }]}>Capacidad</Text>
            <TextInput
              value={editingTable?.capacidad?.toString() ?? ''}
              onChangeText={(text) =>
                setEditingTable((t) => (t ? { ...t, capacidad: parseInt(text || '0', 10) } : t))
              }
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  backgroundColor: color.bgSubtle,
                  color: color.text,
                  borderColor: color.border,
                  borderRadius: radius.md,
                  padding: space[3],
                  marginBottom: space[3],
                },
              ]}
            />
            <View style={{ flexDirection: 'row', gap: space[2] }}>
              <Pressable style={[styles.btn, { flex: 1, backgroundColor: color.accent }]} onPress={handleSaveEdit}>
                <Text style={[styles.btnText, { color: color.textInverse }]}>Guardar</Text>
              </Pressable>
              <Pressable style={[styles.btn, { flex: 1, backgroundColor: color.danger }]} onPress={handleDelete}>
                <Text style={[styles.btnText, { color: color.textInverse }]}>Eliminar</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.btn, { backgroundColor: color.bgSubtle, marginTop: space[2] }]}
              onPress={() => setEditingTable(null)}
            >
              <Text style={[styles.btnText, { color: color.text }]}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DraggableTable({
  table,
  selected,
  canvasW,
  canvasH,
  sizeVersion,
  onCommit,
  onSelect,
  onEdit,
  colors,
}: {
  table: Mesa;
  selected: boolean;
  canvasW: Animated.SharedValue<number>;
  canvasH: Animated.SharedValue<number>;
  sizeVersion: number;
  onCommit: (id: string, nx: number, ny: number) => void;
  onSelect: () => void;
  onEdit: () => void;
  colors: any;
}) {
  const RADIUS = 28;
  const xPx = useSharedValue(table.x * canvasW.value);
  const yPx = useSharedValue(table.y * canvasH.value);

  useEffect(() => {
    xPx.value = table.x * canvasW.value;
    yPx.value = table.y * canvasH.value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.x, table.y, sizeVersion]);

  const panGesture = useMemo(() => {
    const ctx: { startX: number; startY: number } = { startX: 0, startY: 0 };
    return Gesture.Pan()
      .onStart(() => {
        'worklet';
        ctx.startX = xPx.value;
        ctx.startY = yPx.value;
      })
      .onChange((e) => {
        'worklet';
        const maxX = canvasW.value - RADIUS;
        const maxY = canvasH.value - RADIUS;
        xPx.value = clamp(ctx.startX + e.translationX, RADIUS, maxX);
        yPx.value = clamp(ctx.startY + e.translationY, RADIUS, maxY);
      })
      .onEnd(() => {
        'worklet';
        xPx.value = snap(xPx.value);
        yPx.value = snap(yPx.value);
        runOnJS(onCommit)(table.id, xPx.value / canvasW.value, yPx.value / canvasH.value);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.id, onCommit]);

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        'worklet';
        runOnJS(onSelect)();
      }),
    [onSelect]
  );

  const longPressGesture = useMemo(
    () =>
      Gesture.LongPress().onEnd(() => {
        'worklet';
        runOnJS(onEdit)();
      }),
    [onEdit]
  );

  const gesture = Gesture.Exclusive(longPressGesture, tapGesture, panGesture);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: xPx.value - RADIUS,
    top: yPx.value - RADIUS,
  }));

  const estado = table.estado ?? 'libre';
  const bgColor = selected
    ? colors.accent
    : estado === 'ocupada'
    ? colors.warning
    : estado === 'cuenta'
    ? colors.success
    : colors.accent;
  const borderColor = selected ? colors.textInverse : colors.bg;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, styles.tableCircle, { backgroundColor: bgColor, borderColor }]}>
        <Text style={[styles.tableLabel, { color: colors.textInverse }]}>{table.label ?? 'M'}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

function GridBackground({ color }: { color: string }) {
  const lines = Array.from({ length: 20 }, (_, i) => i);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {lines.map((i) => (
        <View key={`v-${i}`} style={[styles.gridLineV, { left: `${i * 5}%`, backgroundColor: color }]} />
      ))}
      {lines.map((i) => (
        <View key={`h-${i}`} style={[styles.gridLineH, { top: `${i * 5}%`, backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: { fontWeight: '600' },
  selectedBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedText: { fontWeight: '600' },
  canvasWrapper: { flex: 1, overflow: 'hidden' },
  canvasContent: { width: '100%', height: '100%' },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  tableCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 4,
  },
  tableLabel: { fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    marginBottom: 16,
  },
  templateRow: {
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
  },
});
