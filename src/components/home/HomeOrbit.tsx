import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { HomeGlyph } from '@/components/home/HomeGlyph';
import { AppText } from '@/components/ui/AppText';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { fonts, space } from '@/theme';
import type { HomeGlyphId } from '@/types';

export type HomeOrbitSlot = {
  id: string;
  label: string;
  detail?: string;
  glyph: HomeGlyphId;
  filled: boolean;
  tone?: 'open' | 'ok' | 'soon' | 'due';
};

type Props = {
  title: string;
  center: HomeGlyphId;
  slots: HomeOrbitSlot[];
  onPressSlot: (id: string) => void;
  onAdd?: () => void;
};

export function HomeOrbit({ title, center, slots, onPressSlot, onAdd }: Props) {
  const { colors } = useResolvedTheme();
  const { width: win } = useWindowDimensions();
  const [box, setBox] = useState(0);
  const cell = box || Math.min(win - space.xl * 2, 360);
  const circle = Math.min(cell * 0.58, 220);
  const bubble = Math.min(44, circle * 0.22);
  const orbit = circle * 0.52;
  const plus = 28;
  const count = Math.max(slots.length, 1);
  const sweep = onAdd ? Math.PI * 1.65 : Math.PI * 2;
  const start = onAdd ? -Math.PI / 2 - sweep / 2 : -Math.PI / 2;
  const reach = Math.max(orbit + bubble / 2 - circle / 2, 0);

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (next && Math.abs(next - box) > 1) setBox(next);
      }}>
      <AppText variant="bodyBold">{title}</AppText>
      <View style={[styles.stage, { height: circle + reach * 2 }]}>
        <View
          style={[
            styles.ring,
            {
              width: circle,
              height: circle,
              borderRadius: circle / 2,
              borderColor: colors.accent,
              backgroundColor: colors.surface,
            },
          ]}>
          <HomeGlyph kind={center} size={circle * 0.34} color={colors.accent} />
          {slots.map((slot, index) => {
            const angle =
              !onAdd && count > 0
                ? start + ((Math.PI * 2) * index) / count
                : count === 1
                  ? -Math.PI / 2
                  : start + (sweep * index) / Math.max(count - 1, 1);
            const toneColor =
              slot.tone === 'due' ? colors.action : slot.tone === 'soon' ? colors.accentSoft : colors.accent;
            const border = slot.filled || slot.tone === 'due' || slot.tone === 'soon' ? toneColor : colors.line;
            const fill = slot.filled ? colors.well : colors.surface;
            const glyph = slot.filled || slot.tone === 'due' ? toneColor : colors.muted;
            return (
              <Pressable
                key={slot.id}
                onPress={() => onPressSlot(slot.id)}
                accessibilityRole="button"
                accessibilityLabel={slot.detail ? `${slot.label}, ${slot.detail}` : slot.label}
                style={[
                  styles.bubble,
                  {
                    width: bubble,
                    height: bubble,
                    borderRadius: bubble / 2,
                    left: circle / 2 + Math.cos(angle) * orbit - bubble / 2,
                    top: circle / 2 + Math.sin(angle) * orbit - bubble / 2,
                    backgroundColor: fill,
                    borderColor: border,
                    borderStyle: slot.filled ? 'solid' : 'dashed',
                  },
                ]}>
                <HomeGlyph kind={slot.glyph} size={bubble * 0.46} color={glyph} />
              </Pressable>
            );
          })}
          {onAdd ? (
            <Pressable
              onPress={onAdd}
              accessibilityRole="button"
              accessibilityLabel={`Add to ${title}`}
              style={[
                styles.plus,
                {
                  width: plus,
                  height: plus,
                  borderRadius: plus / 2,
                  backgroundColor: colors.line,
                  left: (circle - plus) / 2,
                },
              ]}>
              <AppText style={[styles.plusMark, { color: colors.muted, fontSize: plus * 0.62 }]}>+</AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    alignSelf: 'center',
    gap: space.md,
  },
  stage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  ring: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  bubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  plus: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusMark: {
    fontFamily: fonts.display,
    marginTop: -2,
  },
});
