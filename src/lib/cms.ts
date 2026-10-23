/**
 * Server-side bridge to the Payload CMS (prices, stock, visibility, orders).
 * The storefront authenticates with the "Tienda (API)" user's key and never exposes it to the browser.
 * If the CMS is unreachable the shop keeps working with local data and "A confirmar" prices.
 */
import { CMS_API_KEY, CMS_URL } from 'astro:env/server';
import type { FormatId } from '../data/products';
import { fits, type Stock } from './stock';

export interface Live {
  id: number;
  active: boolean;
  /** undefined = use the storefront default; '' / null from the CMS = no tag */
  tag?: string | null;
  /** price = what the customer pays (sale when an offer is running); regular is shown struck through */
  prices: Record<FormatId, Price>;
  available: Record<FormatId, boolean>;
  /** null when the CMS is unreachable (stock unknown) */
  stock: Stock | null;
}
export interface Price { price: number | null; regular: number | null; onSale: boolean }

const priceOf = (d: any, f: FormatId): Price => {
  const regular = d.prices?.[`p${f}`] ?? null, sale = d.prices?.[`s${f}`] ?? null;
  const running = !d.prices?.saleEndsAt || new Date(d.prices.saleEndsAt) > new Date();
  const onSale = sale != null && running && (regular == null || sale < regular);
  return { price: onSale ? sale : regular, regular, onSale };
};
const NO_PRICE: Price = { price: null, regular: null, onSale: false };

const TTL = 30_000;
let cache: { at: number; data: Map<string, Live> } | null = null;
const auth = () => ({ Authorization: `users API-Key ${CMS_API_KEY}` });
const ML: Record<FormatId, number> = { '3': 3, '5': 5, '100': 100 };

let inflight: Promise<Map<string, Live> | null> | null = null;

async function fetchCatalog(): Promise<Map<string, Live> | null> {
  if (!CMS_API_KEY) { inflight = null; return null; } // CMS not configured (e.g. first deploy): local data only
  try {
    const r = await fetch(`${CMS_URL}/api/products?limit=100&depth=0`, { headers: auth(), signal: AbortSignal.timeout(2500) });
    if (!r.ok) throw new Error(`CMS ${r.status}`);
    const { docs } = (await r.json()) as { docs: any[] };
    const data = new Map<string, Live>();
    for (const d of docs) {
      const sealed = d.stock?.sealed ?? 0, ml = d.stock?.decantMl ?? 0;
      const can = (f: FormatId) => (f === '100' ? sealed > 0 : ml >= ML[f]);
      data.set(d.slug, {
        id: d.id, active: d.active !== false, tag: d.tag || null,
        prices: { '3': priceOf(d, '3'), '5': priceOf(d, '5'), '100': priceOf(d, '100') },
        available: { '3': can('3'), '5': can('5'), '100': can('100') },
        stock: { sealed, decantMl: ml },
      });
    }
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.warn('[cms] catálogo no disponible, uso datos locales:', (e as Error).message);
    return cache?.data ?? null;
  } finally {
    inflight = null;
  }
}

/**
 * Stale-while-revalidate: a fresh cache is returned as is; a stale one is returned immediately
 * while a single background request refreshes it, so page renders never wait on the CMS.
 */
export async function getCatalog(opts: { fresh?: boolean } = {}): Promise<Map<string, Live> | null> {
  // fresh: pages and endpoints that decide what can be bought always ask the CMS (falls back to cache if it's down)
  if (opts.fresh) { inflight ??= fetchCatalog(); return inflight; }
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  inflight ??= fetchCatalog();
  return cache ? cache.data : inflight;
}

/** Live info for one product, with safe defaults when the CMS is down. */
export const liveOf = (cat: Map<string, Live> | null, slug: string): Live =>
  cat?.get(slug) ?? { id: 0, active: true, tag: undefined, prices: { '3': NO_PRICE, '5': NO_PRICE, '100': NO_PRICE }, available: { '3': true, '5': true, '100': true }, stock: null };

export interface OrderInput {
  customer: { name: string; phone: string; email?: string; delivery: 'envio' | 'retiro'; department?: string; province?: string; district?: string; address?: string; reference?: string; message?: string };
  items: { slug: string; fmt: FormatId; qty: number }[];
}

export async function createOrder(input: OrderInput): Promise<{ number: string }> {
  const cat = await getCatalog({ fresh: true });
  if (!cat) throw new Error('CMS no disponible');
  const items = input.items.map((i) => {
    const p = cat.get(i.slug);
    if (!p?.active) throw new Error(`Producto no disponible: ${i.slug}`);
    return { product: p.id, format: i.fmt, qty: i.qty };
  });
  // the whole order, per fragrance, must fit in its stock (formats share the same bottles)
  for (const slug of new Set(input.items.map((i) => i.slug))) {
    const p = cat.get(slug)!;
    const lines = input.items.filter((i) => i.slug === slug).map((i) => ({ fmt: i.fmt, qty: i.qty }));
    if (p.stock && !fits(p.stock, lines)) throw new Error(`Sin stock: ${slug}`);
  }
  const r = await fetch(`${CMS_URL}/api/orders`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: input.customer, items }),
    signal: AbortSignal.timeout(6000),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.errors?.[0]?.message ?? `CMS ${r.status}`);
  if (cache) cache.at = 0; // stock may change soon after: refresh on the next render
  return { number: body.doc.number };
}

export interface ComplaintInput {
  consumer: { name: string; docType: string; docNumber: string; phone: string; email: string; address: string; guardian?: string };
  item: { type: 'producto' | 'servicio'; amount?: number; order?: string; description: string };
  kind: 'reclamo' | 'queja';
  detail: string;
  request: string;
}

/** Registers a Libro de Reclamaciones sheet; returns its correlative number and response deadline. */
export async function createComplaint(input: ComplaintInput): Promise<{ number: string; dueAt: string; createdAt: string }> {
  const r = await fetch(`${CMS_URL}/api/complaints`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(6000),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.errors?.[0]?.message ?? `CMS ${r.status}`);
  return { number: body.doc.number, dueAt: body.doc.dueAt, createdAt: body.doc.createdAt };
}
