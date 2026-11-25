// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
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
  integrations: [react()],

  // addresses that moved or that only group others
  redirects: {
    '/sitemap-index.xml': '/sitemap.xml',
    '/sitemap-0.xml': '/sitemap.xml',
    '/sitemap-productos.xml': '/sitemap.xml',
    '/perfumes': '/productos/',
    '/marcas': '/productos/',
    '/familias': '/productos/',
  },

  // downloaded at build time and served from the shop's own domain: no render-blocking request to Google Fonts,
  // and fallbacks with the same metrics so the text doesn't jump when they load
  fonts: [
    { provider: fontProviders.google(), name: 'Cormorant Garamond', cssVariable: '--font-cormorant', weights: [500, 600], styles: ['normal', 'italic'], subsets: ['latin'], fallbacks: ['Georgia', 'serif'] },
    { provider: fontProviders.google(), name: 'Manrope', cssVariable: '--font-manrope', weights: ['400 800'], styles: ['normal'], subsets: ['latin'], fallbacks: ['Arial', 'sans-serif'] },
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  // pages are prerendered by default; home, catalog, product pages and /api/* run as Vercel functions (live prices/stock)
  adapter: vercel(),

  // photos uploaded in the panel live on Vercel Blob: let the image endpoint resize them and serve WebP
  image: { remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }] },

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
