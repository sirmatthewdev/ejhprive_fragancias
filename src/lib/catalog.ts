/**
 * The product list the shop shows: the fragrances written in code (src/data/products.ts) plus any
 * product created in the panel, which appears on its own with the sheet and photo filled in there.
 * For a code product, every field filled in the panel's «Ficha en la tienda» replaces the built-in one.
 */
import { products as builtIn, relatedOf as builtInRelated, decantPhoto, type Product } from '../data/products';
import placeholder from '../assets/img/product-placeholder.jpg';
import { getCatalog, liveOf, type Details, type Live } from './cms';

const withDetails = (p: Product, d?: Details): Product => {
  if (!d) return p;
  const familyChanged = d.family && d.family !== p.family;
  return {
    ...p,
    gender: d.gender ?? p.gender,
    family: d.family ?? p.family,
    familyLabel: d.familyLabel ?? (familyChanged ? d.family! : p.familyLabel),
    accord: d.accord ?? p.accord,
    desc: d.desc ?? p.desc,
    notes: { top: d.notes.top ?? p.notes.top, heart: d.notes.heart ?? p.notes.heart, base: d.notes.base ?? p.notes.base },
  };
};

const fromPanel = (slug: string, d: Details): Product => ({
  slug, brand: d.brand, name: d.name, gender: d.gender ?? 'Unisex',
  family: d.family, familyLabel: d.familyLabel ?? d.family ?? 'Eau de Parfum',
  accord: d.accord ?? '', desc: d.desc ?? '',
  notes: { top: d.notes.top ?? [], heart: d.notes.heart ?? [], base: d.notes.base ?? [] },
  meters: [], img: placeholder, decant: decantPhoto, related: [],
});

/** Every product, active or not, in display order (code products first, then panel-only ones). */
export function allProducts(cat: Map<string, Live> | null): Product[] {
  const known = new Set(builtIn.map((p) => p.slug));
  const extra = cat ? [...cat].filter(([slug, l]) => !known.has(slug) && l.details?.name).map(([slug, l]) => fromPanel(slug, l.details!)) : [];
  return [...builtIn.map((p) => withDetails(p, cat?.get(p.slug)?.details)), ...extra];
}

/** Products visible in the shop. */
export const visibleProducts = (cat: Map<string, Live> | null) => allProducts(cat).filter((p) => liveOf(cat, p.slug).active);

/** Same as visibleProducts, fetching the catalogue (30 s cache). */
export async function getProducts() {
  const catalog = await getCatalog();
  return { catalog, products: visibleProducts(catalog) };
}

/** Up to three suggestions: the hand-picked ones, else same family, then same audience. */
export function relatedTo(p: Product, list: Product[]): Product[] {
  const others = list.filter((o) => o.slug !== p.slug);
  const picked = builtInRelated(p).filter((r) => others.some((o) => o.slug === r.slug)).map((r) => others.find((o) => o.slug === r.slug)!);
  const rest = [
    ...others.filter((o) => p.family && o.family === p.family),
    ...others.filter((o) => o.gender === p.gender || o.gender === 'Unisex' || p.gender === 'Unisex'),
    ...others,
  ];
  const out = [...picked];
  for (const o of rest) { if (out.length >= 3) break; if (!out.includes(o)) out.push(o); }
  return out.slice(0, 3);
}
