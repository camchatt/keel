import { getService, serviceMonthly } from '@/data/services';
import { borrowHeadroom, fundsTotal } from '@/lib/books';
import { venmoTag } from '@/lib/pay';
import { money, shareAmount } from '@/lib/split';
import type { Team } from '@/types';

export type BuyKind = 'family' | 'household' | 'share' | 'pass' | 'seat';

export type BuyMeta = {
  kind: BuyKind;
  seats: number;
  solo: number;
  tag: string;
};

export type BuyDeal = {
  id: string;
  name: string;
  tag: string;
  line: string;
  filled: number;
  seats: number;
  save: number;
};

export type PowerStep = {
  id: 'seats' | 'cash' | 'credit' | 'collect';
  label: string;
  detail: string;
  done: boolean;
};

export type FundIdea = {
  kind: 'fund' | 'borrow';
  name: string;
  amount?: string;
  target?: string;
  limit?: string;
  note: string;
};

const META: Record<string, BuyMeta> = {
  spotify: { kind: 'family', seats: 6, solo: 11.99, tag: 'Family · 6' },
  youtube: { kind: 'family', seats: 5, solo: 13.99, tag: 'Family · 5' },
  'apple-one': { kind: 'family', seats: 5, solo: 19.95, tag: 'Family · 5' },
  'disney-plus': { kind: 'share', seats: 4, solo: 16.99, tag: '4 screens' },
  netflix: { kind: 'share', seats: 4, solo: 22.99, tag: '4 profiles' },
  prime: { kind: 'household', seats: 3, solo: 14.99, tag: 'Household' },
  hulu: { kind: 'share', seats: 2, solo: 26.99, tag: 'Bundle' },
  max: { kind: 'share', seats: 2, solo: 16.99, tag: '2 streams' },
  'espn-plus': { kind: 'share', seats: 3, solo: 11.99, tag: 'Household' },
  fubo: { kind: 'share', seats: 3, solo: 80, tag: 'Streams' },
  'sunday-ticket': { kind: 'share', seats: 3, solo: 35, tag: 'Household' },
  costco: { kind: 'household', seats: 2, solo: 5.42, tag: 'Card + household' },
  walmart: { kind: 'household', seats: 2, solo: 8.17, tag: '2 adults' },
  'sams-club': { kind: 'household', seats: 2, solo: 10, tag: 'Extra card' },
  bjs: { kind: 'household', seats: 2, solo: 9, tag: 'Extra card' },
  aaa: { kind: 'family', seats: 5, solo: 10, tag: 'Associates' },
  rei: { kind: 'household', seats: 2, solo: 0, tag: 'Household' },
  'uber-one': { kind: 'household', seats: 2, solo: 9.99, tag: 'Member + family' },
  doordash: { kind: 'household', seats: 2, solo: 9.99, tag: 'Household' },
  clear: { kind: 'family', seats: 4, solo: 16, tag: 'Family lane' },
  'national-parks': { kind: 'pass', seats: 4, solo: 6.67, tag: 'Vehicle pass' },
  'disney-pass': { kind: 'pass', seats: 4, solo: 0, tag: 'Park pass' },
  'universal-pass': { kind: 'pass', seats: 4, solo: 0, tag: 'Park pass' },
  ikon: { kind: 'pass', seats: 4, solo: 0, tag: 'Share days' },
  epic: { kind: 'pass', seats: 4, solo: 0, tag: 'Share days' },
  citypass: { kind: 'pass', seats: 4, solo: 0, tag: 'City pack' },
  acorns: { kind: 'family', seats: 4, solo: 5, tag: 'Kids + adults' },
  equinox: { kind: 'household', seats: 2, solo: 0, tag: 'Dual / guest' },
  'season-tickets': { kind: 'share', seats: 4, solo: 0, tag: 'Shared row' },
  classpass: { kind: 'share', seats: 4, solo: 19, tag: 'Credit pot' },
  slack: { kind: 'seat', seats: 1, solo: 8.75, tag: 'Per seat' },
  notion: { kind: 'seat', seats: 1, solo: 10, tag: 'Per seat' },
  linear: { kind: 'seat', seats: 1, solo: 8, tag: 'Per seat' },
  zoom: { kind: 'seat', seats: 1, solo: 15.99, tag: 'Per seat' },
  discord: { kind: 'seat', seats: 1, solo: 9.99, tag: 'Per seat' },
  gusto: { kind: 'seat', seats: 1, solo: 40, tag: 'Per person' },
};

export function buyMeta(id: string): BuyMeta | undefined {
  return META[id];
}

export function buyTag(id: string): string | undefined {
  const meta = META[id];
  if (!meta) return undefined;
  return meta.kind === 'seat' ? meta.tag : `Cheaper together · ${meta.tag}`;
}

export function circlePeople(team?: Team): number {
  const members = team?.members.length ?? 0;
  const ways = team?.split.mode === 'equal' ? team.split.ways : 0;
  return Math.max(members, ways);
}

