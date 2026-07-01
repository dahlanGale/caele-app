import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

type InputProps = TextInputProps & {
  icon?: React.ReactNode;
};

export function Input({ icon, style, ...props }: InputProps) {
  const { color, space, radius, font } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: color.bgSubtle,
          borderColor: color.border,
          borderRadius: radius.md,
          paddingHorizontal: space[3],
        },
      ]}
    >
      {icon}
      <TextInput
        placeholderTextColor={color.textMuted}
        accessibilityLabel={props.placeholder}
        style={[
          styles.input,
          {
            color: color.text,
            fontSize: font.size.base,
            marginLeft: icon ? space[2] : 0,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
});
