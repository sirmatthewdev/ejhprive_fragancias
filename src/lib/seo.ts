/**
 * URLs, titles and structured data shared by every page. Structured data only states what the page shows:
 * no price, rating, code or policy that the shop doesn't really have.
 */
import { SITE, SOCIALS } from '../config/site';
import { FORMATS, productUrl, type FormatId, type Product } from '../data/products';
import type { Live } from './cms';

type Ld = Record<string, unknown>;

/** Absolute URL on the shop's own domain. */
export const abs = (path: string, site: URL | undefined) => new URL(path, site ?? SITE.url).href;

/** One address per page: with a trailing slash and without parameters (filters, preselected format, campaign tags). */
export const canonicalUrl = (pathname: string, site: URL | undefined) => abs(pathname.replace(/\/*$/, '/'), site);

/** Lowercase, accent-free path segment: «Ámbar especiada» → «ambar-especiada». */
export const slugify = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** First title that fits a result on Google (~60 characters), from the most to the least descriptive. */
export const fitTitle = (...options: string[]) => options.find((t) => t.length <= 60) ?? options.at(-1)!;

/** Joins names until the text would pass `max` characters: «Khamrah, 9 PM, Asad y más». */
export function listUpTo(names: string[], max: number): string {
  const out: string[] = [];
  for (const n of names) {
    if ([...out, n].join(', ').length > max) break;
    out.push(n);
  }
  if (out.length < names.length) return `${out.join(', ')} y más`;
  return joinAnd(out);
}

/** «a, b y c» */
export const joinAnd = (v: string[]) => (v.length > 1 ? `${v.slice(0, -1).join(', ')} ${/^h?i(?!e)/i.test(v.at(-1)!) ? 'e' : 'y'} ${v.at(-1)}` : v.join(''));

/**
 * Text written while a policy is pending («[Política a confirmar…]»). It is a note for the team, not content:
 * it is kept out of the page and of the structured data until the real text replaces it.
 */
export const isPlaceholder = (v: string) => /^\s*\[/.test(v);

// ---- structured data ----
const ORG = '/#organizacion';
const WEBSITE = '/#sitio';

/** The shop and its website: on every page, so the other entities can point to them. */
export const siteGraph = (site: URL | undefined): Ld[] => [
  {
    '@type': 'OnlineStore', '@id': abs(ORG, site), name: SITE.name, url: abs('/', site), description: SITE.description,
    logo: { '@type': 'ImageObject', url: abs('/icon-512.png', site), width: 512, height: 512 },
    image: abs('/media/og.jpg', site),
    ...(SITE.legal.businessName && { legalName: SITE.legal.businessName }),
    ...(SITE.legal.ruc && { taxID: SITE.legal.ruc }),
    ...(SITE.email && { email: SITE.email }),
    ...(SITE.whatsapp && { contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', telephone: `+${SITE.whatsapp}`, areaServed: SITE.country, availableLanguage: 'es' } }),
    address: { '@type': 'PostalAddress', addressCountry: SITE.country, ...(SITE.legal.address && { streetAddress: SITE.legal.address }) },
    areaServed: { '@type': 'Country', name: 'Perú' },
    ...(SOCIALS.length && { sameAs: SOCIALS.map((s) => s.href) }),
  },
  { '@type': 'WebSite', '@id': abs(WEBSITE, site), name: SITE.name, url: abs('/', site), inLanguage: 'es-PE', publisher: { '@id': abs(ORG, site) } },
];

/** A list of products: links only, each product is described on its own page. */
export const itemList = (products: Product[], site: URL | undefined, name?: string): Ld => ({
  '@type': 'ItemList', ...(name && { name }), numberOfItems: products.length,
  itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(productUrl(p), site), name: `${p.brand} ${p.name}` })),
});

export const collectionPage = (o: { name: string; description: string; path: string; products: Product[] }, site: URL | undefined): Ld => ({
  '@type': 'CollectionPage', '@id': abs(o.path, site), url: abs(o.path, site), name: o.name, description: o.description, inLanguage: 'es-PE',
  isPartOf: { '@id': abs(WEBSITE, site) }, mainEntity: itemList(o.products, site),
});

/**
 * One fragrance with a variant per format that has a price. Each format opens on the same page with
 * `?formato=`, whose canonical is the plain product URL. null when nothing has a price yet.
 * No `sku`: the shop doesn't have product codes of its own.
 */
export function productGraph(p: Product, live: Live, images: string[], site: URL | undefined): Ld | null {
  const url = abs(productUrl(p), site);
  const title = `${p.brand} ${p.name}`;
  const priced = [...FORMATS].reverse().filter((f) => live.prices[f.id].price != null);
  if (!priced.length) return null;
  const offer = (f: FormatId): Ld => ({
    '@type': 'Offer', url: `${url}?formato=${f}`, priceCurrency: 'PEN', price: live.prices[f].price,
    availability: `https://schema.org/${live.available[f] ? 'InStock' : 'OutOfStock'}`,
    ...(f === '100' && { itemCondition: 'https://schema.org/NewCondition' }),
    ...(live.prices[f].until && { priceValidUntil: live.prices[f].until }),
    seller: { '@id': abs(ORG, site) },
  });
  const shared = { brand: { '@type': 'Brand', name: p.brand }, category: 'Perfumes', ...(p.desc && { description: p.desc }), image: images };
  const suggestedGender = { Masculina: 'male', Femenina: 'female', Unisex: 'unisex' }[p.gender];
  return {
    '@type': 'ProductGroup', '@id': `${url}#producto`, productGroupID: p.slug, name: title, url, ...shared,
    audience: { '@type': 'PeopleAudience', suggestedGender },
    variesBy: ['https://schema.org/size'],
    hasVariant: priced.map((f) => ({
      '@type': 'Product', '@id': `${url}#${f.id}ml`, name: `${title} ${f.kind === 'Decant' ? 'decant ' : ''}${f.size}`, size: f.size, ...shared,
      offers: offer(f.id),
    })),
  };
}
