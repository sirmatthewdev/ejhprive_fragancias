/**
 * Category pages (brand, olfactive family, audience), built from the live catalogue: a category exists while it
 * has visible products and is only offered to Google from MIN_INDEXABLE products on, so there are never empty or
 * near-duplicate pages. Texts come from the panel and from each product's own sheet.
 */
import type { Product } from '../data/products';
import { getFamilies, hasContent, visibleProducts } from './catalog';
import { cachePage, getCatalog, type FamilyInfo, type Live } from './cms';
import { getHome, homeIsLive, type Brand } from './home';
import { fitTitle, joinAnd, listUpTo, slugify } from './seo';
import { SITE } from '../config/site';

export const MIN_INDEXABLE = 2;
export const DECANTS_URL = '/decants/';
export const brandUrl = (brand: string) => `/marcas/${slugify(brand)}/`;
export const familyUrl = (family: string) => `/familias/${slugify(family)}/`;

const AUDIENCES: { slug: string; gender: Product['gender']; name: string; h1: string }[] = [
  { slug: 'hombre', gender: 'Masculina', name: 'Hombre', h1: 'Perfumes para hombre' },
  { slug: 'mujer', gender: 'Femenina', name: 'Mujer', h1: 'Perfumes para mujer' },
  { slug: 'unisex', gender: 'Unisex', name: 'Unisex', h1: 'Perfumes unisex' },
];
export const audienceUrl = (gender: Product['gender']) => `/perfumes/${AUDIENCES.find((a) => a.gender === gender)!.slug}/`;

export interface Category {
  path: string;
  kicker: string;
  /** short name, for breadcrumbs */
  name: string;
  h1: string;
  title: string;
  description: string;
  intro: string[];
  products: Product[];
  indexable: boolean;
  /** the catalogue with this category's filter applied, for people who want to combine filters */
  filterHref: string;
}

/** The brand as written in the panel's «Marcas» («French Avenue»), else as the product has it. */
export const brandName = (brand: string, brands: Brand[]) => brands.find((b) => slugify(b.name) === slugify(brand))?.name ?? brand;

/** The notes most of these products share (in at least two pyramids): «vainilla, haba tonka y ámbar». */
function commonNotes(products: Product[]): string {
  const n = new Map<string, number>();
  for (const p of products) {
    for (const note of new Set([...p.notes.top, ...p.notes.heart, ...p.notes.base].map((x) => x.toLowerCase()))) n.set(note, (n.get(note) ?? 0) + 1);
  }
  return joinAnd([...n].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([note]) => note));
}

const FORMATS_TEXT = 'en frasco sellado de 100 ml o en decants de 3 y 5 ml preparados del frasco original';
const count = (n: number) => `${n} ${n === 1 ? 'fragancia' : 'fragancias'}`;
const names = (products: Product[]) => listUpTo(products.map((p) => p.name), 45);
const notesText = (products: Product[]) => { const n = commonNotes(products); return n ? ` Las notas que más se repiten: ${n}.` : ''; };
const titled = (...options: string[]) => fitTitle(...options.map((t) => `${t} | ${SITE.name}`));

const build = (c: Omit<Category, 'indexable'>): Category | null =>
  c.products.length ? { ...c, indexable: c.products.filter(hasContent).length >= MIN_INDEXABLE } : null;

export interface CategoryData { products: Product[]; families: FamilyInfo[]; brands: Brand[] }

export function brandCategory(slug: string, { products, brands }: CategoryData): Category | null {
  const own = products.filter((p) => slugify(p.brand) === slug);
  if (!own.length) return null;
  const name = brandName(own[0].brand, brands);
  const house = brands.find((b) => slugify(b.name) === slug)?.house?.text;
  return build({
    path: brandUrl(name), kicker: 'Marca', name, h1: `Perfumes ${name}`, products: own,
    title: titled(`Perfumes ${name} Originales en Perú`, `Perfumes ${name}`),
    description: `Perfumes ${name} originales en Perú: ${names(own)}. Frasco de 100 ml o decants de 3 y 5 ml, con envío a todo el país.`,
    intro: [...(house ? [house] : []), `${count(own.length)} ${name} ${own.length === 1 ? 'original' : 'originales'}, ${FORMATS_TEXT}.${notesText(own)}`],
    filterHref: `/productos/?marca=${encodeURIComponent(own[0].brand)}`,
  });
}

