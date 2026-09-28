import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { emptyFinance, getCardItem, getCreditItem, getVaultItem, normalizeFinance } from '@/data/finance';
import { emptyHome, getTradeItem, getUpkeepItem, normalizeHome } from '@/data/home';
import { sampleJoinedCircles } from '@/data/joined';
import { emptyBooks, normalizeBooks } from '@/lib/books';
import { hueFromName, initialsFromName } from '@/lib/grid';
import { createId } from '@/lib/id';
import { defaultSplit, nextRequestAt, normalizeSplit } from '@/lib/split';
import { cleanHandle, venmoTag } from '@/lib/pay';
import { loadState, saveState } from '@/lib/storage';
import type {
  Appearance,
  CircleBooks,
  CircleMessage,
  CircleSplit,
  DiscountCode,
  FinanceCard,
  FinanceMetric,
  FinanceVault,
  HomeTown,
  HomeTrade,
  HomeUpkeep,
  KeelState,
  Person,
  PersonSource,
  ShareDetails,
  ShareMeta,
  Team,
} from '@/types';

function emptyTeam(gridX = 0, gridY = 0): Team {
  return {
    id: createId('team'),
    name: '',
    description: '',
    gridX,
    gridY,
    role: 'host',
    members: [],
    serviceIds: [],
    sourceIds: [],
    split: defaultSplit(),
    books: emptyBooks(),
    discountCodes: [],
    detailsById: {},
    shareMetaById: {},
    messages: [],
  };
}

function normalizePerson(person: Person): Person {
  return {
    ...person,
    joinedAt: typeof person.joinedAt === 'string' ? person.joinedAt : undefined,
    venmo: venmoTag(person.venmo)?.slice(1),
    paid: Boolean(person.paid),
  };
}

function normalizeTeam(team: Team): Team {
  return {
    ...team,
    description: typeof team.description === 'string' ? team.description : '',
    role: team.role === 'member' ? 'member' : 'host',
    hostName: typeof team.hostName === 'string' ? team.hostName : undefined,
    serviceIds: team.serviceIds ?? [],
    sourceIds: team.sourceIds ?? [],
    discountCodes: Array.isArray(team.discountCodes) ? team.discountCodes : [],
    detailsById: team.detailsById && typeof team.detailsById === 'object' ? team.detailsById : {},
    shareMetaById: team.shareMetaById && typeof team.shareMetaById === 'object' ? team.shareMetaById : {},
    messages: Array.isArray(team.messages) ? team.messages : [],
    members: Array.isArray(team.members) ? team.members.map(normalizePerson) : [],
    split: normalizeSplit(team.split),
    books: normalizeBooks(team.books),
  };
}

const initialState: KeelState = {
  teams: [emptyTeam(0, 0), ...sampleJoinedCircles()],
  home: emptyHome(),
  finance: emptyFinance(),
  settings: {
    captainName: '',
    appearance: 'system',
    seenTeamsHint: false,
  },
};

