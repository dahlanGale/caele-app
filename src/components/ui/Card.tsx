import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

export function Card({ children, style, ...props }: ViewProps) {
  const { color, radius, shadow, space } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: color.bgElevated,
          borderColor: color.border,
          borderRadius: radius.md,
          padding: space[4],
          ...shadow.sm,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
