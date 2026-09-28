import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarBubble } from '@/components/teams/AvatarBubble';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { venmoTag } from '@/lib/pay';
import { formatRequestOn, intervalCadence, money } from '@/lib/split';
import { radius, space } from '@/theme';
import type { PaymentRoute, Person, SplitInterval } from '@/types';

type Props = {
  open: boolean;
  person?: Person;
  splitting?: boolean;
  share?: number;
  nextAt?: string;
  interval?: SplitInterval;
  route?: PaymentRoute;
  onClose: () => void;
  onChangeVenmo: (handle: string) => void;
  onRemove: () => void;
};

export function PersonCard({
  open,
  person,
  splitting = false,
  share = 0,
  nextAt,
  interval = 'monthly',
  route = 'none',
  onClose,
  onChangeVenmo,
  onRemove,
}: Props) {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const joined = person?.joinedAt ? formatRequestOn(person.joinedAt) : undefined;
  const nextOn = formatRequestOn(nextAt);
  const tag = venmoTag(person?.venmo);
  const venmo = route === 'venmo';
  const meta = [
    joined,
    splitting && share > 0 ? `${money(share)} ${intervalCadence(interval)}` : undefined,
    nextOn,
    venmo ? tag ?? 'Venmo needed' : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Modal visible={open && Boolean(person)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => undefined}
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: colors.line,
              marginBottom: Math.max(insets.bottom, space.lg),
            },
          ]}>
          <View style={styles.who}>
            {person ? <AvatarBubble person={person} size={40} /> : null}
            <View style={styles.whoCopy}>
              <AppText variant="title" numberOfLines={1}>
                {person?.name.trim() || 'Someone'}
              </AppText>
              {meta ? (
                <AppText variant="caption" tone="muted" numberOfLines={2}>
                  {meta}
                </AppText>
              ) : null}
            </View>
          </View>
          {splitting && venmo ? (
            <TextField
              compact
              value={person?.venmo ?? ''}
              onChangeText={onChangeVenmo}
              placeholder="@handle"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
            />
          ) : null}
          <Button label="Remove" variant="danger" onPress={onRemove} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 20, 18, 0.46)',
    paddingHorizontal: space.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  whoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
