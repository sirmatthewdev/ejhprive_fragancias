import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { InventoryMovements } from './collections/InventoryMovements'
import { Complaints } from './collections/Complaints'
import { seed } from './seedData'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const storeUrl = process.env.STORE_URL || 'http://localhost:4321'
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
const usePostgres = dbUrl.startsWith('postgres')
// the panel's own public URL (custom domain, or the Vercel URL as fallback)
const cmsUrl = process.env.CMS_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

export default buildConfig({
  serverURL: cmsUrl,
  admin: {
    user: Users.slug,
    theme: 'dark',
    meta: { titleSuffix: ' · Panel EJH PRIVÉ', robots: 'noindex, nofollow' },
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      graphics: { Logo: '/components/Brand#Logo', Icon: '/components/Brand#Icon' },
      beforeDashboard: ['/components/Dashboard#Dashboard'],
    },
    dateFormat: 'dd/MM/yyyy HH:mm',
  },
  i18n: { supportedLanguages: { es }, fallbackLanguage: 'es' },
  collections: [Orders, Products, InventoryMovements, Complaints, Users, Media],
  cors: [storeUrl],
  csrf: [storeUrl],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Postgres (Neon via Vercel) in production, SQLite file for local work
  db: usePostgres
    ? postgresAdapter({ pool: { connectionString: dbUrl }, prodMigrations: migrations })
    : sqliteAdapter({ client: { url: dbUrl || 'file:./ejh.db' } }),
  sharp,
  // uploads go to Vercel Blob when its token exists (the serverless filesystem is read-only)
  plugins: [vercelBlobStorage({ enabled: !!process.env.BLOB_READ_WRITE_TOKEN, collections: { media: true }, token: process.env.BLOB_READ_WRITE_TOKEN || '' })],
  // a fresh production database gets the catalogue, the two admins and the shop's API user on first start
  onInit: async (payload) => {
    if (!usePostgres) return
    const out = await seed(payload, { requirePasswords: true })
    if (out.length) payload.logger.info(`Datos iniciales: ${out.join(' · ')}`)
  },
})
