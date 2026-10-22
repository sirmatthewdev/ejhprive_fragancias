import { atom, computed } from 'nanostores';
import type { FormatId } from '../data/products';
import { remaining, type Stock } from './stock';

export interface CartLine {
  slug: string;
  name: string;
  brand: string;
  fmt: FormatId;
  qty: number;
  price: number | null;
  img: string;
  href: string;
  /** stock snapshot of the fragrance when it was last added; used to cap quantities */
  stock?: Stock | null;
}

const KEY = 'ejh-cart-v1';

const VALID: FormatId[] = ['3', '5', '100'];

function load(): CartLine[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    // drop lines from older versions of the shop (e.g. the former 10 ml decant) or tampered data
    return Array.isArray(raw) ? raw.filter((l) => l && VALID.includes(l.fmt) && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 9) : [];
  } catch { return []; }
}

export const $cart = atom<CartLine[]>([]);
export const $cartOpen = atom(false);
export const $count = computed($cart, (l) => l.reduce((n, x) => n + x.qty, 0));
export const $subtotal = computed($cart, (l) =>
  l.some((x) => x.price == null) ? null : l.reduce((n, x) => n + (x.price ?? 0) * x.qty, 0),
);

let hydrated = false;
export function hydrateCart() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  $cart.set(load());
  $cart.listen((l) => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { /* private mode */ } });
  window.addEventListener('storage', (e) => { if (e.key === KEY) $cart.set(load()); });
}

const same = (a: CartLine, slug: string, fmt: FormatId) => a.slug === slug && a.fmt === fmt;

const linesOf = (slug: string) => $cart.get().filter((x) => x.slug === slug);

/** Units of this format that can still be added, counting what the bag already holds. */
export const roomFor = (slug: string, fmt: FormatId, stock: Stock | null | undefined) => remaining(stock, linesOf(slug), fmt);

/** Adds up to the available stock. Returns how many units were actually added. */
export function addToCart(line: Omit<CartLine, 'qty'>, qty = 1) {
  const n = Math.min(qty, roomFor(line.slug, line.fmt, line.stock));
  if (n <= 0) return 0;
  const l = $cart.get().map((x) => (x.slug === line.slug ? { ...x, stock: line.stock } : x)); // refresh snapshot
  const hit = l.find((x) => same(x, line.slug, line.fmt));
  $cart.set(hit ? l.map((x) => (x === hit ? { ...x, qty: x.qty + n } : x)) : [...l, { ...line, qty: n }]);
  $cartOpen.set(true);
  return n;
}

/** Sets a line quantity, never above what the stock allows. */
export function setQty(slug: string, fmt: FormatId, qty: number) {
  const line = $cart.get().find((x) => same(x, slug, fmt));
  if (!line) return;
  const max = line.qty + roomFor(slug, fmt, line.stock);
  const next = Math.min(qty, max);
  $cart.set($cart.get().flatMap((x) => (same(x, slug, fmt) ? (next <= 0 ? [] : [{ ...x, qty: next }]) : [x])));
}

export const clearCart = () => $cart.set([]);

/** Asks the shop for current stock of the given fragrances. */
export async function fetchStock(slugs: string[]): Promise<Record<string, { active: boolean; stock: Stock | null }> | null> {
  if (!slugs.length) return {};
  try {
    const r = await fetch(`/api/stock/?slugs=${encodeURIComponent([...new Set(slugs)].join(','))}`, { cache: 'no-store' });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

/**
 * Re-checks the whole bag against current stock: refreshes snapshots and lowers (or removes) lines
 * that no longer fit. Returns a human message when something had to change.
 */
export async function syncCartStock(): Promise<string | null> {
  const lines = $cart.get();
  const live = await fetchStock(lines.map((l) => l.slug));
  if (!live) return null;
  const changed: string[] = [];
  const next: CartLine[] = [];
  // bottles first, then larger decants, so the most valuable lines keep their units
  const order: FormatId[] = ['100', '5', '3'];
  for (const slug of [...new Set(lines.map((l) => l.slug))]) {
    const info = live[slug];
    const own = lines.filter((l) => l.slug === slug).sort((a, b) => order.indexOf(a.fmt) - order.indexOf(b.fmt));
    const kept: CartLine[] = [];
    for (const l of own) {
      if (info && !info.active) { changed.push(`${l.name} ya no está disponible`); continue; }
      const stock = info?.stock ?? l.stock ?? null;
      const room = remaining(stock, kept.map((k) => ({ fmt: k.fmt, qty: k.qty })), l.fmt);
      const qty = Math.min(l.qty, room);
      if (qty < l.qty) changed.push(qty ? `${l.name} (${fmtLabel(l.fmt)}): quedan ${qty}` : `${l.name} (${fmtLabel(l.fmt)}) se agotó`);
      if (qty > 0) kept.push({ ...l, qty, stock });
    }
    next.push(...kept);
  }
  // keep the original order of the lines in the bag
  const pos = (l: CartLine) => lines.findIndex((x) => same(x, l.slug, l.fmt));
  $cart.set(next.sort((a, b) => pos(a) - pos(b)));
  return changed.length ? `Ajustamos tu bolsa al stock disponible: ${changed.join(' · ')}.` : null;
}

export const fmtLabel = (fmt: FormatId) => (fmt === '100' ? 'Frasco 100 ml' : `Decant ${fmt} ml`);
export const money = (n: number | null) =>
  n == null ? 'A confirmar' : new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
/** "-15%" style label for an offer, or null. */
export const discount = (regular: number | null, price: number | null) =>
  regular && price != null && price < regular ? `-${Math.round((1 - price / regular) * 100)}%` : null;
