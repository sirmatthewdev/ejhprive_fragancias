import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

// Generated so the sitemap URL follows SITE_URL. This only saves crawling: what must stay private is protected by
// the panel's own sign-in (cms/src/access.ts). /sistema/ is left open on purpose, so that its noindex can be read.
export const GET: APIRoute = ({ site }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /gestion',
    'Disallow: /cms-api',
    'Disallow: /cms-assets',
    'Disallow: /cuenta',
    'Disallow: /api/',
    '# Filtros y búsqueda del catálogo: cada categoría tiene su propia página',
    'Disallow: /productos?',
    'Disallow: /productos/?',
    '',
    `Sitemap: ${new URL('/sitemap.xml', site ?? SITE.url).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
