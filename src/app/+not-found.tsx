import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { space } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <AppText variant="display">Not found</AppText>
        <Link href="/" style={styles.link}>
          <AppText variant="bodyBold" tone="action">
            Circles
          </AppText>
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    marginTop: space.sm,
  },
});
