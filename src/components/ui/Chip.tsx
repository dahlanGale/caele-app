import React from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    type PressableProps,
    type PressableStateCallbackType,
} from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

type ChipProps = Omit<PressableProps, 'style'> & {
  label: string;
  active?: boolean;
  style?: PressableProps['style'];
};

export function Chip({ label, active, style, ...props }: ChipProps) {
  const { color, space, radius, font } = useAppTheme();

  return (
    <Pressable
      style={({ pressed }) => {
        const base = {
          backgroundColor: active ? color.accent : color.accentSoft,
          borderColor: active ? color.accent : color.border,
          borderRadius: radius.full,
          paddingHorizontal: space[4],
          paddingVertical: space[3],
          opacity: pressed ? 0.8 : 1,
        };
        if (typeof style === 'function') {
          const state: PressableStateCallbackType = { pressed, hovered: false };
          return [styles.chip, base, style(state)];
        }
        return [styles.chip, base, style];
      }}
      {...props}
    >
      <Text
        style={{
          color: active ? color.accentText : color.text,
          fontSize: font.size.sm,
          fontWeight: font.weight.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
});
