import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { tapLight } from '@/lib/haptics';
import { layout, radius, space } from '@/theme';

import { AppText } from './AppText';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'ghost' | 'danger';
};

export function Button({ label, variant = 'primary', onPress, style, disabled, ...props }: Props) {
  const { colors } = useResolvedTheme();
  const background =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.action : 'transparent';
  const color = variant === 'ghost' ? colors.accent : colors.background;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={(event) => {
        tapLight();
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background, borderColor: colors.line, opacity: disabled ? 0.38 : pressed ? 0.82 : 1 },
        variant === 'ghost' ? styles.ghost : undefined,
        style as StyleProp<ViewStyle>,
      ]}
      {...props}>
      <AppText variant="bodyBold" style={{ color: variant === 'ghost' ? colors.accent : color }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTap,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  ghost: {
    borderWidth: 1,
  },
});
