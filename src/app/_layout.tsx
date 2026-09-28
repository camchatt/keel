import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppShell } from '@/components/layout/AppShell';
import { useAutoSplitRequests } from '@/hooks/useAutoSplitRequests';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { KeelProvider } from '@/store/keel-store';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeelProvider>
        <RootLayoutNav />
      </KeelProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { name, colors } = useResolvedTheme();
  useAutoSplitRequests();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Platform.OS === 'web' ? colors.webCanvas : colors.background);
  }, [colors.background, colors.webCanvas]);

  return (
    <AppShell>
      <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
