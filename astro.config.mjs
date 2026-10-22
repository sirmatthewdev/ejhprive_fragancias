// @ts-check
import { defineConfig, envField } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://ejhprive.com',
  trailingSlash: 'always',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [react(), sitemap({ filter: (page) => !/\/(sistema|cuenta|admin)\//.test(page) })],

  vite: {
    plugins: [tailwindcss()]
  },

  // pages are prerendered by default; catalog pages, /cuenta and /api/* render on the server (live prices/stock)
  adapter: node({
    mode: 'standalone'
  }),

  env: {
    schema: {
      // Payload CMS (cms/): prices, stock and orders
      CMS_URL: envField.string({ context: 'server', access: 'public', default: 'http://localhost:3000' }),
      CMS_API_KEY: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});