import { ScrollView, StyleSheet, View } from 'react-native';

import { ServiceMark } from '@/components/teams/ServiceMark';
import { AppText } from '@/components/ui/AppText';
import { SERVICE_CATEGORY_LABEL, type Service } from '@/data/services';
import type { SharedSource } from '@/data/sources';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { accessFieldLabels } from '@/lib/access';
import { circleItems, shareKindLabel, type CircleItem } from '@/lib/circle';
import { fonts, layout, radius, space } from '@/theme';
import type { DiscountCode, Team } from '@/types';

type Props = {
  service?: Service;
  source?: SharedSource;
  discount?: DiscountCode;
  description?: string;
  allServices?: Service[];
  combined?: boolean;
  discountCodes?: DiscountCode[];
  sourceNames?: string[];
  team?: Team;
  position?: { index: number; total: number };
};

export function ServiceDetails({
  service,
  source,
  discount,
  description,
  allServices,
  combined,
  discountCodes = [],
  sourceNames = [],
  team,
  position,
}: Props) {
  const { colors } = useResolvedTheme();
  const note = description?.trim();
  const items = circleItems(team);

  if (combined && (items.length > 0 || (allServices && allServices.length > 0) || discountCodes.length > 0 || sourceNames.length > 0)) {
    return (
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={styles.row}>
          <AppText variant="overline" tone="accent">
            Services
          </AppText>
          {position && position.total > 1 ? (
            <AppText variant="overline" tone="muted">
              {position.index + 1} of {position.total}
            </AppText>
          ) : null}
        </View>
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listBody}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <ShareRow key={item.id} item={item} team={team} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (discount) {
    const item = items.find((row) => row.id === discount.id) ?? {
      kind: 'discount' as const,
      id: discount.id,
      name: discount.place.trim() || 'Discount code',
      discount,
    };
    return (
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <CardHead label="Code" position={position} />
        <AppText variant="title" numberOfLines={1}>
          {discount.place.trim() || 'Discount code'}
        </AppText>
        <CredBlock item={item} team={team} />
      </View>
    );
  }

  if (source) {
    const item = items.find((row) => row.id === source.id) ?? {
      kind: 'source' as const,
      id: source.id,
      name: source.name,
      source,
    };
    return (
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <CardHead label="Source" position={position} />
        <AppText variant="title" numberOfLines={1}>
          {source.name}
        </AppText>
        <CredBlock item={item} team={team} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <AppText variant="overline" tone="accent">
          Circle
        </AppText>
        <AppText variant="title" numberOfLines={1}>
          {note ? 'Circle' : 'Empty'}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          {note || 'Tap + to start'}
        </AppText>
      </View>
    );
  }

  const item = items.find((row) => row.id === service.id) ?? {
    kind: 'service' as const,
    id: service.id,
    name: service.name,
    service,
  };

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <CardHead label={SERVICE_CATEGORY_LABEL[service.category]} position={position} />
      <AppText variant="title" numberOfLines={1}>
        {service.name}
      </AppText>
      <CredBlock item={item} team={team} />
    </View>
  );
}

function CardHead({ label, position }: { label: string; position?: { index: number; total: number } }) {
  return (
    <View style={styles.row}>
      <AppText variant="overline" tone="accent">
        {label}
      </AppText>
      {position && position.total > 1 ? (
        <AppText variant="overline" tone="muted">
          {position.index + 1} of {position.total}
        </AppText>
      ) : null}
    </View>
  );
}

function credParts(item: CircleItem, team?: Team) {
  if (item.kind === 'discount') {
    return { login: undefined, secret: item.discount.code.trim() || undefined, extra: undefined };
  }
  const details = team?.detailsById?.[item.id];
  return {
    login: details?.login.trim() || undefined,
    secret: details?.password.trim() || undefined,
    extra: details?.extra.trim() || undefined,
  };
}

function CredBlock({ item, team }: { item: CircleItem; team?: Team }) {
  const labels = accessFieldLabels(item);
  const parts = credParts(item, team);
  const rows = [
    parts.login ? { label: labels.login, value: parts.login } : null,
    parts.secret ? { label: labels.secret, value: parts.secret } : null,
    parts.extra ? { label: labels.extra ?? 'Note', value: parts.extra } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  if (rows.length === 0) {
    return (
      <AppText variant="caption" tone="muted">
        No login
      </AppText>
    );
  }

  return (
    <View style={styles.creds}>
      {rows.map((row) => (
        <View key={row.label} style={styles.credRow}>
          <AppText variant="overline" tone="muted" style={styles.credLabel}>
            {row.label}
          </AppText>
          <AppText variant="caption" numberOfLines={1} style={styles.credValue}>
            {row.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function ShareRow({ item, team }: { item: CircleItem; team?: Team }) {
  const { colors } = useResolvedTheme();
  const parts = credParts(item, team);
  const line = [parts.login, parts.secret, parts.extra].filter(Boolean).join(' · ');
  const face = item.kind === 'service' ? item.service : item.kind === 'source' ? item.source : undefined;
  const caption = line || shareKindLabel(item);

  return (
    <View style={styles.shareRow}>
      {face ? (
        <ServiceMark service={face} size={28} round />
      ) : (
        <View style={[styles.codeMark, { backgroundColor: colors.well, borderColor: colors.line }]} />
      )}
      <View style={styles.shareCopy}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText variant="caption" tone={line ? 'default' : 'muted'} numberOfLines={1} style={styles.credValue}>
          {caption}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: layout.infoDock,
    borderTopWidth: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    gap: 4,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 18,
  },
  list: {
    flex: 1,
  },
  listBody: {
    gap: space.sm,
    paddingTop: 4,
    paddingBottom: 4,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  shareCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  codeMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  creds: {
    gap: 2,
    flex: 1,
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
  },
  credLabel: {
    width: 64,
  },
  credValue: {
    flex: 1,
    fontFamily: fonts.mono,
    letterSpacing: 0,
  },
});
