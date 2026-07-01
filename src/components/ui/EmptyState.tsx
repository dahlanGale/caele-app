import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

type EmptyStateProps = {
  icon?: string;
  title: string;
  subtitle?: string;
  variant?: 'default' | 'error';
};

export function EmptyState({
  icon = 'inbox-outline',
  title,
  subtitle,
  variant = 'default',
}: EmptyStateProps) {
  const { color, space, font } = useAppTheme();
  const iconColor = variant === 'error' ? color.danger : color.textMuted;

  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ''}`}>
      <MaterialCommunityIcons name={icon as any} size={48} color={iconColor} accessibilityElementsHidden />
      <Text
        style={[
          styles.title,
          { color: color.text, fontSize: font.size.md, marginTop: space[3] },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            { color: color.textMuted, fontSize: font.size.sm, marginTop: space[1] },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
