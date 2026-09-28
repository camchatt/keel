import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import type { Person } from '@/types';

type Props = {
  person: Person;
  size: number;
  onPress?: () => void;
};

export function AvatarBubble({ person, size, onPress }: Props) {
  const { colors } = useResolvedTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={person.name}
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `hsl(${person.hue}, 42%, 26%)`,
          borderColor: colors.surface,
        },
      ]}>
      <AppText variant="bodyBold" style={{ fontSize: size * 0.32, color: colors.surface, letterSpacing: 0.4 }}>
        {person.initials}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});
