export type Appearance = 'system' | 'light' | 'dark';
export type ThemeName = 'light' | 'dark';
export type PersonSource = 'contact' | 'new';
export type CircleRole = 'host' | 'member';
export type JoinKind = 'service' | 'other';
export type SplitMode = 'none' | 'equal';
export type PaymentRoute = 'none' | 'venmo' | 'cashapp' | 'paypal' | 'zelle';

export type SplitInterval = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type CircleSplit = {
  mode: SplitMode;
  ways: number;
  total?: number;
  route: PaymentRoute;
  handle: string;
  interval: SplitInterval;
  nextAt?: string;
};

export type CircleFund = {
  id: string;
  name: string;
  amount: string;
  target: string;
  note: string;
};

export type CircleBorrow = {
  id: string;
  name: string;
  limit: string;
  used: string;
  note: string;
};

export type CircleBooks = {
  funds: CircleFund[];
  borrow: CircleBorrow[];
};

export type Person = {
  id: string;
  name: string;
  initials: string;
  hue: number;
  source: PersonSource;
  contactId?: string;
  joinedAt?: string;
  venmo?: string;
  paid?: boolean;
};

export type DiscountCode = {
  id: string;
  place: string;
  code: string;
};

export type ShareDetails = {
  login: string;
  password: string;
  extra: string;
};

export type ShareMeta = {
  addedAt: string;
  addedBy: string;
};

export type CircleMessage = {
  id: string;
  text: string;
  author: string;
  at: string;
};

export type Team = {
  id: string;
  name: string;
  description: string;
  gridX: number;
  gridY: number;
  role: CircleRole;
  hostName?: string;
  members: Person[];
  serviceIds: string[];
  sourceIds: string[];
  split: CircleSplit;
  books: CircleBooks;
  discountCodes: DiscountCode[];
  detailsById: Record<string, ShareDetails>;
  shareMetaById: Record<string, ShareMeta>;
  messages: CircleMessage[];
};

export type HomeInterval = 'monthly' | 'quarterly' | 'biannual' | 'yearly';

export type HomeGlyphId =
  | 'house'
  | 'town'
  | 'wrench'
  | 'bolt'
  | 'drop'
  | 'fan'
  | 'leaf'
  | 'bug'
  | 'roof'
  | 'key'
  | 'brush'
  | 'bin'
  | 'parking'
  | 'tax'
  | 'clerk'
  | 'vote'
  | 'ask'
  | 'filter'
  | 'alarm'
  | 'gutter'
  | 'heater'
  | 'vent'
  | 'chimney'
  | 'fridge'
  | 'extinguisher';

export type HomeTrade = {
  id: string;
  catalogId: string;
  name: string;
  phone: string;
  note: string;
};

export type HomeTown = {
  id: string;
  catalogId: string;
  name: string;
  phone: string;
  note: string;
};

export type HomeUpkeep = {
  id: string;
  catalogId: string;
  interval: HomeInterval;
  nextAt?: string;
};

export type HomeState = {
  trades: HomeTrade[];
  town: HomeTown[];
  upkeep: HomeUpkeep[];
};

export type FinanceGlyphId =
  | 'credit'
  | 'cards'
  | 'grow'
  | 'score'
  | 'meter'
  | 'calendar'
  | 'layers'
  | 'search'
  | 'bag'
  | 'cart'
  | 'dining'
  | 'travel'
  | 'gas'
  | 'rotate'
  | 'work'
  | 'shield'
  | 'cash'
  | 'chart'
  | 'umbrella'
  | 'seed'
  | 'school'
  | 'spend';

export type FinanceOrbitId = 'credit' | 'cards' | 'grow';

export type FinanceMetric = {
  id: string;
  catalogId: string;
  value: string;
  note: string;
};

export type FinanceCard = {
  id: string;
  catalogId: string;
  name: string;
  reward: string;
  points: string;
  note: string;
};

export type FinanceVault = {
  id: string;
  catalogId: string;
  amount: string;
  monthly: string;
  note: string;
};

export type FinanceState = {
  credit: FinanceMetric[];
  cards: FinanceCard[];
  vaults: FinanceVault[];
};

export type Settings = {
  captainName: string;
  appearance: Appearance;
  seenTeamsHint: boolean;
};

export type KeelState = {
  teams: Team[];
  home: HomeState;
  finance: FinanceState;
  settings: Settings;
};
