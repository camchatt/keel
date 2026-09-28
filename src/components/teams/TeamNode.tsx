import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AvatarBubble } from '@/components/teams/AvatarBubble';
import { ServicePile } from '@/components/teams/ServicePile';
import { AppText } from '@/components/ui/AppText';
import { ALL_SERVICES_ID } from '@/data/services';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { circleItems, circleIsDefined } from '@/lib/circle';
import { fonts } from '@/theme';
import type { Team } from '@/types';

type Props = {
  team?: Team;
  cellSize: number;
  overview: boolean;
  activeServiceId?: string;
  chatOpen?: boolean;
  onAdd: () => void;
  onFocus: () => void;
  onRename: (name: string) => void;
  onPressPerson: (personId: string) => void;
  onOpenServices: () => void;
  onOpenSplit: () => void;
  onOpenBooks: () => void;
  booksLive?: boolean;
  onOpenChat: () => void;
  onCycle: (direction: -1 | 1) => void;
};

export function TeamNode({
  team,
  cellSize,
  overview,
  activeServiceId,
  onAdd,
  onFocus,
  onRename,
  onPressPerson,
  chatOpen = false,
  onOpenServices,
  onOpenSplit,
  onOpenBooks,
  booksLive = false,
  onOpenChat,
  onCycle,
}: Props) {
  const { colors } = useResolvedTheme();
  const members = team?.members ?? [];
  const items = circleItems(team);
  const active = items.find((item) => item.id === activeServiceId) ?? items[0];
  const occupied = circleIsDefined(team);
  const plusReady = occupied;
  const circle = Math.min(cellSize * 0.58, 280);
  const plus = plusReady
    ? Math.max(overview ? 16 : 26, circle * 0.11)
    : overview
      ? circle * 0.18
      : Math.min(84, circle * 0.28);
  const bubble = Math.min(overview ? 28 : 52, circle * 0.18);
  const orbit = circle * 0.44;
  const logoSize = circle * 0.5;
  const addingServices = !occupied;
  const showChevrons = !overview && items.length > 1;
  const combined = activeServiceId === ALL_SERVICES_ID || (!activeServiceId && items.length > 1);

  return (
    <View style={[styles.cell, { width: cellSize, height: cellSize, pointerEvents: 'box-none' }]}>
      {!overview ? (
        <View style={[styles.nameWrap, { width: circle + 32 }]}>
          <View style={styles.nameSide} />
          <TextInput
            value={team?.name ?? ''}
            onChangeText={onRename}
            placeholder="Name this circle"
            placeholderTextColor={colors.muted}
            style={[styles.name, { color: colors.text }]}
            textAlign="center"
          />
          <Pressable
            onPress={onOpenSplit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Circle split settings"
            style={styles.nameSide}>
            <Ionicons name="options-outline" size={16} color={colors.muted} />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.nameWrap, { width: circle + 32 }]}>
          <View style={styles.nameSide} />
          <AppText
            variant="caption"
            tone={team?.name ? 'default' : 'muted'}
            numberOfLines={1}
            style={styles.label}>
            {team?.name.trim() || active?.name || 'Untitled'}
          </AppText>
          <View style={styles.nameSide} />
        </View>
      )}
      <View style={styles.stage}>
        {showChevrons ? (
          <Pressable
            onPress={() => onCycle(-1)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Previous service"
            style={styles.chevron}>
            <AppText style={[styles.chevronMark, { color: colors.muted }]}>‹</AppText>
          </Pressable>
        ) : (
          <View style={styles.chevron} />
        )}
        <View style={styles.ringStack}>
        <Pressable
          onPress={overview ? onFocus : items.length === 0 ? onOpenServices : undefined}
          disabled={overview ? false : items.length > 0}
          style={[
            styles.ring,
            {
              width: circle,
              height: circle,
              borderRadius: circle / 2,
              borderColor: occupied ? colors.accent : colors.line,
              backgroundColor: colors.surface,
              borderStyle: occupied ? 'solid' : 'dashed',
            },
          ]}>
          {members.map((person, index) => {
            const count = Math.max(members.length, 1);
            const sweep = Math.PI * 1.5;
            const start = -Math.PI / 2 - sweep / 2;
            const angle = count === 1 ? -Math.PI / 2 : start + (sweep * index) / (count - 1 || 1);
            return (
              <View
                key={person.id}
                style={{
                  position: 'absolute',
                  left: circle / 2 + Math.cos(angle) * orbit - bubble / 2,
                  top: circle / 2 + Math.sin(angle) * orbit - bubble / 2,
                  zIndex: 3,
                }}>
                <AvatarBubble
                  person={person}
                  size={bubble}
                  onPress={overview ? undefined : () => onPressPerson(person.id)}
                />
              </View>
            );
          })}
          {items.length > 0 ? (
            <ServicePile
              items={items}
              combined={combined}
              activeId={active?.id}
              size={logoSize}
              onPress={overview ? onFocus : onOpenServices}
            />
          ) : null}
          {!overview ? (
            <Pressable
              onPress={onAdd}
              accessibilityRole="button"
              accessibilityLabel={addingServices ? 'Start this circle' : 'Add a person to this circle'}
            style={[
              styles.plus,
              plusReady ? styles.plusDock : undefined,
              {
                width: plus,
                height: plus,
                borderRadius: plus / 2,
                backgroundColor: plusReady ? colors.line : colors.accent,
                bottom: plusReady ? circle * 0.08 : undefined,
                left: plusReady ? (circle - plus) / 2 : undefined,
              },
            ]}>
              <AppText
                style={[
                  styles.plusMark,
                  {
                    color: plusReady ? colors.muted : colors.background,
                    fontSize: plus * (plusReady ? 0.64 : 0.55),
                    marginTop: plusReady ? -1 : -5,
                  },
                ]}>
                +
              </AppText>
            </Pressable>
          ) : (
            <View
              style={[
                styles.plus,
                plusReady ? styles.plusDock : undefined,
                {
                  width: plus,
                  height: plus,
                  borderRadius: plus / 2,
                  backgroundColor: plusReady ? colors.line : colors.accent,
                  bottom: plusReady ? circle * 0.08 : undefined,
                  left: plusReady ? (circle - plus) / 2 : undefined,
                },
              ]}>
              {plusReady || members.length === 0 ? (
                <AppText
                  style={[
                    styles.plusMark,
                    {
                      color: plusReady ? colors.muted : colors.background,
                      fontSize: plus * 0.6,
                      marginTop: -1,
                    },
                  ]}>
                  +
                </AppText>
              ) : null}
            </View>
          )}
        </Pressable>
        {!overview ? (
          <View style={styles.under}>
            <Pressable
              onPress={onOpenChat}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={chatOpen ? 'Show circle details' : 'Open group chat'}
              style={styles.settings}>
              <Ionicons
                name={chatOpen ? 'chatbubble' : 'chatbubble-outline'}
                size={16}
                color={chatOpen ? colors.accent : colors.muted}
              />
            </Pressable>
            <Pressable
              onPress={onOpenBooks}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open buying power"
              style={styles.settings}>
              <Ionicons name="wallet-outline" size={16} color={booksLive ? colors.accent : colors.muted} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.under} />
        )}
        </View>
        {showChevrons ? (
          <Pressable
            onPress={() => onCycle(1)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Next service"
            style={styles.chevron}>
            <AppText style={[styles.chevronMark, { color: colors.muted }]}>›</AppText>
          </Pressable>
        ) : (
          <View style={styles.chevron} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringStack: {
    alignItems: 'center',
    gap: 8,
  },
  ring: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  plus: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  plusDock: {
    position: 'absolute',
  },
  plusMark: {
    fontFamily: fonts.bodyBold,
  },
  chevron: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronMark: {
    fontFamily: fonts.body,
    fontSize: 28,
    lineHeight: 32,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    lineHeight: 22,
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
  },
  nameSide: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.body,
    fontSize: 13,
    letterSpacing: 0.2,
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    height: 22,
    textAlign: 'center',
  },
  under: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 28,
  },
  settings: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
