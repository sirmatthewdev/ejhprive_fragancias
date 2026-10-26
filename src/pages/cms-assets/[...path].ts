import type { APIRoute } from 'astro';
import { proxyToCms } from '../../lib/cmsProxy';

// cms-assets/* is served by the admin panel (see lib/cmsProxy.ts)
export const prerender = false;
export const ALL: APIRoute = (ctx) => proxyToCms(ctx);
