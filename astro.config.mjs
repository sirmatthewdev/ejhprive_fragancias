// @ts-check
import { defineConfig, envField } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// public URL for canonical, sitemap and Open Graph: SITE_URL (set it in Vercel once the own domain is live) or,
// without it, the production address Vercel provides. No address is written in the code.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || (vercelUrl ? `https://${vercelUrl}` : undefined);

// https://astro.build/config
export default defineConfig({
  site,
  // 'ignore': the proxied panel uses paths without a trailing slash; the shop's links keep theirs
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [react(), sitemap({ filter: (page) => !/\/(sistema|cuenta|admin)\//.test(page) })],

  vite: {
    plugins: [tailwindcss()]
  },

  // pages are prerendered by default; home, catalog, product pages and /api/* run as Vercel functions (live prices/stock)
  adapter: vercel(),

  env: {
    schema: {
      // Payload CMS (cms/): prices, stock and orders. Optional so the shop builds and runs without it
      // (prices show «A confirmar» and orders fall back to WhatsApp only).
      CMS_URL: envField.string({ context: 'server', access: 'public', optional: true, default: '' }),
      CMS_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      // Tracking (all optional; each tool loads only when its ID is set and the visitor accepts cookies)
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
      PUBLIC_GA4_ID: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
      PUBLIC_META_PIXEL_ID: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
      PUBLIC_TIKTOK_PIXEL_ID: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
      PUBLIC_CF_BEACON_TOKEN: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
    },
  },
});
