import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddPersonSheet } from '@/components/teams/AddPersonSheet';
import { CircleBooksSheet } from '@/components/teams/CircleBooksSheet';
import { CircleChat } from '@/components/teams/CircleChat';
import { CircleSetup } from '@/components/teams/CircleSetup';
import { PersonCard } from '@/components/teams/PersonCard';
import { ServiceDetails } from '@/components/teams/ServiceDetails';
import { SplitSheet } from '@/components/teams/SplitSheet';
import { TeamNode } from '@/components/teams/TeamNode';
import { AppText } from '@/components/ui/AppText';
import { ALL_SERVICES_ID, catalogMonthly, getService, getServices } from '@/data/services';
import { getSource, getSources } from '@/data/sources';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { circleIsDefined, circleItems, circleSlides } from '@/lib/circle';
import { tapLight } from '@/lib/haptics';
import { cellKey, visibleCells } from '@/lib/grid';
import { shareAmount } from '@/lib/split';
import { useKeel } from '@/store/keel-store';
import { layout, radius, space } from '@/theme';

const MIN_SCALE = 0.28;
const MAX_SCALE = 1.15;
const OVERVIEW_SCALE = 0.38;
const IN_SCALE = 1;
const SNAP = { damping: 22, stiffness: 240, overshootClamping: true as const };

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

