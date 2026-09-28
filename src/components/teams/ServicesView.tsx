import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ServiceMark } from '@/components/teams/ServiceMark';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SERVICES, SERVICE_CATEGORY_LABEL, SERVICE_CATEGORY_ORDER } from '@/data/services';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { tapLight } from '@/lib/haptics';
import { buyTag } from '@/lib/buying';
import { createId } from '@/lib/id';
import { radius, space } from '@/theme';
import type { DiscountCode } from '@/types';

type Props = {
  selectedIds?: string[];
  discountCodes?: DiscountCode[];
  onBack: () => void;
  onSave: (serviceIds: string[], discountCodes: DiscountCode[]) => void;
};

const blankCode = (): DiscountCode => ({ id: createId('code'), place: '', code: '' });

export function ServicesView({
  selectedIds = [],
  discountCodes = [],
  onBack,
  onSave,
}: Props) {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<string[]>(selectedIds);
  const [codes, setCodes] = useState<DiscountCode[]>(discountCodes.length ? discountCodes : [blankCode()]);
  const kept = codes.filter((item) => item.place.trim() || item.code.trim());
  const count = picked.length + kept.length;

  useEffect(() => {
    setPicked(selectedIds);
    setCodes(discountCodes.length ? discountCodes.map((item) => ({ ...item })) : [blankCode()]);
  }, [selectedIds, discountCodes]);

  const grouped = useMemo(() => {
    return SERVICE_CATEGORY_ORDER.map((category) => ({
      category,
      items: SERVICES.filter((service) => service.category === category),
    })).filter((group) => group.items.length > 0);
  }, []);

  const toggle = (id: string) => {
    tapLight();
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const updateCode = (id: string, next: Partial<DiscountCode>) => {
    setCodes((current) => current.map((item) => (item.id === id ? { ...item, ...next } : item)));
  };

  const save = () => {
    onSave(
      picked,
      kept.map((item) => ({
        ...item,
        place: item.place.trim(),
        code: item.code.trim(),
      })),
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, space.lg) }]}>
      <View style={styles.top}>
        <AppText variant="display">Services</AppText>
      </View>
      <ScrollView
        contentContainerStyle={styles.listWrap}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {grouped.map((group) => (
          <View key={group.category} style={styles.group}>
            <AppText variant="overline" tone="muted">
              {SERVICE_CATEGORY_LABEL[group.category]}
            </AppText>
            <View style={styles.list}>
              {group.items.map((service) => {
                const active = picked.includes(service.id);
                const tag = buyTag(service.id);
                return (
                  <Pressable
                    key={service.id}
                    onPress={() => toggle(service.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={service.name}
                    style={[
                      styles.row,
                      {
                        borderColor: active ? colors.accent : colors.line,
                        backgroundColor: colors.surface,
                      },
                    ]}>
                    <ServiceMark service={service} size={36} round />
                    <View style={styles.rowCopy}>
                      <AppText variant="bodyBold" numberOfLines={1}>
                        {service.name}
                      </AppText>
                      {tag ? (
                        <AppText variant="caption" tone="muted" numberOfLines={1}>
                          {tag}
                        </AppText>
                      ) : null}
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={20} color={colors.muted} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View style={styles.group}>
          <AppText variant="overline" tone="muted">
            Codes
          </AppText>
          {codes.map((item) => (
            <View key={item.id} style={styles.codeRow}>
              <TextField
                compact
                value={item.place}
                onChangeText={(place) => updateCode(item.id, { place })}
                placeholder="Where"
                autoCapitalize="words"
                style={styles.codeField}
              />
              <TextField
                compact
                value={item.code}
                onChangeText={(code) => updateCode(item.id, { code })}
                placeholder="Code"
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.codeField}
              />
              <Pressable
                onPress={() => {
                  tapLight();
                  setCodes((current) =>
                    current.length === 1
                      ? [{ ...current[0], place: '', code: '' }]
                      : current.filter((row) => row.id !== item.id),
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Remove this code"
                style={styles.codeRemove}>
                <AppText variant="title" tone="muted">
                  ×
                </AppText>
              </Pressable>
            </View>
          ))}
          <Button
            label="Add a code"
            variant="ghost"
            onPress={() => {
              tapLight();
              setCodes((current) => [...current, blankCode()]);
            }}
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
        <AppText variant="caption" tone="muted">
          {count === 0 ? 'Optional' : `${count}`}
        </AppText>
        <View style={styles.footerRow}>
          <Button label="Back" variant="ghost" onPress={onBack} style={styles.footerBtn} />
          <Button label={count === 0 ? 'Skip' : 'Save'} onPress={save} style={styles.footerBtn} />
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
    paddingBottom: space.md,
    gap: space.sm,
  },
  listWrap: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.lg,
  },
  group: {
    gap: space.sm,
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 8,
  },
  rowName: {
    flex: 1,
    minWidth: 0,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  codeField: {
    flex: 1,
    minWidth: 0,
  },
  codeRemove: {
    width: 36,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
