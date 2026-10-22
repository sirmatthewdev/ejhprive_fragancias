import { sqliteAdapter } from '@payloadcms/db-sqlite'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const storeUrl = process.env.STORE_URL || 'http://localhost:4321'

export default buildConfig({
  serverURL: process.env.CMS_URL || 'http://localhost:3000',
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
  // SQLite for local work; switch to @payloadcms/db-postgres (e.g. Neon) for production
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URL || '' } }),
  sharp,
  plugins: [],
})
