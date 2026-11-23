import type { APIRoute } from 'astro';
import { productUrl } from '../data/products';
import { visibleProducts } from '../lib/catalog';
import { getCatalog } from '../lib/cms';
import { SITE } from '../config/site';

export const prerender = false;

/**
 * Product pages render on request, so @astrojs/sitemap (build time) can't list them.
 * This sitemap is built live from the catalogue: products created or hidden in the panel show up on their own.
 */
export const GET: APIRoute = async ({ site }) => {
  const products = visibleProducts(await getCatalog());
  const base = site ?? new URL(SITE.url);
  const urls = products.map((p) => `<url><loc>${new URL(productUrl(p), base).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' },
  });
};
