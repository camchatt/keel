import { Platform, StyleSheet, useWindowDimensions, View, type ViewProps } from 'react-native';

import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { layout, radius } from '@/theme';

export function AppShell({ children, style, ...props }: ViewProps) {
  const { colors } = useResolvedTheme();
  const { width } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width > 560;

  return (
    <View style={[styles.canvas, { backgroundColor: colors.webCanvas }]} {...props}>
      <View
        style={[
          styles.frame,
          {
            backgroundColor: colors.background,
            maxWidth: Platform.OS === 'web' ? layout.maxWidth : undefined,
            alignSelf: 'center',
            borderRadius: framed ? radius.lg : 0,
            marginVertical: framed ? 16 : 0,
            maxHeight: framed ? '96%' : '100%',
            overflow: framed ? 'hidden' : 'visible',
            boxShadow: framed ? '0 16px 48px rgba(0, 0, 0, 0.28)' : undefined,
          },
          style,
        ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
  },
});
