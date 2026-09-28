import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AccessSheet } from '@/components/access/AccessSheet';
import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { ServiceMark } from '@/components/teams/ServiceMark';
import { AppText } from '@/components/ui/AppText';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { accessEntries, type AccessEntry } from '@/lib/access';
import { tapLight } from '@/lib/haptics';
import { useKeel } from '@/store/keel-store';
import { radius, space } from '@/theme';

export default function AccessScreen() {
  const { colors } = useResolvedTheme();
  const { state, setDetailsAt } = useKeel();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const rows = useMemo(() => accessEntries(state.teams), [state.teams]);
  const active = rows.find((row) => row.key === openKey);

  return (
    <Screen>
      <Header title="Access" />
      {rows.length === 0 ? (
        <AppText variant="caption" tone="muted">
          Services appear here once a circle adds them.
        </AppText>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <AccessRow key={row.key} row={row} onPress={() => setOpenKey(row.key)} />
          ))}
        </View>
      )}
      <AccessSheet
        open={Boolean(active)}
        team={active?.team}
        item={active?.item}
        onClose={() => setOpenKey(null)}
        onChangeDetails={(itemId, details) => {
          if (!active) return;
          setDetailsAt(active.team.gridX, active.team.gridY, itemId, details);
        }}
      />
    </Screen>
  );
}

function AccessRow({ row, onPress }: { row: AccessEntry; onPress: () => void }) {
  const { colors } = useResolvedTheme();
  const circle = row.team.name.trim();

  return (
    <Pressable
      onPress={() => {
        tapLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={row.item.name}
      style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {row.item.kind === 'service' ? (
        <ServiceMark service={row.item.service} size={36} round />
      ) : (
        <View style={[styles.blank, { backgroundColor: colors.well, borderColor: colors.line }]} />
      )}
      <View style={styles.copy}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {row.item.name}
        </AppText>
        {circle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {circle}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.sm,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 52,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  blank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
});
