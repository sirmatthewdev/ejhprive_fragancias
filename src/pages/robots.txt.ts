import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

// generated so the sitemap URLs follow SITE_URL when the own domain goes live
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(SITE.url);
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /cms-api',
    'Disallow: /cuenta/',
    'Disallow: /sistema/',
    'Disallow: /api/',
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', base).href}`,
    `Sitemap: ${new URL('/sitemap-productos.xml', base).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
