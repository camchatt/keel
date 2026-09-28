import { useMemo, useState } from 'react';

import { HomeCatalogSheet } from '@/components/home/HomeCatalogSheet';
import { HomeContactSheet } from '@/components/home/HomeContactSheet';
import { HomeOrbit } from '@/components/home/HomeOrbit';
import { HomeUpkeepSheet } from '@/components/home/HomeUpkeepSheet';
import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import {
  TRADE_CATALOG,
  UPKEEP_CATALOG,
  contactFilled,
  getTownItem,
  getTradeItem,
  getUpkeepItem,
  upkeepDueState,
} from '@/data/home';
import { formatRequestOn } from '@/lib/split';
import { useKeel } from '@/store/keel-store';

type ContactTarget = { ring: 'trade' | 'town'; id: string };
type PickerTarget = 'trade' | 'upkeep';

export default function HomeScreen() {
  const { state, patchTrade, addTrade, removeTrade, patchTown, patchUpkeep, addUpkeep, removeUpkeep } = useKeel();
  const [contact, setContact] = useState<ContactTarget | null>(null);
  const [upkeepId, setUpkeepId] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  const tradeSlots = useMemo(
    () =>
      state.home.trades.map((item) => {
        const catalog = getTradeItem(item.catalogId);
        const filled = contactFilled(item);
        return {
          id: item.id,
          label: catalog?.label ?? item.catalogId,
          detail: filled ? item.name || item.phone : 'Add a contact',
          glyph: catalog?.glyph ?? 'wrench',
          filled,
        };
      }),
    [state.home.trades],
  );

  const townSlots = useMemo(
    () =>
      state.home.town.map((item) => {
        const catalog = getTownItem(item.catalogId);
        const filled = contactFilled(item);
        return {
          id: item.id,
          label: catalog?.label ?? item.catalogId,
          detail: filled ? item.name || item.phone : 'Add a contact',
          glyph: catalog?.glyph ?? 'town',
          filled,
        };
      }),
    [state.home.town],
  );

  const upkeepSlots = useMemo(
    () =>
      state.home.upkeep.map((item) => {
        const catalog = getUpkeepItem(item.catalogId);
        const tone = upkeepDueState(item.nextAt);
        const due = formatRequestOn(item.nextAt);
        return {
          id: item.id,
          label: catalog?.label ?? item.catalogId,
          detail: tone === 'open' ? 'Set a date' : due ? `Next ${due}` : 'Scheduled',
          glyph: catalog?.glyph ?? 'wrench',
          filled: tone === 'ok' || tone === 'soon',
          tone,
        };
      }),
    [state.home.upkeep],
  );

  const activeTrade = contact?.ring === 'trade' ? state.home.trades.find((item) => item.id === contact.id) : undefined;
  const activeTown = contact?.ring === 'town' ? state.home.town.find((item) => item.id === contact.id) : undefined;
  const activeUpkeep = upkeepId ? state.home.upkeep.find((item) => item.id === upkeepId) : undefined;
  const contactTitle = activeTrade
    ? (getTradeItem(activeTrade.catalogId)?.label ?? 'Trade')
    : activeTown
      ? (getTownItem(activeTown.catalogId)?.label ?? 'Town')
      : '';
  const tradeExtras = TRADE_CATALOG.filter((item) => !item.preset && !state.home.trades.some((row) => row.catalogId === item.id));
  const upkeepExtras = UPKEEP_CATALOG.filter((item) => !item.preset && !state.home.upkeep.some((row) => row.catalogId === item.id));

  return (
    <Screen>
      <Header title="Home" />
      <HomeOrbit
        title="House"
        center="house"
        slots={tradeSlots}
        onPressSlot={(id) => setContact({ ring: 'trade', id })}
        onAdd={() => setPicker('trade')}
      />
      <HomeOrbit title="Town" center="town" slots={townSlots} onPressSlot={(id) => setContact({ ring: 'town', id })} />
      <HomeOrbit
        title="Maintenance"
        center="wrench"
        slots={upkeepSlots}
        onPressSlot={setUpkeepId}
        onAdd={() => setPicker('upkeep')}
      />
      <HomeContactSheet
        open={Boolean(activeTrade || activeTown)}
        title={contactTitle}
        name={(activeTrade ?? activeTown)?.name ?? ''}
        phone={(activeTrade ?? activeTown)?.phone ?? ''}
        note={(activeTrade ?? activeTown)?.note ?? ''}
        canRemove={Boolean(activeTrade && !getTradeItem(activeTrade.catalogId)?.preset)}
        onClose={() => setContact(null)}
        onSave={(next) => {
          if (activeTrade) patchTrade(activeTrade.id, next);
          if (activeTown) patchTown(activeTown.id, next);
        }}
        onRemove={activeTrade ? () => removeTrade(activeTrade.id) : undefined}
      />
      <HomeUpkeepSheet
        open={Boolean(activeUpkeep)}
        title={activeUpkeep ? (getUpkeepItem(activeUpkeep.catalogId)?.label ?? 'Upkeep') : ''}
        interval={activeUpkeep?.interval ?? 'yearly'}
        nextAt={activeUpkeep?.nextAt}
        canRemove={Boolean(activeUpkeep && !getUpkeepItem(activeUpkeep.catalogId)?.preset)}
        onClose={() => setUpkeepId(null)}
        onSave={(next) => {
          if (!activeUpkeep) return;
          patchUpkeep(activeUpkeep.id, next);
        }}
        onRemove={activeUpkeep ? () => removeUpkeep(activeUpkeep.id) : undefined}
      />
      <HomeCatalogSheet
        open={picker !== null}
        title={picker === 'upkeep' ? 'Household item' : 'Add a trade'}
        items={picker === 'upkeep' ? upkeepExtras : tradeExtras}
        onClose={() => setPicker(null)}
        onPick={(catalogId) => {
          if (picker === 'upkeep') {
            addUpkeep(catalogId);
            setPicker(null);
            setUpkeepId(`upkeep_${catalogId}`);
            return;
          }
          addTrade(catalogId);
          setPicker(null);
          setContact({ ring: 'trade', id: `trade_${catalogId}` });
        }}
      />
    </Screen>
  );
}