type Action =
  | { type: 'HYDRATE'; state: KeelState }
  | { type: 'RENAME_AT'; gridX: number; gridY: number; name: string }
  | {
      type: 'ADD_MEMBER_AT';
      gridX: number;
      gridY: number;
      name: string;
      source: PersonSource;
      contactId?: string;
    }
  | { type: 'REMOVE_MEMBER'; teamId: string; personId: string }
  | { type: 'PATCH_MEMBER'; teamId: string; personId: string; patch: Partial<Pick<Person, 'venmo' | 'paid'>> }
  | { type: 'SET_SERVICES_AT'; gridX: number; gridY: number; serviceIds: string[] }
  | { type: 'SET_SOURCES_AT'; gridX: number; gridY: number; sourceIds: string[] }
  | { type: 'SET_DISCOUNTS_AT'; gridX: number; gridY: number; discountCodes: DiscountCode[] }
  | { type: 'SET_GROUP_AT'; gridX: number; gridY: number; name: string; description: string }
  | { type: 'SET_SPLIT_AT'; gridX: number; gridY: number; split: CircleSplit }
  | { type: 'FIRE_SPLIT'; gridX: number; gridY: number }
  | { type: 'SET_BOOKS_AT'; gridX: number; gridY: number; books: CircleBooks }
  | { type: 'SET_DETAILS_AT'; gridX: number; gridY: number; itemId: string; details: ShareDetails }
  | { type: 'SET_CAPTAIN'; captainName: string }
  | { type: 'SET_APPEARANCE'; appearance: Appearance }
  | { type: 'SEEN_HINT' }
  | { type: 'PATCH_TRADE'; id: string; patch: Partial<HomeTrade> }
  | { type: 'ADD_TRADE'; catalogId: string }
  | { type: 'REMOVE_TRADE'; id: string }
  | { type: 'PATCH_TOWN'; id: string; patch: Partial<HomeTown> }
  | { type: 'PATCH_UPKEEP'; id: string; patch: Partial<HomeUpkeep> }
  | { type: 'ADD_UPKEEP'; catalogId: string }
  | { type: 'REMOVE_UPKEEP'; id: string }
  | { type: 'ADD_MESSAGE_AT'; gridX: number; gridY: number; text: string }
  | { type: 'PATCH_CREDIT'; id: string; patch: Partial<FinanceMetric> }
  | { type: 'ADD_CREDIT'; catalogId: string }
  | { type: 'REMOVE_CREDIT'; id: string }
  | { type: 'PATCH_FINANCE_CARD'; id: string; patch: Partial<FinanceCard> }
  | { type: 'ADD_FINANCE_CARD'; catalogId: string }
  | { type: 'REMOVE_FINANCE_CARD'; id: string }
  | { type: 'PATCH_VAULT'; id: string; patch: Partial<FinanceVault> }
  | { type: 'ADD_VAULT'; catalogId: string }
  | { type: 'REMOVE_VAULT'; id: string };

function actorName(state: KeelState): string {
  return state.settings.captainName.trim() || 'You';
}

function stampShareMeta(team: Team, ids: string[], by: string, at: string): Record<string, ShareMeta> {
  const next: Record<string, ShareMeta> = {};
  for (const id of ids) {
    next[id] = team.shareMetaById?.[id] ?? { addedAt: at, addedBy: by };
  }
  return next;
}

function upsertTeam(state: KeelState, gridX: number, gridY: number): { teams: Team[]; team: Team } {
  const existing = state.teams.find((team) => team.gridX === gridX && team.gridY === gridY);
  if (existing) return { teams: state.teams, team: existing };
  const team = emptyTeam(gridX, gridY);
  return { teams: [...state.teams, team], team };
}

