import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { space } from '@/theme';

type Props = {
  title: string;
  detail?: string;
};

export function Header({ title, detail }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText variant="display">{title}</AppText>
      {detail ? (
        <AppText variant="caption" tone="muted">
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
    paddingTop: space.xs,
    paddingBottom: space.sm,
  },
});
