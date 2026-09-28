import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ServiceMark } from '@/components/teams/ServiceMark';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SHARED_SOURCES } from '@/data/sources';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { tapLight } from '@/lib/haptics';
import { radius, space } from '@/theme';

type Props = {
  selectedIds?: string[];
  links?: Record<string, string>;
  onBack: () => void;
  onSave: (sourceIds: string[], links: Record<string, string>) => void;
};

export function SourcesView({ selectedIds = [], links = {}, onBack, onSave }: Props) {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [picked, setPicked] = useState<string[]>(selectedIds);
  const [urls, setUrls] = useState<Record<string, string>>(links);
  const tileWidth = Math.min(width, 430) - space.xl * 2;
  const column = (tileWidth - space.md) / 2;
  const count = picked.length;

  useEffect(() => {
    setPicked(selectedIds);
    setUrls(links);
  }, [selectedIds, links]);

  const toggle = (id: string) => {
    tapLight();
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, space.lg) }]}>
      <View style={styles.top}>
        <AppText variant="display">Sources</AppText>
      </View>
      <ScrollView
        contentContainerStyle={styles.gridWrap}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.grid}>
          {SHARED_SOURCES.map((source) => {
            const active = picked.includes(source.id);
            return (
              <Pressable
                key={source.id}
                onPress={() => toggle(source.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={source.name}
                style={[
                  styles.tile,
                  {
                    width: column,
                    borderColor: active ? colors.accent : colors.line,
                    backgroundColor: colors.surface,
                  },
                ]}>
                <ServiceMark service={source} size={64} />
                <AppText variant="bodyBold" numberOfLines={2} style={styles.tileName}>
                  {source.name}
                </AppText>
                {active ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
              </Pressable>
            );
          })}
        </View>
        {picked.length > 0 ? (
          <View style={styles.group}>
            <AppText variant="overline" tone="muted">
              Links
            </AppText>
            {picked.map((id) => {
              const source = SHARED_SOURCES.find((item) => item.id === id);
              if (!source) return null;
              return (
                <View key={id} style={styles.linkBlock}>
                  <AppText variant="caption" tone="muted">
                    {source.name}
                  </AppText>
                  <TextField
                    compact
                    value={urls[id] ?? ''}
                    onChangeText={(value) => setUrls((current) => ({ ...current, [id]: value }))}
                    placeholder="https://"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              );
            })}
          </View>
        ) : null}
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
          {count === 0 ? 'Optional' : `${count}`}
        </AppText>
        <View style={styles.footerRow}>
          <Button label="Back" variant="ghost" onPress={onBack} style={styles.footerBtn} />
          <Button
            label={count === 0 ? 'Skip' : 'Save'}
            onPress={() =>
              onSave(
                picked,
                Object.fromEntries(picked.map((id) => [id, (urls[id] ?? '').trim()])),
              )
            }
            style={styles.footerBtn}
          />
        </View>
      </View>
    </View>
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
  gridWrap: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.xl,
  },
  group: {
    gap: space.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  tile: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    gap: space.sm,
    minHeight: 148,
  },
  tileName: {
    textAlign: 'center',
  },
  linkBlock: {
    gap: space.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
