import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
    Easing,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/src/theme/ThemeProvider';

export function Skeleton({ style, ...props }: ViewProps) {
  const { color, radius } = useAppTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [color.borderSubtle, color.border]
    ),
  }));

  return (
    <Animated.View
      accessibilityLabel="Cargando"
      accessibilityRole="progressbar"
      style={[
        {
          borderRadius: radius.sm,
          overflow: 'hidden',
        },
        animatedStyle,
        style,
      ]}
      {...props}
    />
  );
}

export function SkeletonRow({ count = 4 }: { count?: number }) {
  const { space } = useAppTheme();
  return (
    <View style={{ gap: space[3] }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} style={{ height: 48, width: '100%' }} />
      ))}
    </View>
  );
}
