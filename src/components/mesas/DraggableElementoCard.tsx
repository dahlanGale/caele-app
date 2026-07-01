import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ElementoCard } from './ElementoCard';

import type { Elemento } from '@/src/types';

type Props = {
  elemento: Elemento;
  size: number;
  cellSize: number;
  gap: number;
  onDragEnd?: (targetRow: number, targetCol: number) => void;
  selected?: boolean;
};

export function DraggableElementoCard({ elemento, size, cellSize, gap, onDragEnd, selected }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    zIndex: 100,
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      const deltaCol = Math.round(translateX.value / (cellSize + gap));
      const deltaRow = Math.round(translateY.value / (cellSize + gap));
      const targetCol = Math.max(0, elemento.columna + deltaCol);
      const targetRow = Math.max(0, elemento.fila + deltaRow);
      translateX.value = 0;
      translateY.value = 0;
      if ((targetRow !== elemento.fila || targetCol !== elemento.columna) && onDragEnd) {
        runOnJS(onDragEnd)(targetRow, targetCol);
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.wrapper, animatedStyle]}>
        <ElementoCard
          elemento={elemento}
          size={size}
          selected={selected}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
});
