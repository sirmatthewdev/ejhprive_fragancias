import type { APIRoute } from 'astro';
import { getCatalog } from '../../lib/cms';

export const prerender = false;

/** Current stock per fragrance: GET /api/stock/?slugs=khamrah,9-pm (null = unknown, CMS unreachable). */
export const GET: APIRoute = async ({ url }) => {
  const slugs = (url.searchParams.get('slugs') ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20);
  const cat = await getCatalog({ fresh: true });
  const out: Record<string, { active: boolean; stock: { sealed: number; decantMl: number } | null }> = {};
  for (const slug of slugs) {
    const p = cat?.get(slug);
    out[slug] = p ? { active: p.active, stock: p.stock } : { active: true, stock: null };
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
