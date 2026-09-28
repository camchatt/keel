import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ServiceMark } from '@/components/teams/ServiceMark';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { accessFieldLabels, accessHeading, emptyDetails } from '@/lib/access';
import type { CircleItem } from '@/lib/circle';
import { radius, space } from '@/theme';
import type { ShareDetails, Team } from '@/types';

type Props = {
  open: boolean;
  team?: Team;
  item?: CircleItem;
  onClose: () => void;
  onChangeDetails: (itemId: string, details: ShareDetails) => void;
};

export function AccessSheet({ open, team, item, onClose, onChangeDetails }: Props) {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const labels = item ? accessFieldLabels(item) : null;
  const [login, setLogin] = useState('');
  const [secret, setSecret] = useState('');
  const [extra, setExtra] = useState('');

  useEffect(() => {
    if (!open || !item || !team) return;
    const saved = team.detailsById?.[item.id] ?? emptyDetails();
    setLogin(saved.login);
    setSecret(item.kind === 'discount' ? item.discount.code : saved.password);
    setExtra(saved.extra);
  }, [open, item?.id, team?.id]);

  const saveDetails = (next: Partial<ShareDetails> & { secret?: string }) => {
    if (!item) return;
    const nextLogin = next.login ?? login;
    const nextSecret = next.secret ?? secret;
    const nextExtra = next.extra ?? extra;
    setLogin(nextLogin);
    setSecret(nextSecret);
    setExtra(nextExtra);
    onChangeDetails(item.id, { login: nextLogin, password: nextSecret, extra: nextExtra });
  };

  return (
    <Modal visible={open && Boolean(item)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoid}>
          <Pressable
            onPress={() => undefined}
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                borderColor: colors.line,
                paddingBottom: Math.max(insets.bottom, space.lg),
              },
            ]}>
            <View style={[styles.handleBar, { backgroundColor: colors.line }]} />
            <View style={styles.head}>
              {item?.kind === 'service' ? <ServiceMark service={item.service} size={40} round /> : null}
              <View style={styles.headCopy}>
                <AppText variant="title" numberOfLines={1}>
                  {item?.name ?? 'Service'}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {item ? accessHeading(item) : ''}
                </AppText>
              </View>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}>
              {labels ? (
                <View style={styles.block}>
                  <TextField
                    compact
                    value={login}
                    onChangeText={(value) => saveDetails({ login: value })}
                    placeholder={labels.login}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextField
                    compact
                    value={secret}
                    onChangeText={(value) => saveDetails({ secret: value })}
                    placeholder={labels.secret}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={labels.secretLocked}
                  />
                  {labels.extra ? (
                    <TextField
                      compact
                      value={extra}
                      onChangeText={(value) => saveDetails({ extra: value })}
                      placeholder={labels.extra}
                      autoCapitalize="none"
                    />
                  ) : null}
                </View>
              ) : null}
              <Button label="Close" variant="ghost" onPress={onClose} />
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14, 20, 18, 0.46)',
  },
  avoid: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    maxHeight: '88%',
    gap: space.md,
  },
  handleBar: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  body: {
    gap: space.md,
    paddingBottom: space.md,
  },
  block: {
    gap: space.sm,
  },
});
