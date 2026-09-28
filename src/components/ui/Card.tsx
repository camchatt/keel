import { View, type ViewProps } from 'react-native';

import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { radius, space } from '@/theme';

export function Card({ style, ...props }: ViewProps) {
  const { colors } = useResolvedTheme();

  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: radius.md,
          padding: space.lg,
        },
        style,
      ]}
    />
  );
}
