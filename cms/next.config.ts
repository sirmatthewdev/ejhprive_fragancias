import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// The panel is served under the shop's domain (ejhprive-fragancias.vercel.app/admin) through a proxy in the
// shop. Its own assets live under /cms-assets so they never collide with the shop's files.
const ASSET_PREFIX = '/cms-assets'

// server actions (used by the admin UI) must accept the shop's host, which proxies the panel
const proxyHosts = [process.env.STORE_URL, process.env.CMS_URL]
  .filter(Boolean)
  .map((u) => new URL(u as string).host)

// sent with every response of the panel (also when it is served through the shop's proxy)
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, // the panel can't be embedded in another site (clickjacking)
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  assetPrefix: ASSET_PREFIX,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  experimental: { serverActions: { allowedOrigins: [...new Set(proxyHosts)] } },
  // local development through the shop's proxy (dev-only check; production is unaffected)
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async rewrites() {
    return [{ source: `${ASSET_PREFIX}/_next/:path*`, destination: '/_next/:path*' }]
  },
  images: {
    localPatterns: [
      {
        pathname: '/cms-api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
