import type { APIRoute } from 'astro';
import { getCatalog } from '../../lib/cms';
import type { FormatId } from '../../data/products';

export const prerender = false;

/**
 * Current stock and price per fragrance: GET /api/stock/?slugs=khamrah,9-pm
 * (stock null = unknown, CMS unreachable; prices are what an order is charged right now).
 */
export const GET: APIRoute = async ({ url }) => {
  const slugs = (url.searchParams.get('slugs') ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20);
  const cat = await getCatalog({ fresh: true });
  const out: Record<string, { active: boolean; stock: { sealed: number; decantMl: number } | null; prices?: Record<FormatId, number | null> }> = {};
  for (const slug of slugs) {
    const p = cat?.get(slug);
    out[slug] = p
      ? { active: p.active, stock: p.stock, prices: { '3': p.prices['3'].price, '5': p.prices['5'].price, '100': p.prices['100'].price } }
      : { active: true, stock: null };
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