function reducer(state: KeelState, action: Action): KeelState {
  switch (action.type) {
    case 'HYDRATE': {
      let teams = (action.state.teams?.length ? action.state.teams : initialState.teams).map(normalizeTeam);
      if (!teams.some((team) => team.role === 'member')) {
        teams = [...teams, ...sampleJoinedCircles()];
      }
      return {
        teams,
        home: normalizeHome(action.state.home),
        finance: normalizeFinance(action.state.finance),
        settings: { ...initialState.settings, ...action.state.settings },
      };
    }
    case 'RENAME_AT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      return {
        ...state,
        teams: teams.map((item) => (item.id === team.id ? { ...item, name: action.name } : item)),
      };
    }
    case 'ADD_MEMBER_AT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      const person: Person = {
        id: createId('person'),
        name: action.name,
        initials: initialsFromName(action.name),
        hue: hueFromName(action.name),
        source: action.source,
        contactId: action.contactId,
        joinedAt: new Date().toISOString(),
        paid: false,
      };
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id ? { ...item, members: [...item.members, person] } : item,
        ),
      };
    }
    case 'SET_SERVICES_AT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      const at = new Date().toISOString();
      const by = actorName(state);
      const ids = [...action.serviceIds, ...(team.sourceIds ?? []), ...team.discountCodes.map((item) => item.id)];
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id
            ? {
                ...item,
                serviceIds: action.serviceIds,
                shareMetaById: stampShareMeta({ ...team, serviceIds: action.serviceIds }, ids, by, at),
              }
            : item,
        ),
      };
    }
    case 'SET_SOURCES_AT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      const at = new Date().toISOString();
      const by = actorName(state);
      const ids = [...team.serviceIds, ...action.sourceIds, ...team.discountCodes.map((item) => item.id)];
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id
            ? {
                ...item,
                sourceIds: action.sourceIds,
                shareMetaById: stampShareMeta({ ...team, sourceIds: action.sourceIds }, ids, by, at),
              }
            : item,
        ),
      };
    }
    case 'SET_GROUP_AT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id ? { ...item, name: action.name, description: action.description } : item,
        ),
      };
    }
    case 'SET_DISCOUNTS_AT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      const at = new Date().toISOString();
      const by = actorName(state);
      const ids = [...team.serviceIds, ...(team.sourceIds ?? []), ...action.discountCodes.map((item) => item.id)];
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id
            ? {
                ...item,
                discountCodes: action.discountCodes,
                shareMetaById: stampShareMeta({ ...team, discountCodes: action.discountCodes }, ids, by, at),
              }
            : item,
        ),
      };
    }
    case 'SET_SPLIT_AT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id ? { ...item, split: normalizeSplit(action.split) } : item,
        ),
      };
    }
    case 'FIRE_SPLIT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id
            ? {
                ...item,
                split: {
                  ...item.split,
                  nextAt: nextRequestAt(new Date(), item.split.interval).toISOString(),
                },
                members: item.members.map((person) => ({
                  ...person,
                  paid: Boolean(cleanHandle(person.venmo ?? '')),
                })),
              }
            : item,
        ),
      };
    }
    case 'SET_BOOKS_AT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id ? { ...item, books: normalizeBooks(action.books) } : item,
        ),
      };
    }
    case 'SET_DETAILS_AT': {
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id
            ? { ...item, detailsById: { ...item.detailsById, [action.itemId]: action.details } }
            : item,
        ),
      };
    }
    case 'REMOVE_MEMBER':
      return {
        ...state,
        teams: state.teams.map((team) =>
          team.id === action.teamId
            ? { ...team, members: team.members.filter((person) => person.id !== action.personId) }
            : team,
        ),
      };
    case 'PATCH_MEMBER':
      return {
        ...state,
        teams: state.teams.map((team) =>
          team.id === action.teamId
            ? {
                ...team,
                members: team.members.map((person) =>
                  person.id === action.personId
                    ? {
                        ...person,
                        ...action.patch,
                        venmo:
                          action.patch.venmo !== undefined
                            ? cleanHandle(action.patch.venmo) || undefined
                            : person.venmo,
                      }
                    : person,
                ),
              }
            : team,
        ),
      };
    case 'SET_CAPTAIN':
      return { ...state, settings: { ...state.settings, captainName: action.captainName } };
    case 'SET_APPEARANCE':
      return { ...state, settings: { ...state.settings, appearance: action.appearance } };
    case 'SEEN_HINT':
      return { ...state, settings: { ...state.settings, seenTeamsHint: true } };
    case 'PATCH_TRADE':
      return {
        ...state,
        home: {
          ...state.home,
          trades: state.home.trades.map((item) =>
            item.id === action.id ? { ...item, ...action.patch, id: item.id, catalogId: item.catalogId } : item,
          ),
        },
      };
    case 'ADD_TRADE': {
      if (!getTradeItem(action.catalogId) || state.home.trades.some((item) => item.catalogId === action.catalogId)) {
        return state;
      }
      const trade: HomeTrade = {
        id: `trade_${action.catalogId}`,
        catalogId: action.catalogId,
        name: '',
        phone: '',
        note: '',
      };
      return { ...state, home: { ...state.home, trades: [...state.home.trades, trade] } };
    }
    case 'REMOVE_TRADE': {
      const item = state.home.trades.find((row) => row.id === action.id);
      if (!item || getTradeItem(item.catalogId)?.preset) {
        return {
          ...state,
          home: {
            ...state.home,
            trades: state.home.trades.map((row) =>
              row.id === action.id ? { ...row, name: '', phone: '', note: '' } : row,
            ),
          },
        };
      }
      return { ...state, home: { ...state.home, trades: state.home.trades.filter((row) => row.id !== action.id) } };
    }
    case 'PATCH_TOWN':
      return {
        ...state,
        home: {
          ...state.home,
          town: state.home.town.map((item) =>
            item.id === action.id ? { ...item, ...action.patch, id: item.id, catalogId: item.catalogId } : item,
          ),
        },
      };
    case 'PATCH_UPKEEP':
      return {
        ...state,
        home: {
          ...state.home,
          upkeep: state.home.upkeep.map((item) =>
            item.id === action.id ? { ...item, ...action.patch, id: item.id, catalogId: item.catalogId } : item,
          ),
        },
      };
    case 'ADD_UPKEEP': {
      if (!getUpkeepItem(action.catalogId) || state.home.upkeep.some((item) => item.catalogId === action.catalogId)) {
        return state;
      }
      const catalog = getUpkeepItem(action.catalogId);
      const upkeep: HomeUpkeep = {
        id: `upkeep_${action.catalogId}`,
        catalogId: action.catalogId,
        interval: catalog?.interval ?? 'yearly',
      };
      return { ...state, home: { ...state.home, upkeep: [...state.home.upkeep, upkeep] } };
    }
    case 'REMOVE_UPKEEP': {
      const item = state.home.upkeep.find((row) => row.id === action.id);
      if (!item || getUpkeepItem(item.catalogId)?.preset) {
        return {
          ...state,
          home: {
            ...state.home,
            upkeep: state.home.upkeep.map((row) =>
              row.id === action.id ? { ...row, nextAt: undefined } : row,
            ),
          },
        };
      }
      return { ...state, home: { ...state.home, upkeep: state.home.upkeep.filter((row) => row.id !== action.id) } };
    }
    case 'ADD_MESSAGE_AT': {
      const text = action.text.trim();
      if (!text) return state;
      const { teams, team } = upsertTeam(state, action.gridX, action.gridY);
      const message: CircleMessage = {
        id: createId('msg'),
        text,
        author: actorName(state),
        at: new Date().toISOString(),
      };
      return {
        ...state,
        teams: teams.map((item) =>
          item.id === team.id ? { ...item, messages: [...(item.messages ?? []), message] } : item,
        ),
      };
    }
    case 'PATCH_CREDIT':
      return {
        ...state,
        finance: {
          ...state.finance,
          credit: state.finance.credit.map((item) =>
            item.id === action.id ? { ...item, ...action.patch, id: item.id, catalogId: item.catalogId } : item,
          ),
        },
      };
    case 'ADD_CREDIT': {
      if (!getCreditItem(action.catalogId) || state.finance.credit.some((item) => item.catalogId === action.catalogId)) {
        return state;
      }
      const credit: FinanceMetric = {
        id: `credit_${action.catalogId}`,
        catalogId: action.catalogId,
        value: '',
        note: '',
      };
      return { ...state, finance: { ...state.finance, credit: [...state.finance.credit, credit] } };
    }
    case 'REMOVE_CREDIT': {
      const item = state.finance.credit.find((row) => row.id === action.id);
      if (!item || getCreditItem(item.catalogId)?.preset) {
        return {
          ...state,
          finance: {
            ...state.finance,
            credit: state.finance.credit.map((row) =>
              row.id === action.id ? { ...row, value: '', note: '' } : row,
            ),
          },
        };
      }
      return {
        ...state,
        finance: { ...state.finance, credit: state.finance.credit.filter((row) => row.id !== action.id) },
      };
    }
    case 'PATCH_FINANCE_CARD':
      return {
        ...state,
        finance: {
          ...state.finance,
          cards: state.finance.cards.map((item) =>
            item.id === action.id ? { ...item, ...action.patch, id: item.id, catalogId: item.catalogId } : item,
          ),
        },
      };
    case 'ADD_FINANCE_CARD': {
      if (!getCardItem(action.catalogId) || state.finance.cards.some((item) => item.catalogId === action.catalogId)) {
        return state;
      }
      const card: FinanceCard = {
        id: `card_${action.catalogId}`,
        catalogId: action.catalogId,
        name: '',
        reward: '',
        points: '',
        note: '',
      };
      return { ...state, finance: { ...state.finance, cards: [...state.finance.cards, card] } };
    }
    case 'REMOVE_FINANCE_CARD': {
      const item = state.finance.cards.find((row) => row.id === action.id);
      if (!item || getCardItem(item.catalogId)?.preset) {
        return {
          ...state,
          finance: {
            ...state.finance,
            cards: state.finance.cards.map((row) =>
              row.id === action.id ? { ...row, name: '', reward: '', points: '', note: '' } : row,
            ),
          },
        };
      }
      return {
        ...state,
        finance: { ...state.finance, cards: state.finance.cards.filter((row) => row.id !== action.id) },
      };
    }
    case 'PATCH_VAULT':
      return {
        ...state,
        finance: {
          ...state.finance,
          vaults: state.finance.vaults.map((item) =>
            item.id === action.id ? { ...item, ...action.patch, id: item.id, catalogId: item.catalogId } : item,
          ),
        },
      };
    case 'ADD_VAULT': {
      if (!getVaultItem(action.catalogId) || state.finance.vaults.some((item) => item.catalogId === action.catalogId)) {
        return state;
      }
      const vault: FinanceVault = {
        id: `vault_${action.catalogId}`,
        catalogId: action.catalogId,
        amount: '',
        monthly: '',
        note: '',
      };
      return { ...state, finance: { ...state.finance, vaults: [...state.finance.vaults, vault] } };
    }
    case 'REMOVE_VAULT': {
      const item = state.finance.vaults.find((row) => row.id === action.id);
      if (!item || getVaultItem(item.catalogId)?.preset) {
        return {
          ...state,
          finance: {
            ...state.finance,
            vaults: state.finance.vaults.map((row) =>
              row.id === action.id ? { ...row, amount: '', monthly: '', note: '' } : row,
            ),
          },
        };
      }
      return {
        ...state,
        finance: { ...state.finance, vaults: state.finance.vaults.filter((row) => row.id !== action.id) },
      };
    }
    default:
      return state;
  }
}

