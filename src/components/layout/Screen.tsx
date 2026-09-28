import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { space } from '@/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = true }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useResolvedTheme();
  const padding = {
    paddingTop: Math.max(insets.top, space.lg),
    paddingLeft: Math.max(insets.left, space.lg),
    paddingRight: Math.max(insets.right, space.lg),
    paddingBottom: space.xl,
  };

  if (!scroll) {
    return <View style={[styles.screen, { backgroundColor: colors.background }, padding]}>{children}</View>;
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, padding]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: space.xl,
  },
});
