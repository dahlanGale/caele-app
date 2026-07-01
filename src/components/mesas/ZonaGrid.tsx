import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ElementoCard } from './ElementoCard';

import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Elemento, Zona } from '@/src/types';

const COLS = 8;
const GAP = 8;

function buildGrid(elementos: Elemento[]) {
  const byPosition = new Map<string, Elemento>();
  const spans = new Map<string, string>();
  elementos.forEach((el) => {
    byPosition.set(`${el.fila},${el.columna}`, el);
    if ((el.ancho ?? 1) > 1) {
      for (let i = 1; i < (el.ancho ?? 1); i++) {
        spans.set(`${el.fila},${el.columna + i}`, el.id);
      }
    }
  });
  const maxRow = Math.max(-1, ...elementos.map((e) => e.fila));
  const rows = [];
  for (let r = 0; r <= maxRow; r++) {
    const cells = [];
    for (let c = 0; c < COLS; c++) {
      const spanOwner = spans.get(`${r},${c}`);
      if (spanOwner) {
        cells.push({ type: 'span' as const, ownerId: spanOwner });
      } else {
        const el = byPosition.get(`${r},${c}`);
        cells.push({ type: 'element' as const, elemento: el });
      }
    }
    rows.push(cells);
  }
  return rows;
}

type Props = {
  zona: Zona & { elementos: Elemento[] };
  onElementoPress?: (elemento: Elemento) => void;
  onElementoLongPress?: (elemento: Elemento) => void;
  selectedId?: string | null;
};

export function ZonaGrid({ zona, onElementoPress, onElementoLongPress, selectedId }: Props) {
  const { color, font, space, radius } = useAppTheme();
  const { width } = useWindowDimensions();
  const rows = useMemo(() => buildGrid(zona.elementos), [zona.elementos]);
  const containerPadding = space[4] * 2;
  const cellSize = Math.min(96, (width - containerPadding - GAP * (COLS - 1)) / COLS);

  return (
    <View style={[styles.section, { backgroundColor: color.bgElevated, borderRadius: radius.lg, marginBottom: space[4] }]}>
      <Text style={[styles.title, { color: color.text, fontSize: font.size.md, fontWeight: font.weight.bold, margin: space[4] }]}>
        {zona.nombre}
      </Text>
      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: color.textMuted, margin: space[4] }]}>Sin mesas en esta zona</Text>
      ) : (
        <View style={[styles.grid, { padding: space[4], paddingTop: 0, gap: GAP }]}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={[styles.row, { gap: GAP }]}>
              {row.map((cell, colIdx) => {
                if (cell.type === 'span') {
                  return <View key={colIdx} style={{ width: cellSize, height: cellSize }} />;
                }
                if (!cell.elemento) {
                  return <View key={colIdx} style={[styles.emptyCell, { width: cellSize, height: cellSize, borderColor: color.borderSubtle }]} />;
                }
                const el = cell.elemento;
                const ancho = el.ancho ?? 1;
                const widthStyle = ancho > 1 ? cellSize * ancho + GAP * (ancho - 1) : cellSize;
                return (
                  <ElementoCard
                    key={colIdx}
                    elemento={el}
                    size={cellSize}
                    width={widthStyle}
                    selected={selectedId === el.id}
                    onPress={() => onElementoPress?.(el)}
                    onLongPress={() => onElementoLongPress?.(el)}
                  />
                );
              })}
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
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emptyCell: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  empty: {
    fontStyle: 'italic',
  },
});
