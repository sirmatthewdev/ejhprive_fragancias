import type { APIRoute } from 'astro';
import { productUrl } from '../data/products';
import { hasContent } from '../lib/catalog';
import { allCategories, DECANTS_URL, getCategoryData, lastChange } from '../lib/categories';
import { liveOf } from '../lib/cms';
import { abs } from '../lib/seo';

export const prerender = false;

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
interface Entry { path: string; lastmod?: string; images?: (string | null | undefined)[] }

/**
 * The whole site in one file (the catalogue is far from the 50 000 URL limit), built live: what is published,
 * edited or hidden in the panel shows up or leaves on its own. Only canonical, indexable addresses.
 */
export const GET: APIRoute = async ({ site }) => {
  const d = await getCategoryData();
  const latest = lastChange(d.products, d.catalog);
  const entries: Entry[] = [
    ...['/', '/productos/', DECANTS_URL].map((path) => ({ path, lastmod: latest })),
    ...allCategories(d).filter((c) => c.indexable).map((c) => ({ path: c.path, lastmod: lastChange(c.products, d.catalog) })),
    ...d.products.filter(hasContent).map((p) => {
      const live = liveOf(d.catalog, p.slug);
      return { path: productUrl(p), lastmod: live.updatedAt, images: [live.photo, live.photo2] };
    }),
    ...['/como-comprar/', '/nosotros/', '/contacto/', '/libro-de-reclamaciones/', '/politica-de-devolucion/'].map((path) => ({ path })),
  ];
  const urls = entries.map(({ path, lastmod, images = [] }) => [
    `<url><loc>${esc(abs(path, site))}</loc>`,
    lastmod && `<lastmod>${new Date(lastmod).toISOString()}</lastmod>`,
    ...images.filter((u): u is string => !!u).map((u) => `<image:image><image:loc>${esc(u)}</image:loc></image:image>`),
    '</url>',
  ].filter(Boolean).join(''));
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // a list built without the panel is incomplete: never kept
      'Cache-Control': d.live ? 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600' : 'no-store',
    },
  });
};
