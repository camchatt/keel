import type { CircleBooks, CircleBorrow, CircleFund } from '@/types';

export function emptyBooks(): CircleBooks {
  return { funds: [], borrow: [] };
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeFund(item: Partial<CircleFund>, index: number): CircleFund {
  return {
    id: typeof item.id === 'string' && item.id ? item.id : `fund_${index}`,
    name: asText(item.name),
    amount: asText(item.amount),
    target: asText(item.target),
    note: asText(item.note),
  };
}

function normalizeBorrow(item: Partial<CircleBorrow>, index: number): CircleBorrow {
  return {
    id: typeof item.id === 'string' && item.id ? item.id : `borrow_${index}`,
    name: asText(item.name),
    limit: asText(item.limit),
    used: asText(item.used),
    note: asText(item.note),
  };
}

export function normalizeBooks(books?: Partial<CircleBooks>): CircleBooks {
  return {
    funds: Array.isArray(books?.funds) ? books.funds.map(normalizeFund) : [],
    borrow: Array.isArray(books?.borrow) ? books.borrow.map(normalizeBorrow) : [],
  };
}

export function parseDollars(value?: string): number {
  const n = Number.parseFloat((value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function fundsTotal(books: CircleBooks): number {
  return books.funds.reduce((sum, item) => sum + parseDollars(item.amount), 0);
}

export function borrowHeadroom(books: CircleBooks): number {
  return books.borrow.reduce((sum, item) => {
    const limit = parseDollars(item.limit);
    const used = parseDollars(item.used);
    return sum + Math.max(0, limit - used);
  }, 0);
}