type KeelContextValue = {
  state: KeelState;
  hydrated: boolean;
  renameTeamAt: (gridX: number, gridY: number, name: string) => void;
  setGroupAt: (gridX: number, gridY: number, name: string, description: string) => void;
  addMemberAt: (gridX: number, gridY: number, name: string, source: PersonSource, contactId?: string) => void;
  setServicesAt: (gridX: number, gridY: number, serviceIds: string[]) => void;
  setSourcesAt: (gridX: number, gridY: number, sourceIds: string[]) => void;
  setDiscountCodesAt: (gridX: number, gridY: number, discountCodes: DiscountCode[]) => void;
  setSplitAt: (gridX: number, gridY: number, split: CircleSplit) => void;
  fireSplitAt: (gridX: number, gridY: number) => void;
  setBooksAt: (gridX: number, gridY: number, books: CircleBooks) => void;
  setDetailsAt: (gridX: number, gridY: number, itemId: string, details: ShareDetails) => void;
  removeMember: (teamId: string, personId: string) => void;
  patchMember: (teamId: string, personId: string, patch: Partial<Pick<Person, 'venmo' | 'paid'>>) => void;
  setCaptainName: (captainName: string) => void;
  setAppearance: (appearance: Appearance) => void;
  markHintSeen: () => void;
  patchTrade: (id: string, patch: Partial<HomeTrade>) => void;
  addTrade: (catalogId: string) => void;
  removeTrade: (id: string) => void;
  patchTown: (id: string, patch: Partial<HomeTown>) => void;
  patchUpkeep: (id: string, patch: Partial<HomeUpkeep>) => void;
  addUpkeep: (catalogId: string) => void;
  removeUpkeep: (id: string) => void;
  addMessageAt: (gridX: number, gridY: number, text: string) => void;
  patchCredit: (id: string, patch: Partial<FinanceMetric>) => void;
  addCredit: (catalogId: string) => void;
  removeCredit: (id: string) => void;
  patchFinanceCard: (id: string, patch: Partial<FinanceCard>) => void;
  addFinanceCard: (catalogId: string) => void;
  removeFinanceCard: (id: string) => void;
  patchVault: (id: string, patch: Partial<FinanceVault>) => void;
  addVault: (catalogId: string) => void;
  removeVault: (id: string) => void;
};

