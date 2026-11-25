/**
 * Stock rules shared by the browser (bag, buy box) and the server (order endpoint).
 * Mirrors cms/src/inventory.ts: a 100 ml bottle takes a sealed bottle; decants are poured only
 * from the ml the team has opened for decants (sealed bottles are never opened automatically).
 * The 3 ml and 5 ml decants share that ml pool.
 */
import type { FormatId } from '../data/products';

export interface Stock { sealed: number; decantMl: number }
export const ML: Record<FormatId, number> = { '3': 3, '5': 5, '100': 100 };
export const MAX_PER_LINE = 9;

/**
 * The stock the browser gets to see: capped at the most a bag can hold of one fragrance, so the page and
 * /api/stock enforce the same limits without publishing the real inventory.
 */
export const publicStock = (s: Stock | null): Stock | null =>
  s && { sealed: Math.min(s.sealed, MAX_PER_LINE), decantMl: Math.min(s.decantMl, MAX_PER_LINE * (ML['3'] + ML['5'])) };

type Line = { fmt: FormatId; qty: number };

/** Can this set of lines (one fragrance) be served from the stock? */
export function fits(stock: Stock, lines: Line[]) {
  const bottles = lines.filter((l) => l.fmt === '100').reduce((n, l) => n + l.qty, 0);
  const ml = lines.filter((l) => l.fmt !== '100').reduce((n, l) => n + ML[l.fmt] * l.qty, 0);
  return bottles <= stock.sealed && ml <= stock.decantMl;
}

/**
 * How many more units of `fmt` can be added on top of what the bag already holds for this fragrance.
 * Unknown stock (CMS unreachable) is not blocked here; the server validates the order.
 */
export function remaining(stock: Stock | null | undefined, inBag: Line[], fmt: FormatId) {
  const current = inBag.find((l) => l.fmt === fmt)?.qty ?? 0;
  const room = MAX_PER_LINE - current;
  if (!stock) return Math.max(0, room);
  let k = 0;
  while (k < room && fits(stock, [...inBag.filter((l) => l.fmt !== fmt), { fmt, qty: current + k + 1 }])) k++;
  return k;
}
