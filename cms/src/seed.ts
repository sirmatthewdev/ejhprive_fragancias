/**
 * First-run data: the six fragrances, two admins and the storefront API user.
 * Usage: npm run seed   (idempotent: skips records that already exist)
 * Prints the generated credentials once; store them safely and change passwords from the panel.
 */
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'
import config from './payload.config'

const PRODUCTS = [
  { slug: 'khamrah', name: 'Khamrah', brand: 'Lattafa', tag: 'Más vendido' },
  { slug: 'khamrah-qahwa', name: 'Khamrah Qahwa', brand: 'Lattafa', tag: 'Favorito' },
  { slug: '9-pm', name: '9 PM', brand: 'Afnan', tag: 'Para la noche' },
  { slug: 'odyssey-mandarin-sky', name: 'Odyssey Mandarin Sky', brand: 'Armaf', tag: '' },
  { slug: 'odyssey-spectra', name: 'Odyssey Spectra', brand: 'Armaf', tag: 'Nuevo' },
  { slug: 'hawas-ice', name: 'Hawas Ice', brand: 'Rasasi', tag: 'Para el calor' },
] as const

const pw = () => randomBytes(12).toString('base64url')

const payload = await getPayload({ config })
const out: string[] = []

for (const p of PRODUCTS) {
  const exists = await payload.count({ collection: 'products', where: { slug: { equals: p.slug } } })
  if (exists.totalDocs) continue
  // demo stock so the shop is browsable; replace with the real count from the panel
  // 100 ml bottle: S/ 139, Hawas Ice S/ 159 (decant prices are set from the panel)
  const prices = { p100: p.slug === 'hawas-ice' ? 159 : 139 }
  await payload.create({ collection: 'products', data: { ...p, active: true, prices, stock: { sealed: 2, decantMl: 100, lowSealed: 1 } } })
  out.push(`Producto creado: ${p.name}`)
}

const users = [
  { email: process.env.SEED_ADMIN1_EMAIL || 'admin@ejhprive.com', name: process.env.SEED_ADMIN1_NAME || 'Administrador 1', role: 'admin' as const, password: process.env.SEED_ADMIN1_PASSWORD },
  { email: process.env.SEED_ADMIN2_EMAIL || 'admin2@ejhprive.com', name: process.env.SEED_ADMIN2_NAME || 'Administrador 2', role: 'admin' as const, password: process.env.SEED_ADMIN2_PASSWORD },
]
for (const u of users) {
  const exists = await payload.count({ collection: 'users', where: { email: { equals: u.email } } })
  if (exists.totalDocs) continue
  const password = u.password || pw()
  await payload.create({ collection: 'users', data: { ...u, password } })
  out.push(`Usuario ${u.role}: ${u.email} / ${password}`)
}

const storeEmail = 'tienda-api@ejhprive.com'
if (!(await payload.count({ collection: 'users', where: { email: { equals: storeEmail } } })).totalDocs) {
  const apiKey = process.env.SEED_API_KEY || randomBytes(24).toString('hex')
  await payload.create({ collection: 'users', data: { email: storeEmail, name: 'Tienda (API)', role: 'storefront', password: pw(), enableAPIKey: true, apiKey } })
  out.push(`CMS_API_KEY=${apiKey}   ← copiar al .env de la tienda`)
}

console.log(out.join('\n') || 'Nada que crear: ya estaba todo.')
process.exit(0)