export function TeamCanvas() {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const {
    state,
    addMemberAt,
    renameTeamAt,
    removeMember,
    patchMember,
    markHintSeen,
    setGroupAt,
    setServicesAt,
    setSourcesAt,
    setDiscountCodesAt,
    setSplitAt,
    setBooksAt,
    setDetailsAt,
    addMessageAt,
  } = useKeel();
  const cells = useMemo(() => visibleCells(state.teams), [state.teams]);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const cellSize = Math.min(viewport.width || 1, viewport.height || 1);
  const [overview, setOverview] = useState(false);
  const [focused, setFocused] = useState({ x: 0, y: 0 });
  const [activeByCell, setActiveByCell] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<{ x: number; y: number } | null>(null);
  const [servicesPicker, setServicesPicker] = useState<{ x: number; y: number } | null>(null);
  const [splitOpen, setSplitOpen] = useState<{ x: number; y: number } | null>(null);
  const [booksOpen, setBooksOpen] = useState<{ x: number; y: number } | null>(null);
  const [personOpen, setPersonOpen] = useState<{ x: number; y: number; personId: string } | null>(null);
  const [chatByCell, setChatByCell] = useState<Record<string, boolean>>({});
  const hasCentered = useRef(false);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const camX = useSharedValue(0);
  const camY = useSharedValue(0);
  const scale = useSharedValue(IN_SCALE);
  const startCamX = useSharedValue(0);
  const startCamY = useSharedValue(0);
  const startScale = useSharedValue(IN_SCALE);

  useEffect(() => {
    if (viewport.width <= 0 || hasCentered.current) return;
    camX.value = cellSize / 2;
    camY.value = cellSize / 2;
    hasCentered.current = true;
  }, [viewport.width, cellSize, camX, camY]);

  const snapToNearest = useCallback(
    (x: number, y: number, nextScale: number) => {
      if (cells.length === 0) return;
      let best = cells[0];
      let bestDist = Number.POSITIVE_INFINITY;
      for (const cell of cells) {
        const cx = cell.x * cellSize + cellSize / 2;
        const cy = cell.y * cellSize + cellSize / 2;
        const dist = (cx - x) ** 2 + (cy - y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = cell;
        }
      }
      const tx = best.x * cellSize + cellSize / 2;
      const ty = best.y * cellSize + cellSize / 2;
      const zoomedOut = nextScale < 0.62;
      const targetScale = zoomedOut ? OVERVIEW_SCALE : IN_SCALE;
      if (Math.abs(x - tx) > 2 || Math.abs(y - ty) > 2) {
        camX.value = withSpring(tx, SNAP);
        camY.value = withSpring(ty, SNAP);
      } else {
        camX.value = tx;
        camY.value = ty;
      }
      if (Math.abs(nextScale - targetScale) > 0.03) {
        scale.value = withSpring(targetScale, SNAP);
      } else {
        scale.value = targetScale;
      }
      setOverview(zoomedOut);
      setFocused({ x: best.x, y: best.y });
    },
    [camX, camY, cellSize, cells, scale],
  );

  const focusCell = useCallback(
    (x: number, y: number) => {
      tapLight();
      camX.value = withSpring(x * cellSize + cellSize / 2, SNAP);
      camY.value = withSpring(y * cellSize + cellSize / 2, SNAP);
      scale.value = withSpring(IN_SCALE, SNAP);
      setOverview(false);
      setFocused({ x, y });
    },
    [camX, camY, cellSize, scale],
  );

  const toggleZoom = useCallback(() => {
    const zoomedOut = scale.value > 0.7;
    snapToNearest(camX.value, camY.value, zoomedOut ? OVERVIEW_SCALE : IN_SCALE);
  }, [camX, camY, scale, snapToNearest]);

  const pan = Gesture.Pan()
    .minDistance(12)
    .onStart(() => {
      startCamX.value = camX.value;
      startCamY.value = camY.value;
    })
    .onUpdate((event) => {
      camX.value = startCamX.value - event.translationX / scale.value;
      camY.value = startCamY.value - event.translationY / scale.value;
    })
    .onEnd(() => {
      runOnJS(snapToNearest)(camX.value, camY.value, scale.value);
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = clamp(startScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      runOnJS(snapToNearest)(camX.value, camY.value, scale.value);
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  const worldStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: viewport.width / 2 - camX.value * scale.value },
      { translateY: viewport.height / 2 - camY.value * scale.value },
      { scale: scale.value },
    ],
  }));

  const onWheel = (event: { nativeEvent?: { deltaX?: number; deltaY?: number; ctrlKey?: boolean } } & {
    deltaX?: number;
    deltaY?: number;
    ctrlKey?: boolean;
    preventDefault?: () => void;
  }) => {
    const native = event.nativeEvent ?? event;
    const dx = native.deltaX ?? 0;
    const dy = native.deltaY ?? 0;
    event.preventDefault?.();
    if (native.ctrlKey) {
      scale.value = clamp(scale.value * Math.exp(-dy * 0.01), MIN_SCALE, MAX_SCALE);
    } else {
      camX.value += dx / scale.value;
      camY.value += dy / scale.value;
    }
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => {
      snapToNearest(camX.value, camY.value, scale.value);
    }, 140);
  };

  const focusedTeam = state.teams.find((team) => team.gridX === focused.x && team.gridY === focused.y);
  const focusedServices = getServices(focusedTeam?.serviceIds ?? []);
  const focusedItems = circleItems(focusedTeam);
  const focusedKey = cellKey(focused.x, focused.y);
  const focusedSlides = circleSlides(focusedTeam);
  const activeId =
    (activeByCell[focusedKey] && focusedSlides.includes(activeByCell[focusedKey])
      ? activeByCell[focusedKey]
      : focusedSlides[0]) ?? undefined;
  const combined = activeId === ALL_SERVICES_ID;
  const chatOpen = Boolean(chatByCell[focusedKey]);
  const activeService = combined ? undefined : activeId ? getService(activeId) : undefined;
  const activeDiscount = combined
    ? undefined
    : focusedTeam?.discountCodes.find((item) => item.id === activeId);
  const pickerTeam = servicesPicker
    ? state.teams.find((team) => team.gridX === servicesPicker.x && team.gridY === servicesPicker.y)
    : undefined;
  const splitTeam = splitOpen
    ? state.teams.find((team) => team.gridX === splitOpen.x && team.gridY === splitOpen.y)
    : undefined;
  const booksTeam = booksOpen
    ? state.teams.find((team) => team.gridX === booksOpen.x && team.gridY === booksOpen.y)
    : undefined;
  const personTeam = personOpen
    ? state.teams.find((team) => team.gridX === personOpen.x && team.gridY === personOpen.y)
    : undefined;
  const activePerson = personTeam?.members.find((item) => item.id === personOpen?.personId);

  const cycleService = (x: number, y: number, direction: -1 | 1) => {
    const team = state.teams.find((item) => item.gridX === x && item.gridY === y);
    const slides = circleSlides(team);
    if (slides.length < 2) return;
    const key = cellKey(x, y);
    const current = activeByCell[key] && slides.includes(activeByCell[key]) ? activeByCell[key] : slides[0];
    const index = slides.indexOf(current);
    const next = slides[(index + direction + slides.length) % slides.length];
    tapLight();
    setActiveByCell((prev) => ({ ...prev, [key]: next }));
  };

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
    <View
      style={[styles.canvas, { backgroundColor: colors.background }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width && height) setViewport({ width, height });
      }}>
      <GestureDetector gesture={composed}>
        <Animated.View
          style={styles.touch}
          // @ts-expect-error wheel exists on web
          onWheel={onWheel}>
          <Animated.View style={[styles.world, { transformOrigin: 'top left' }, worldStyle]}>
            {cells.map((cell) => (
              <View
                key={cell.key}
                style={{
                  position: 'absolute',
                  left: cell.x * cellSize,
                  top: cell.y * cellSize,
                  width: cellSize,
                  height: cellSize,
                }}>
                <TeamNode
                  team={cell.team}
                  cellSize={cellSize}
                  overview={overview}
                  activeServiceId={
                    activeByCell[cell.key] ??
                    (circleItems(cell.team).length > 1 ? ALL_SERVICES_ID : circleItems(cell.team)[0]?.id)
                  }
                  onAdd={() => {
                    if (circleIsDefined(cell.team)) setSheet({ x: cell.x, y: cell.y });
                    else setServicesPicker({ x: cell.x, y: cell.y });
                  }}
                  chatOpen={Boolean(chatByCell[cell.key])}
                  onOpenServices={() => setServicesPicker({ x: cell.x, y: cell.y })}
                  onOpenSplit={() => setSplitOpen({ x: cell.x, y: cell.y })}
                  onOpenBooks={() => setBooksOpen({ x: cell.x, y: cell.y })}
                  booksLive={
                    (cell.team?.books.funds.length ?? 0) + (cell.team?.books.borrow.length ?? 0) > 0 ||
                    cell.team?.split.mode === 'equal'
                  }
                  onOpenChat={() => {
                    tapLight();
                    setChatByCell((prev) => ({ ...prev, [cell.key]: !prev[cell.key] }));
                  }}
                  onCycle={(direction) => cycleService(cell.x, cell.y, direction)}
                  onFocus={() => focusCell(cell.x, cell.y)}
                  onRename={(name) => renameTeamAt(cell.x, cell.y, name)}
                  onPressPerson={(personId) => {
                    tapLight();
                    setPersonOpen({ x: cell.x, y: cell.y, personId });
                  }}
                />
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <View
        style={[
          styles.hud,
          {
            paddingTop: Math.max(insets.top, space.md),
            left: Math.max(insets.left, space.md),
            right: Math.max(insets.right, space.md),
            pointerEvents: 'box-none',
          },
        ]}>
        <View />
        <Pressable
          onPress={toggleZoom}
          accessibilityRole="button"
          accessibilityLabel={overview ? 'Focus this circle' : 'See all circles'}
          style={[styles.zoomChip, { borderColor: colors.line, backgroundColor: colors.surface }]}>
          <AppText variant="caption" tone="accent">
            {overview ? 'Focus' : 'See all'}
          </AppText>
        </Pressable>
      </View>
      {!state.settings.seenTeamsHint && focusedItems.length === 0 ? (
        <PressableHint onDismiss={markHintSeen} />
      ) : null}
      <CircleSetup
        open={servicesPicker !== null}
        team={pickerTeam}
        onClose={() => setServicesPicker(null)}
        onSaveGroup={(name, description) => {
          if (!servicesPicker) return;
          setGroupAt(servicesPicker.x, servicesPicker.y, name, description);
        }}
        onSaveServices={(serviceIds, discountCodes) => {
          if (!servicesPicker) return;
          setServicesAt(servicesPicker.x, servicesPicker.y, serviceIds);
          setDiscountCodesAt(servicesPicker.x, servicesPicker.y, discountCodes);
          const sourceCount = pickerTeam?.sourceIds.length ?? 0;
          const key = cellKey(servicesPicker.x, servicesPicker.y);
          setActiveByCell((prev) => ({
            ...prev,
            [key]:
              serviceIds.length + discountCodes.length + sourceCount > 1
                ? ALL_SERVICES_ID
                : serviceIds[0] ?? discountCodes[0]?.id ?? pickerTeam?.sourceIds[0],
          }));
        }}
        onSaveSources={(sourceIds, links) => {
          if (!servicesPicker) return;
          setSourcesAt(servicesPicker.x, servicesPicker.y, sourceIds);
          sourceIds.forEach((id) => {
            const saved = pickerTeam?.detailsById?.[id];
            setDetailsAt(servicesPicker.x, servicesPicker.y, id, {
              login: saved?.login ?? '',
              password: saved?.password ?? '',
              extra: links[id] ?? '',
            });
          });
          const otherCount = (pickerTeam?.serviceIds.length ?? 0) + (pickerTeam?.discountCodes.length ?? 0);
          const key = cellKey(servicesPicker.x, servicesPicker.y);
          setActiveByCell((prev) => ({
            ...prev,
            [key]: sourceIds.length + otherCount > 1 ? ALL_SERVICES_ID : sourceIds[0] ?? pickerTeam?.serviceIds[0],
          }));
        }}
      />
      <AddPersonSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        onPick={(name, source, contactId) => {
          if (!sheet) return;
          addMemberAt(sheet.x, sheet.y, name, source, contactId);
        }}
      />
      <SplitSheet
        open={splitOpen !== null}
        team={splitTeam}
        onClose={() => setSplitOpen(null)}
        onChange={(split) => {
          if (!splitOpen) return;
          setSplitAt(splitOpen.x, splitOpen.y, split);
        }}
        onChangeVenmo={(personId, handle) => {
          if (!splitTeam) return;
          patchMember(splitTeam.id, personId, { venmo: handle });
        }}
      />
      <CircleBooksSheet
        open={booksOpen !== null}
        team={booksTeam}
        onClose={() => setBooksOpen(null)}
        onChangeBooks={(books) => {
          if (!booksOpen) return;
          setBooksAt(booksOpen.x, booksOpen.y, books);
        }}
        onOpenSplit={() => {
          if (!booksOpen) return;
          const at = booksOpen;
          setBooksOpen(null);
          setSplitOpen(at);
        }}
      />
      <PersonCard
        open={personOpen !== null}
        person={activePerson}
        splitting={personTeam?.split.mode === 'equal'}
        share={
          personTeam
            ? shareAmount(
                personTeam.split.total !== undefined
                  ? personTeam.split.total
                  : catalogMonthly(personTeam.serviceIds),
                personTeam.split.ways,
              )
            : 0
        }
        nextAt={personTeam?.split.nextAt}
        interval={personTeam?.split.interval}
        route={personTeam?.split.route}
        onClose={() => setPersonOpen(null)}
        onChangeVenmo={(handle) => {
          if (!personTeam || !activePerson) return;
          patchMember(personTeam.id, activePerson.id, { venmo: handle });
        }}
        onRemove={() => {
          if (!personTeam || !activePerson) return;
          const teamId = personTeam.id;
          const personId = activePerson.id;
          Alert.alert('Remove from circle?', 'They can be added again later.', [
            { text: 'Keep', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => {
                removeMember(teamId, personId);
                setPersonOpen(null);
              },
            },
          ]);
        }}
      />
    </View>
      <View style={styles.dock}>
        {chatOpen ? (
          <CircleChat
            title={focusedTeam?.name.trim() || 'This circle'}
            messages={focusedTeam?.messages ?? []}
            onSend={(text) => addMessageAt(focused.x, focused.y, text)}
          />
        ) : (
          <ServiceDetails
            service={activeService}
            source={combined ? undefined : activeId ? getSource(activeId) : undefined}
            discount={activeDiscount}
            description={focusedTeam?.description}
            allServices={focusedServices}
            combined={combined}
            discountCodes={focusedTeam?.discountCodes ?? []}
            sourceNames={getSources(focusedTeam?.sourceIds ?? []).map((item) => item.name)}
            team={focusedTeam}
            position={
              focusedSlides.length > 1
                ? {
                    index: Math.max(0, focusedSlides.indexOf(activeId ?? focusedSlides[0])),
                    total: focusedSlides.length,
                  }
                : undefined
            }
          />
        )}
      </View>
    </View>
  );
}

function PressableHint({ onDismiss }: { onDismiss: () => void }) {
  const { colors } = useResolvedTheme();
  return (
    <View style={[styles.hintWrap, { pointerEvents: 'box-none' }]}>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss circles hint"
        style={[styles.hint, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <AppText variant="caption">Pinch out for all circles. Tap + to start one.</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    overflow: 'hidden',
  },
  dock: {
    height: layout.infoDock,
    overflow: 'hidden',
  },
  touch: {
    flex: 1,
  },
  world: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1,
    height: 1,
  },
  hud: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoomChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  hintWrap: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    bottom: space.xl,
  },
  hint: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.lg,
    overflow: 'hidden',
  },
});
