import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
};

export function Button({
  title,
  variant = 'primary',
  loading,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { color, space, radius, font } = useAppTheme();

  const isDisabled = disabled || loading;

  const background =
    variant === 'primary'
      ? color.accent
      : variant === 'danger'
        ? color.danger
        : 'transparent';
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? color.textInverse
      : variant === 'ghost'
        ? color.textMuted
        : color.text;
  const borderColor =
    variant === 'outline'
      ? color.border
      : variant === 'ghost'
        ? 'transparent'
        : color.border;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: borderColor,
          borderWidth: variant === 'primary' || variant === 'danger' ? 0 : 1,
          borderRadius: radius.md,
          paddingHorizontal: space[5],
          paddingVertical: space[4],
          opacity: isDisabled ? 0.6 : pressed ? 0.9 : 1,
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize: font.size.base,
                fontWeight: font.weight.semibold,
                marginLeft: icon ? space[2] : 0,
              },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    lineHeight: 24,
  },
});
