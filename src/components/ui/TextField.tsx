import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { fonts, layout, radius, space } from '@/theme';

type Props = TextInputProps & {
  compact?: boolean;
};

export function TextField({ compact, style, ...props }: Props) {
  const { colors } = useResolvedTheme();

  return (
    <TextInput
      placeholderTextColor={colors.muted}
      style={[
        styles.input,
        {
          color: colors.text,
          backgroundColor: colors.surface,
          borderColor: colors.line,
          minHeight: compact ? 40 : layout.minTap,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    fontFamily: fonts.body,
    fontSize: 16,
  },
});
