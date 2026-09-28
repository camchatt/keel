import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ServicesView } from '@/components/teams/ServicesView';
import { SourcesView } from '@/components/teams/SourcesView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { tapLight } from '@/lib/haptics';
import { radius, space } from '@/theme';
import type { DiscountCode, Team } from '@/types';

type Step = 'group' | 'hub' | 'services' | 'sources';

type Props = {
  open: boolean;
  team?: Team;
  onClose: () => void;
  onSaveGroup: (name: string, description: string) => void;
  onSaveServices: (serviceIds: string[], discountCodes: DiscountCode[]) => void;
  onSaveSources: (sourceIds: string[], links: Record<string, string>) => void;
};

function sourceLinks(team?: Team): Record<string, string> {
  const links: Record<string, string> = {};
  for (const id of team?.sourceIds ?? []) {
    const extra = team?.detailsById?.[id]?.extra?.trim();
    if (extra) links[id] = extra;
  }
  return links;
}

export function CircleSetup({ open, team, onClose, onSaveGroup, onSaveServices, onSaveSources }: Props) {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const named = Boolean(team?.name.trim() || team?.description.trim());
  const [step, setStep] = useState<Step>('group');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(team?.name ?? '');
    setDescription(team?.description ?? '');
    setStep(named ? 'hub' : 'group');
  }, [open, team?.id]);

  const goHub = () => {
    tapLight();
    onSaveGroup(name.trim(), description.trim());
    setStep('hub');
  };

  if (step === 'services') {
    return (
      <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setStep('hub')}>
        <ServicesView
          selectedIds={team?.serviceIds ?? []}
          discountCodes={team?.discountCodes ?? []}
          onBack={() => setStep('hub')}
          onSave={(serviceIds, discountCodes) => {
            onSaveServices(serviceIds, discountCodes);
            setStep('hub');
          }}
        />
      </Modal>
    );
  }

  if (step === 'sources') {
    return (
      <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setStep('hub')}>
        <SourcesView
          selectedIds={team?.sourceIds ?? []}
          links={sourceLinks(team)}
          onBack={() => setStep('hub')}
          onSave={(sourceIds, links) => {
            onSaveSources(sourceIds, links);
            setStep('hub');
          }}
        />
      </Modal>
    );
  }

  const serviceCount = (team?.serviceIds.length ?? 0) + (team?.discountCodes.filter((item) => item.place.trim() || item.code.trim()).length ?? 0);
  const sourceCount = team?.sourceIds.length ?? 0;

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.screen, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, space.lg) }]}>
        {step === 'group' ? (
          <>
            <View style={styles.top}>
              <AppText variant="display">Circle</AppText>
            </View>
            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.block}>
                <AppText variant="overline" tone="muted">
                  Name
                </AppText>
                <TextField
                  value={name}
                  onChangeText={setName}
                  placeholder="Sunday watch, Launch, League night"
                  autoCapitalize="words"
                  autoFocus={!named}
                />
              </View>
              <View style={styles.block}>
                <AppText variant="overline" tone="muted">
                  Description
                </AppText>
                <TextField
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What this crew is working toward."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={styles.bio}
                />
              </View>
            </ScrollView>
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.line,
                  backgroundColor: colors.background,
                  paddingBottom: Math.max(insets.bottom, space.lg),
                },
              ]}>
              <View style={styles.footerRow}>
                <Button label="Close" variant="ghost" onPress={onClose} style={styles.footerBtn} />
                <Button
                  label="Continue"
                  onPress={goHub}
                  disabled={!name.trim()}
                  style={styles.footerBtn}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.top}>
              <AppText variant="display">{name.trim() || team?.name.trim() || 'Circle'}</AppText>
            </View>
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              <HubCard
                title="Name"
                detail={name.trim() || 'Untitled'}
                onPress={() => {
                  tapLight();
                  setStep('group');
                }}
              />
              <HubCard
                title="Services"
                detail={serviceCount ? `${serviceCount}` : 'None'}
                onPress={() => {
                  tapLight();
                  setStep('services');
                }}
              />
              <HubCard
                title="Sources"
                detail={sourceCount ? `${sourceCount}` : 'None'}
                onPress={() => {
                  tapLight();
                  setStep('sources');
                }}
              />
            </ScrollView>
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.line,
                  backgroundColor: colors.background,
                  paddingBottom: Math.max(insets.bottom, space.lg),
                },
              ]}>
              <AppText variant="caption" tone="muted">
                You can add people from the circle after this.
              </AppText>
              <Button label="Done" onPress={onClose} />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function HubCard({
  title,
  detail,
  onPress,
}: {
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const { colors } = useResolvedTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.cardCopy}>
        <AppText variant="bodyBold">{title}</AppText>
        <AppText variant="caption" tone="muted">
          {detail}
        </AppText>
      </View>
      <AppText variant="title" tone="muted">
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  top: {
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
    gap: space.sm,
  },
  body: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.lg,
  },
  block: {
    gap: space.sm,
  },
  bio: {
    minHeight: 120,
    paddingTop: space.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  footerBtn: {
    flex: 1,
  },
});