export function dealFor(id: string, people: number): BuyDeal | undefined {
  const service = getService(id);
  const meta = META[id];
  if (!service || !meta) return undefined;
  const bill = serviceMonthly(id);
  const headcount = Math.max(people, 1);
  if (meta.kind === 'seat') {
    return {
      id,
      name: service.name,
      tag: meta.tag,
      line: `${money(bill)} each · more people raises the bill`,
      filled: headcount,
      seats: 0,
      save: 0,
    };
  }
  const seats = meta.seats;
  const filled = Math.min(headcount, seats);
  const each = bill > 0 ? shareAmount(bill, Math.max(headcount, 1)) : 0;
  const soloBill = meta.solo > 0 ? meta.solo * filled : 0;
  const save = soloBill > 0 && bill > 0 ? Math.max(0, Math.round((soloBill - bill) * 100) / 100) : 0;
  const over = headcount > seats;
  const parts = [
    `${filled} of ${seats} seats`,
    each ? `${money(each)} each` : undefined,
    save > 0 ? `saves ${money(save)} vs solo` : undefined,
    over ? `over by ${headcount - seats}` : undefined,
  ].filter(Boolean);
  return {
    id,
    name: service.name,
    tag: meta.tag,
    line: parts.join(' · '),
    filled,
    seats,
    save,
  };
}

export function circleDeals(team?: Team): BuyDeal[] {
  const people = circlePeople(team);
  return (team?.serviceIds ?? [])
    .map((id) => dealFor(id, people))
    .filter((item): item is BuyDeal => Boolean(item));
}

export function powerSteps(team?: Team): PowerStep[] {
  const people = circlePeople(team);
  const deals = circleDeals(team);
  const family = deals.filter((item) => item.seats > 0);
  const seatsFilled = family.length === 0 ? people > 1 : family.some((item) => item.filled >= 2);
  const cash = fundsTotal(team?.books ?? { funds: [], borrow: [] });
  const credit = borrowHeadroom(team?.books ?? { funds: [], borrow: [] });
  const hasCard = (team?.books.borrow.length ?? 0) > 0;
  const splitting = team?.split.mode === 'equal';
  const routed = splitting && team?.split.route !== 'none';
  const venmo = team?.split.route === 'venmo';
  const connected = (team?.members ?? []).filter((person) => venmoTag(person.venmo)).length;
  const collectDetail = !splitting
    ? 'Turn on a split'
    : !routed
      ? 'Pick Venmo'
      : venmo
        ? `${connected}/${team?.members.length ?? 0} Venmo`
        : 'Requests armed';

  return [
    {
      id: 'seats',
      label: 'Seats',
      detail: people ? `${people} people` : 'Add people',
      done: seatsFilled,
    },
    {
      id: 'cash',
      label: 'Cash',
      detail: cash ? money(cash) : 'Pool a pot',
      done: cash > 0,
    },
    {
      id: 'credit',
      label: 'Credit',
      detail: credit ? money(credit) : hasCard ? 'No headroom' : 'Park a card',
      done: credit > 0,
    },
    {
      id: 'collect',
      label: 'Collect',
      detail: collectDetail,
      done: Boolean(routed),
    },
  ];
}

export function fundIdeas(team?: Team): FundIdea[] {
  const ids = new Set(team?.serviceIds ?? []);
  const names = new Set((team?.books.funds ?? []).map((item) => item.name.trim().toLowerCase()));
  const cards = new Set((team?.books.borrow ?? []).map((item) => item.name.trim().toLowerCase()));
  const ideas: FundIdea[] = [];
  const addFund = (idea: FundIdea) => {
    if (!names.has(idea.name.toLowerCase())) ideas.push(idea);
  };
  const addCard = (idea: FundIdea) => {
    if (!cards.has(idea.name.toLowerCase())) ideas.push(idea);
  };

  if (ids.has('costco') || ids.has('sams-club') || ids.has('bjs') || ids.has('walmart')) {
    addFund({
      kind: 'fund',
      name: 'Club run',
      target: '200',
      note: 'One cart, one checkout. Split after the receipt.',
    });
  }
  if (ids.has('season-tickets') || ids.has('ticketmaster') || ids.has('stubhub') || ids.has('seatgeek')) {
    addFund({
      kind: 'fund',
      name: 'Seats pot',
      target: '400',
      note: 'Commit the row before the on-sale.',
    });
  }
  if (
    ids.has('disney-pass') ||
    ids.has('universal-pass') ||
    ids.has('ikon') ||
    ids.has('epic') ||
    ids.has('citypass') ||
    ids.has('airbnb')
  ) {
    addFund({
      kind: 'fund',
      name: 'Trip float',
      target: '600',
      note: 'Deposit as one buyer, settle inside the circle.',
    });
  }
  if (ids.has('classpass') || ids.has('equinox')) {
    addFund({
      kind: 'fund',
      name: 'Credits',
      target: '80',
      note: 'A shared pot of classes instead of extra memberships.',
    });
  }
  if (ideas.filter((item) => item.kind === 'fund').length === 0) {
    addFund({
      kind: 'fund',
      name: 'Circle float',
      target: '100',
      note: 'Cash on hand so the host can close a buy.',
    });
  }
  addCard({
    kind: 'borrow',
    name: 'Host card',
    limit: '500',
    note: 'Named payer. The circle refills it on the split.',
  });
  return ideas;
}
