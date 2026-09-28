import * as Linking from 'expo-linking';

import type { PaymentRoute } from '@/types';

export const PAYMENT_OPTIONS: { id: PaymentRoute; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'venmo', label: 'Venmo' },
  { id: 'cashapp', label: 'Cash App' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'zelle', label: 'Zelle' },
];

export function cleanHandle(handle: string): string {
  return handle.replace(/^[@$]/, '').trim();
}

export function venmoTag(handle?: string): string | undefined {
  const id = cleanHandle(handle ?? '');
  return id ? `@${id}` : undefined;
}

export function paymentUrl(
  route: PaymentRoute,
  handle: string,
  amount: number,
  note: string,
): string | null {
  const id = encodeURIComponent(cleanHandle(handle));
  if (!id) return null;
  const amt = amount.toFixed(2);
  const encodedNote = encodeURIComponent(note);

  switch (route) {
    case 'venmo':
      return `https://venmo.com/${id}?txn=charge&amount=${amt}&note=${encodedNote}`;
    case 'cashapp':
      return `https://cash.app/$${id}/${amt}`;
    case 'paypal':
      return `https://www.paypal.com/paypalme/${id}/${amt}`;
    default:
      return null;
  }
}

export async function openPayment(
  route: PaymentRoute,
  handle: string,
  amount: number,
  note: string,
): Promise<boolean> {
  const url = paymentUrl(route, handle, amount, note);
  if (!url) return false;
  await Linking.openURL(url);
  return true;
}
