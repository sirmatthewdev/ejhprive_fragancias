/**
 * Serves the admin panel (Payload, separate Vercel project) under the shop's own domain.
 * Only three prefixes are forwarded — /admin, /cms-api and /cms-assets — so the shop's pages and its
 * own /api/* endpoints are never touched. Cookies stay host-only on the shop's domain.
 */
import type { APIContext } from 'astro';
import { CMS_URL } from 'astro:env/server';

// hop-by-hop or recomputed headers that must not be forwarded
const DROP_REQ = new Set(['host', 'connection', 'content-length', 'accept-encoding', 'x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-for', 'x-real-ip']);
const DROP_RES = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive', 'set-cookie']);

export async function proxyToCms(ctx: APIContext): Promise<Response> {
  if (!CMS_URL) return ctx.rewrite('/cuenta/'); // panel not connected yet: honest «Panel en configuración» page
  const upstream = new URL(CMS_URL);
  const target = new URL(ctx.url.pathname + ctx.url.search, upstream);

  const headers = new Headers();
  ctx.request.headers.forEach((v, k) => { if (!DROP_REQ.has(k)) headers.set(k, v); });
  headers.set('x-forwarded-host', ctx.url.host);
  headers.set('x-forwarded-proto', ctx.url.protocol.replace(':', ''));
  if (ctx.clientAddress) headers.set('x-forwarded-for', ctx.clientAddress);

  const method = ctx.request.method;
  const res = await fetch(target, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : await ctx.request.arrayBuffer(),
    redirect: 'manual',
  });

  const out = new Headers();
  res.headers.forEach((v, k) => { if (!DROP_RES.has(k)) out.set(k, v); });
  // redirects issued by the panel point back to the shop's domain
  const loc = res.headers.get('location');
  if (loc) out.set('location', loc.replace(upstream.origin, ctx.url.origin));
  // session cookies: keep them host-only on the shop's domain
  for (const c of res.headers.getSetCookie()) out.append('set-cookie', c.replace(/;\s*Domain=[^;]*/i, ''));
  out.set('cache-control', res.headers.get('cache-control') ?? 'private, no-store');

  return new Response(method === 'HEAD' ? null : res.body, { status: res.status, statusText: res.statusText, headers: out });
}
