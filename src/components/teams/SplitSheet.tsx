import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarBubble } from '@/components/teams/AvatarBubble';
import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import { catalogMonthly } from '@/data/services';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { tapLight } from '@/lib/haptics';
import { PAYMENT_OPTIONS, venmoTag } from '@/lib/pay';
import {
  defaultSplit,
  formatRequestOn,
  INTERVAL_OPTIONS,
  intervalCadence,
  intervalTotalLabel,
  money,
  nextRequestAt,
  shareAmount,
} from '@/lib/split';
import { radius, space } from '@/theme';
import type { CircleSplit, PaymentRoute, Person, SplitInterval, Team } from '@/types';

type Props = {
  open: boolean;
  team?: Team;
  onClose: () => void;
  onChange: (split: CircleSplit) => void;
  onChangeVenmo: (personId: string, handle: string) => void;
};

export function SplitSheet({ open, team, onClose, onChange, onChangeVenmo }: Props) {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const split = team?.split ?? defaultSplit();
  const members = team?.members.length ?? 0;
  const catalog = catalogMonthly(team?.serviceIds ?? []);
  const [totalText, setTotalText] = useState('');
  const total = split.total !== undefined ? split.total : catalog;
  const share = shareAmount(total, split.ways);
  const splitting = split.mode === 'equal';
  const routeLabel = PAYMENT_OPTIONS.find((item) => item.id === split.route)?.label ?? 'None';
  const nextOn = formatRequestOn(split.nextAt);

  useEffect(() => {
    if (!open) return;
    setTotalText(split.total !== undefined ? String(split.total) : catalog > 0 ? catalog.toFixed(2) : '');
  }, [open, team?.id]);

  const patch = (next: Partial<CircleSplit>) => onChange({ ...split, ...next });

  const setMode = (mode: CircleSplit['mode']) => {
    tapLight();
    patch({
      mode,
      ways: mode === 'equal' ? Math.max(members, 2) : split.ways,
      nextAt:
        mode === 'equal' && split.route !== 'none'
          ? split.nextAt ?? nextRequestAt(new Date(), split.interval).toISOString()
          : split.nextAt,
    });
  };

  const setWays = (ways: number) => {
    tapLight();
    patch({ ways: Math.min(12, Math.max(2, ways)) });
  };

  const setRoute = (route: PaymentRoute) => {
    tapLight();
    patch({
      route,
      nextAt: route === 'none' ? undefined : split.nextAt ?? nextRequestAt(new Date(), split.interval).toISOString(),
    });
  };

  const chooseInterval = (interval: SplitInterval) => {
    tapLight();
    patch({
      interval,
      nextAt: split.route === 'none' ? undefined : nextRequestAt(new Date(), interval).toISOString(),
    });
  };

  const commitTotal = (raw: string) => {
    const parsed = Number.parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (!raw.trim()) {
      patch({ total: undefined });
      return;
    }
    if (!Number.isFinite(parsed) || parsed < 0) return;
    patch({ total: Math.round(parsed * 100) / 100 });
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
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
            <AppText variant="title">{team?.name.trim() || 'Split'}</AppText>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}>
              <View style={styles.row}>
                <Chip label="Off" active={!splitting} onPress={() => setMode('none')} />
                <Chip
                  label={splitting ? `${split.ways} ways` : 'Split'}
                  active={splitting}
                  onPress={() => setMode('equal')}
                />
              </View>
              <View style={styles.block}>
                <AppText variant="overline" tone="muted">
                  {splitting ? intervalTotalLabel(split.interval) : 'Total'}
                </AppText>
                <TextField
                  compact
                  value={totalText}
                  onChangeText={(value) => {
                    setTotalText(value);
                    commitTotal(value);
                  }}
                  placeholder={catalog > 0 ? catalog.toFixed(2) : '0.00'}
                  keyboardType="decimal-pad"
                />
              </View>
              {splitting ? (
                <>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => setWays(split.ways - 1)}
                      accessibilityRole="button"
                      accessibilityLabel="Fewer people"
                      style={[styles.step, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                      <AppText variant="title">−</AppText>
                    </Pressable>
                    <AppText variant="title">{split.ways}</AppText>
                    <Pressable
                      onPress={() => setWays(split.ways + 1)}
                      accessibilityRole="button"
                      accessibilityLabel="More people"
                      style={[styles.step, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                      <AppText variant="title">+</AppText>
                    </Pressable>
                  </View>
                  <View style={[styles.shareCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                    <AppText variant="title">{total > 0 ? money(share) : '—'}</AppText>
                    <AppText variant="caption" tone="muted">
                      each · {money(total)} {intervalCadence(split.interval)}
                    </AppText>
                  </View>
                  <View style={styles.wrap}>
                    {PAYMENT_OPTIONS.map((option) => (
                      <Chip
                        key={option.id}
                        label={option.label}
                        active={split.route === option.id}
                        onPress={() => setRoute(option.id)}
                      />
                    ))}
                  </View>
                  {split.route !== 'none' ? (
                    <View style={styles.block}>
                      <View style={styles.wrap}>
                        {INTERVAL_OPTIONS.map((option) => (
                          <Chip
                            key={option.id}
                            label={option.label}
                            active={split.interval === option.id}
                            onPress={() => chooseInterval(option.id)}
                          />
                        ))}
                      </View>
                      {split.route === 'venmo' ? (
                        <VenmoFlow
                          people={team?.members ?? []}
                          share={share}
                          nextOn={nextOn}
                          onChangeVenmo={onChangeVenmo}
                        />
                      ) : (
                        <AppText variant="caption" tone="muted">
                          {routeLabel} · {money(share)} {intervalCadence(split.interval)}
                          {nextOn ? ` · ${nextOn}` : ''}
                        </AppText>
                      )}
                    </View>
                  ) : null}
                </>
              ) : null}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function VenmoFlow({
  people,
  share,
  nextOn,
  onChangeVenmo,
}: {
  people: Person[];
  share: number;
  nextOn?: string;
  onChangeVenmo: (personId: string, handle: string) => void;
}) {
  const { colors } = useResolvedTheme();
  const connected = people.filter((person) => venmoTag(person.venmo)).length;

  return (
    <View style={styles.venmo}>
      <AppText variant="caption" tone="muted">
        {share > 0 ? money(share) : '—'} · {nextOn ?? 'unscheduled'} · {connected}/{people.length} Venmo
      </AppText>
      {people.map((person) => {
        const tag = venmoTag(person.venmo);
        return (
          <View
            key={person.id}
            style={[styles.person, { borderColor: colors.line, backgroundColor: colors.surface }]}>
            <View style={styles.personHead}>
              <AvatarBubble person={person} size={32} />
              <View style={styles.personCopy}>
                <AppText variant="bodyBold" numberOfLines={1}>
                  {person.name.trim() || 'Someone'}
                </AppText>
                <AppText variant="caption" tone={tag ? 'accent' : 'action'}>
                  {tag ?? 'Needs handle'}
                </AppText>
              </View>
            </View>
            <TextField
              compact
              value={person.venmo ?? ''}
              onChangeText={(value) => onChangeVenmo(person.id, value)}
              placeholder="@handle"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
            />
          </View>
        );
      })}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useResolvedTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accent : colors.surface,
          borderColor: active ? colors.accent : colors.line,
        },
      ]}>
      <AppText variant="caption" style={{ color: active ? colors.background : colors.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14, 20, 18, 0.46)',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    maxHeight: '88%',
    gap: space.sm,
  },
  handleBar: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  body: {
    gap: space.md,
    paddingBottom: space.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  block: {
    gap: space.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.sm,
  },
  step: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: 2,
  },
  venmo: {
    gap: space.sm,
  },
  person: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  personHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  personCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
});
