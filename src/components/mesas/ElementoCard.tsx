import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Elemento, ElementoEstado } from '@/src/types';

const ESTADO_COLORS: Record<ElementoEstado, keyof ReturnType<typeof useAppTheme>['color']> = {
  disponible: 'success',
  ocupada: 'danger',
  reservada: 'warning',
  cuenta: 'accent',
};

const ESTADO_LABELS: Record<ElementoEstado, string> = {
  disponible: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  cuenta: 'Cuenta',
};

type Props = {
  elemento: Elemento;
  size?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
};

export function ElementoCard({ elemento, size = 72, onPress, onLongPress, selected, disabled }: Props) {
  const { color, font, radius, space } = useAppTheme();
  const estado = elemento.estado ?? 'disponible';
  const estadoColor = color[ESTADO_COLORS[estado]];
  const isMesa = elemento.tipo === 'mesa';

  const shapeStyle =
    elemento.forma === 'redonda'
      ? { borderRadius: size / 2 }
      : elemento.forma === 'rectangular' || elemento.forma === 'barra'
      ? { borderRadius: radius.sm, width: size * (elemento.ancho ?? 1.5) }
      : { borderRadius: radius.md };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${elemento.nombre}, ${ESTADO_LABELS[estado]}`}
      style={[
        styles.card,
        {
          width: size,
          height: size,
          backgroundColor: isMesa ? color.bgElevated : 'transparent',
          borderColor: selected ? color.accent : estadoColor,
          borderWidth: selected ? 3 : isMesa ? 2 : 0,
        },
        shapeStyle,
      ]}
    >
      {isMesa ? (
        <>
          <View style={[styles.statusDot, { backgroundColor: estadoColor }]} />
          <Text style={[styles.label, { color: color.text, fontSize: font.size.base, fontWeight: font.weight.semibold }]}>
            {elemento.nombre}
          </Text>
          {elemento.capacidad ? (
            <Text style={[styles.capacity, { color: color.textMuted, fontSize: font.size.xs }]}>{elemento.capacidad}p</Text>
          ) : null}
        </>
      ) : elemento.tipo === 'entrada' ? (
        <View style={{ alignItems: 'center', gap: space[1] }}>
          <MaterialCommunityIcons name="door-open" size={24} color={color.textMuted} />
          <Text style={[styles.label, { color: color.textMuted, fontSize: font.size.xs }]}>{elemento.nombre}</Text>
        </View>
      ) : elemento.tipo === 'decoracion' ? (
        <MaterialCommunityIcons name="flower" size={24} color={color.textMuted} />
      ) : (
        <Text style={[styles.label, { color: color.textMuted, fontSize: font.size.sm }]}>{elemento.nombre}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  statusDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    textAlign: 'center',
  },
  capacity: {
    marginTop: 2,
  },
});