export function familyCategory(slug: string, { products, families }: CategoryData): Category | null {
  const f = families.find((x) => slugify(x.id) === slug);
  if (!f) return null;
  const own = products.filter((p) => p.family === f.id);
  const name = f.id.toLowerCase();
  return build({
    path: familyUrl(f.id), kicker: 'Familia olfativa', name: f.id, h1: `Perfumes de familia ${name}`, products: own,
    title: titled(`Perfumes de Familia ${f.id} en Perú`, `Perfumes de Familia ${f.id}`),
    description: `Perfumes originales de familia ${name}: ${names(own)}. Frasco de 100 ml o decants de 3 y 5 ml, con envío a todo el Perú.`,
    intro: [`${f.blurb ? `${f.blurb}. ` : ''}${count(own.length)} de familia ${name}, ${FORMATS_TEXT}.${notesText(own)}`],
    filterHref: `/productos/?familia=${encodeURIComponent(f.id)}`,
  });
}

/** Unisex scents are listed under both Hombre and Mujer, as in the catalogue's filter. */
export function audienceCategory(slug: string, { products }: CategoryData): Category | null {
  const a = AUDIENCES.find((x) => x.slug === slug);
  if (!a) return null;
  const unisex = a.gender === 'Unisex' ? [] : products.filter((p) => p.gender === 'Unisex');
  const own = [...products.filter((p) => p.gender === a.gender), ...unisex];
  return build({
    path: audienceUrl(a.gender), kicker: 'Para quién', name: a.name, h1: a.h1, products: own,
    title: titled(a.gender === 'Unisex' ? 'Perfumes Unisex Originales en Perú' : `Perfumes para ${a.name} Originales en Perú`),
    description: `${a.h1} originales en Perú: ${names(own)}. Frasco de 100 ml o decants de 3 y 5 ml, con envío a todo el país.`,
    intro: [`${count(own.length)}${unisex.length ? ` (${unisex.length} unisex)` : ''}, ${FORMATS_TEXT}.${notesText(own)}`],
    filterHref: `/productos/?para=${encodeURIComponent(a.gender)}`,
  });
}

/** Every category with products right now, for links and the sitemap. */
export function allCategories(d: CategoryData): Category[] {
  return [
    ...AUDIENCES.map((a) => audienceCategory(a.slug, d)),
    ...[...new Set(d.products.map((p) => slugify(p.brand)))].map((s) => brandCategory(s, d)),
    ...d.families.map((f) => familyCategory(slugify(f.id), d)),
  ].filter((c): c is Category => !!c);
}

/** Most recent change among these products, for the sitemap. */
export const lastChange = (products: Product[], cat: Map<string, Live> | null): string | undefined =>
  products.map((p) => cat?.get(p.slug)?.updatedAt).filter((d): d is string => !!d).sort().at(-1);

/** The live catalogue with its families and brands. `live` = the panel answered (nothing is the built-in fallback). */
export async function getCategoryData() {
  const [catalog, families, home] = await Promise.all([getCatalog(), getFamilies(), getHome()]);
  return { catalog, families, brands: home.brandList, products: visibleProducts(catalog), live: !!catalog && homeIsLive() };
}

/**
 * Loads a category page: the category itself, or the response to send instead (its lowercase address, «not found»,
 * or «try later» when the panel is down and the category can't be ruled out).
 */
export async function loadCategory(
  kind: (slug: string, d: CategoryData) => Category | null,
  slug: string, base: string, response: { headers: Headers },
): Promise<{ category: Category; siblings: Category[]; catalog: Map<string, Live> | null } | Response> {
  if (slug !== slug.toLowerCase()) return new Response(null, { status: 301, headers: { Location: `/${base}/${slug.toLowerCase()}/` } });
  const d = await getCategoryData();
  const category = kind(slug, d);
  if (!category) return d.catalog ? new Response(null, { status: 404 }) : unavailable();
  cachePage(response, d.live);
  return { category, siblings: allCategories(d).filter((c) => c.indexable && c.path !== category.path), catalog: d.catalog };
}

/** The panel is unreachable and this page depends on it: a temporary error, so Google keeps the page it knows. */
export const unavailable = () =>
  new Response(`<!doctype html><html lang="es-PE"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Volvemos en un momento | ${SITE.name}</title><body style="background:#0B0A0D;color:#F1E8D8;font-family:sans-serif;display:grid;place-content:center;min-height:100vh;text-align:center;margin:0"><h1>Volvemos en un momento</h1><p><a href="/productos/" style="color:#C9B6E4">Ver la colección</a></p></body></html>`, {
    status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '120', 'Cache-Control': 'no-store' },
  });