const KeelContext = createContext<KeelContextValue | null>(null);

export function KeelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useReducer(() => true, false);

  useEffect(() => {
    loadState()
      .then((saved) => {
        if (saved) dispatch({ type: 'HYDRATE', state: saved });
      })
      .finally(() => setHydrated());
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state).catch(() => undefined);
  }, [state, hydrated]);

  const value = useMemo<KeelContextValue>(
    () => ({
      state,
      hydrated,
      renameTeamAt: (gridX, gridY, name) => dispatch({ type: 'RENAME_AT', gridX, gridY, name }),
      setGroupAt: (gridX, gridY, name, description) =>
        dispatch({ type: 'SET_GROUP_AT', gridX, gridY, name, description }),
      addMemberAt: (gridX, gridY, name, source, contactId) =>
        dispatch({ type: 'ADD_MEMBER_AT', gridX, gridY, name, source, contactId }),
      setServicesAt: (gridX, gridY, serviceIds) => dispatch({ type: 'SET_SERVICES_AT', gridX, gridY, serviceIds }),
      setSourcesAt: (gridX, gridY, sourceIds) => dispatch({ type: 'SET_SOURCES_AT', gridX, gridY, sourceIds }),
      setDiscountCodesAt: (gridX, gridY, discountCodes) =>
        dispatch({ type: 'SET_DISCOUNTS_AT', gridX, gridY, discountCodes }),
      setSplitAt: (gridX, gridY, split) => dispatch({ type: 'SET_SPLIT_AT', gridX, gridY, split }),
      fireSplitAt: (gridX, gridY) => dispatch({ type: 'FIRE_SPLIT', gridX, gridY }),
      setBooksAt: (gridX, gridY, books) => dispatch({ type: 'SET_BOOKS_AT', gridX, gridY, books }),
      setDetailsAt: (gridX, gridY, itemId, details) =>
        dispatch({ type: 'SET_DETAILS_AT', gridX, gridY, itemId, details }),
      removeMember: (teamId, personId) => dispatch({ type: 'REMOVE_MEMBER', teamId, personId }),
      patchMember: (teamId, personId, patch) => dispatch({ type: 'PATCH_MEMBER', teamId, personId, patch }),
      setCaptainName: (captainName) => dispatch({ type: 'SET_CAPTAIN', captainName }),
      setAppearance: (appearance) => dispatch({ type: 'SET_APPEARANCE', appearance }),
      markHintSeen: () => dispatch({ type: 'SEEN_HINT' }),
      patchTrade: (id, patch) => dispatch({ type: 'PATCH_TRADE', id, patch }),
      addTrade: (catalogId) => dispatch({ type: 'ADD_TRADE', catalogId }),
      removeTrade: (id) => dispatch({ type: 'REMOVE_TRADE', id }),
      patchTown: (id, patch) => dispatch({ type: 'PATCH_TOWN', id, patch }),
      patchUpkeep: (id, patch) => dispatch({ type: 'PATCH_UPKEEP', id, patch }),
      addUpkeep: (catalogId) => dispatch({ type: 'ADD_UPKEEP', catalogId }),
      removeUpkeep: (id) => dispatch({ type: 'REMOVE_UPKEEP', id }),
      addMessageAt: (gridX, gridY, text) => dispatch({ type: 'ADD_MESSAGE_AT', gridX, gridY, text }),
      patchCredit: (id, patch) => dispatch({ type: 'PATCH_CREDIT', id, patch }),
      addCredit: (catalogId) => dispatch({ type: 'ADD_CREDIT', catalogId }),
      removeCredit: (id) => dispatch({ type: 'REMOVE_CREDIT', id }),
      patchFinanceCard: (id, patch) => dispatch({ type: 'PATCH_FINANCE_CARD', id, patch }),
      addFinanceCard: (catalogId) => dispatch({ type: 'ADD_FINANCE_CARD', catalogId }),
      removeFinanceCard: (id) => dispatch({ type: 'REMOVE_FINANCE_CARD', id }),
      patchVault: (id, patch) => dispatch({ type: 'PATCH_VAULT', id, patch }),
      addVault: (catalogId) => dispatch({ type: 'ADD_VAULT', catalogId }),
      removeVault: (id) => dispatch({ type: 'REMOVE_VAULT', id }),
    }),
    [state, hydrated],
  );

  return <KeelContext.Provider value={value}>{children}</KeelContext.Provider>;
}

export function useKeel() {
  const value = useContext(KeelContext);
  if (!value) throw new Error('useKeel must be used inside KeelProvider');
  return value;
}
