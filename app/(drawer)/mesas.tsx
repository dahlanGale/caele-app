import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import FirestoreRestaurante from '../../firebase/FirestoreRestaurante';

type TableItem = {
  id: string;
  x: number; // normalizado [0..1]
  y: number; // normalizado [0..1]
  label?: string;
  shape?: 'circle' | 'rect';
};

function clamp(n: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, n));
}

const GRID = 16; // px para snap opcional
const snap = (v: number) => Math.round(v / GRID) * GRID;

export default function RestaurantSandbox() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [sizeVersion, setSizeVersion] = useState(0); // para recalcular posiciones al cambiar tamaño

  // Tamaño del canvas
  const canvasW = useSharedValue(1);
  const canvasH = useSharedValue(1);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    canvasW.value = width;
    canvasH.value = height;
    setSizeVersion((v) => v + 1);
  };

  // Tap para añadir mesa cuando addMode = true
  const tapToAdd = useMemo(
    () =>
      Gesture.Tap().onEnd((e) => {
        'worklet';
        if (!addMode) return;

        const worldX = e.x;
        const worldY = e.y;

        const nx = clamp(worldX / canvasW.value, 0, 1);
        const ny = clamp(worldY / canvasH.value, 0, 1);

        runOnJS(setTables)((prev) => {
          const base = Array.isArray(prev) ? prev : [];
          return [
            ...base,
            {
              id: Math.random().toString(36).slice(2),
              x: nx,
              y: ny,
              label: String(base.length + 1),
              shape: 'circle',
            },
          ];
        });
      }),
    [addMode]
  );

  const canvasStyle = useAnimatedStyle(() => ({}));

  const handleCommitTable = useCallback((id: string, nx: number, ny: number) => {
    try {
      setTables((prev) => prev.map((t) => (t.id === id ? { ...t, x: nx, y: ny } : t)));
    } catch (err) {
      console.error('mesas.handleCommitTable error', { id, nx, ny, err });
    }
  }, []);

  const handleSave = useCallback(async () => {
    console.log('mesas.handleSave', { tables });
    try {
      await FirestoreRestaurante.guardarMesas('sala-principal', tables);
    } catch (err) {
      console.error('mesas.handleSave error', { tables, err });
    }
  }, [tables]);

  const handleLoad = useCallback(async () => {
    try {
      console.log('mesas.handleLoad');
      const data = await FirestoreRestaurante.cargarMesas('sala-principal');
      if (data?.length) setTables(data as TableItem[]);
    } catch (err) {
      console.error('mesas.handleLoad error', err);
    }
  }, []);

  return (
    <View style={styles.screen}>
      {/* Barra superior */}
      <View style={styles.toolbar}>
        <Pressable
          style={[styles.btn, addMode && styles.btnActive]}
          onPress={() => setAddMode((v) => !v)}
        >
          <Text style={styles.btnText}>{addMode ? 'Toque para colocar' : 'Agregar mesa'}</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={() => setTables([])}>
          <Text style={styles.btnText}>Limpiar</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={handleSave}>
          <Text style={styles.btnText}>Guardar (Firestore)</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={handleLoad}>
          <Text style={styles.btnText}>Cargar (Firestore)</Text>
        </Pressable>
      </View>

      {/* Canvas: solo tap para colocar */}
      <GestureDetector gesture={tapToAdd}>
        <View style={styles.canvasWrapper} onLayout={onLayout} collapsable={false}>
          <Animated.View style={[styles.canvasContent, canvasStyle]}>
            <GridBackground />
            {Array.isArray(tables) && tables.map((t) => (
              <DraggableTable
                key={t.id}
                table={t}
                canvasW={canvasW}
                canvasH={canvasH}
                sizeVersion={sizeVersion}
                onCommit={handleCommitTable}
              />
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

function DraggableTable({
  table,
  canvasW,
  canvasH,
  sizeVersion,
  onCommit,
}: {
  table: TableItem;
  canvasW: Animated.SharedValue<number>;
  canvasH: Animated.SharedValue<number>;
  sizeVersion: number;
  onCommit: (id: string, nx: number, ny: number) => void;
}) {
  const RADIUS = 28; // px radio del círculo

  const xPx = useSharedValue(table.x * canvasW.value);
  const yPx = useSharedValue(table.y * canvasH.value);

  useEffect(() => {
    xPx.value = table.x * canvasW.value;
    yPx.value = table.y * canvasH.value;
  }, [table.x, table.y, sizeVersion]);

  const gesture = useMemo(() => {
    const ctx: { startX: number; startY: number } = { startX: 0, startY: 0 };

    return Gesture.Pan()
      .onStart(() => {
        'worklet';
        ctx.startX = xPx.value;
        ctx.startY = yPx.value;
      })
      .onChange((e) => {
        'worklet';
        const dx = e.translationX;
        const dy = e.translationY;

        const maxX = canvasW.value - RADIUS;
        const maxY = canvasH.value - RADIUS;

        xPx.value = clamp(ctx.startX + dx, RADIUS, maxX);
        yPx.value = clamp(ctx.startY + dy, RADIUS, maxY);
      })
      .onEnd(() => {
        'worklet';
        xPx.value = snap(xPx.value);
        yPx.value = snap(yPx.value);

        const nx = xPx.value / canvasW.value;
        const ny = yPx.value / canvasH.value;
        runOnJS(onCommit)(table.id, nx, ny);
        console.log('mesas.DraggableTable.onEnd', { id: table.id, nx, ny });
      });
  }, [table.id]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: xPx.value - RADIUS,
    top: yPx.value - RADIUS,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, styles.tableCircle]}>
        <Text style={styles.tableLabel}>{table.label ?? 'M'}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

function GridBackground() {
  const lines = Array.from({ length: 20 }, (_, i) => i);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {lines.map((i) => (
        <View key={`v-${i}`} style={[styles.gridLineV, { left: `${i * 5}%` }]} />
      ))}
      {lines.map((i) => (
        <View key={`h-${i}`} style={[styles.gridLineH, { top: `${i * 5}%` }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0d12' },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 12,
    backgroundColor: '#12151c',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#233047',
  },
  btnActive: { backgroundColor: '#2f6fed' },
  btnText: { color: 'white', fontWeight: '600' },

  canvasWrapper: { flex: 1, overflow: 'hidden' },
  canvasContent: { width: '100%', height: '100%' },

  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  tableCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#39b8ff',
    borderWidth: 2,
    borderColor: '#0b0d12',
    elevation: 4,
  },
  tableLabel: { color: '#0b0d12', fontWeight: '700' },
});
