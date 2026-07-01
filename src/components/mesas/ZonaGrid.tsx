import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ElementoCard } from './ElementoCard';

import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Elemento, Zona } from '@/src/types';

const COLS = 6;

function positionIndex(elemento: Elemento) {
  return elemento.fila * COLS + elemento.columna;
}

function buildRows(elementos: Elemento[]) {
  const rows = new Map<number, Elemento[]>();
  const sorted = [...elementos].sort((a, b) => positionIndex(a) - positionIndex(b));
  sorted.forEach((el) => {
    const list = rows.get(el.fila) ?? [];
    list.push(el);
    rows.set(el.fila, list);
  });
  return Array.from(rows.entries())
    .sort(([a], [b]) => a - b)
    .map(([, els]) => els);
}

type Props = {
  zona: Zona & { elementos: Elemento[] };
  onElementoPress?: (elemento: Elemento) => void;
  onElementoLongPress?: (elemento: Elemento) => void;
  selectedId?: string | null;
};

export function ZonaGrid({ zona, onElementoPress, onElementoLongPress, selectedId }: Props) {
  const { color, font, space, radius } = useAppTheme();
  const rows = useMemo(() => buildRows(zona.elementos), [zona.elementos]);

  return (
    <View style={[styles.section, { backgroundColor: color.bgElevated, borderRadius: radius.lg, marginBottom: space[4] }]}>
      <Text style={[styles.title, { color: color.text, fontSize: font.size.md, fontWeight: font.weight.bold, margin: space[4] }]}>
        {zona.nombre}
      </Text>
      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: color.textMuted, margin: space[4] }]}>Sin mesas en esta zona</Text>
      ) : (
        <View style={[styles.grid, { padding: space[4], paddingTop: 0 }]}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={[styles.row, { gap: space[2] }]}>
              {row.map((el) => (
                <ElementoCard
                  key={el.id}
                  elemento={el}
                  selected={selectedId === el.id}
                  onPress={() => onElementoPress?.(el)}
                  onLongPress={() => onElementoLongPress?.(el)}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    overflow: 'hidden',
  },
  title: {
    marginBottom: 4,
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  empty: {
    fontStyle: 'italic',
  },
});
