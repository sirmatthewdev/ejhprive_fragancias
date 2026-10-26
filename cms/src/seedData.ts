/**
 * Initial data: the six fragrances, two admins and the storefront API user. Idempotent.
 * Used by `npm run seed` (local) and by the first start of a fresh production database (onInit).
 */
import { randomBytes } from 'node:crypto'
import type { Payload } from 'payload'

const PRODUCTS = [
  { slug: 'khamrah', name: 'Khamrah', brand: 'Lattafa', tag: 'Más vendido' },
  { slug: 'khamrah-qahwa', name: 'Khamrah Qahwa', brand: 'Lattafa', tag: 'Favorito' },
  { slug: '9-pm', name: '9 PM', brand: 'Afnan', tag: 'Para la noche' },
  { slug: 'odyssey-mandarin-sky', name: 'Odyssey Mandarin Sky', brand: 'Armaf', tag: '' },
  { slug: 'odyssey-spectra', name: 'Odyssey Spectra', brand: 'Armaf', tag: 'Nuevo' },
  { slug: 'hawas-ice', name: 'Hawas Ice', brand: 'Rasasi', tag: 'Para el calor' },
] as const

const pw = () => randomBytes(12).toString('base64url')

/**
 * @param opts.demoStock  give each fragrance sample stock (local only; production starts at 0)
 * @param opts.requirePasswords  only create admins whose password comes from the environment
 */
export async function seed(payload: Payload, opts: { demoStock?: boolean; requirePasswords?: boolean; skipAdmins?: boolean } = {}) {
  const out: string[] = []
  const env = process.env

  for (const p of PRODUCTS) {
    const exists = await payload.count({ collection: 'products', where: { slug: { equals: p.slug } } })
    if (exists.totalDocs) continue
    // 100 ml bottle: S/ 139, Hawas Ice S/ 159 (decant prices are set from the panel)
    const prices = { p100: p.slug === 'hawas-ice' ? 159 : 139 }
    const stock = opts.demoStock ? { sealed: 2, decantMl: 100, lowSealed: 1 } : { sealed: 0, decantMl: 0, lowSealed: 1 }
    await payload.create({ collection: 'products', data: { ...p, active: true, prices, stock } })
    out.push(`Producto creado: ${p.name}`)
  }

  const users = [
    { email: env.SEED_ADMIN1_EMAIL || 'admin@ejhprive.com', name: env.SEED_ADMIN1_NAME || 'Administrador 1', password: env.SEED_ADMIN1_PASSWORD },
    { email: env.SEED_ADMIN2_EMAIL || 'admin2@ejhprive.com', name: env.SEED_ADMIN2_NAME || 'Administrador 2', password: env.SEED_ADMIN2_PASSWORD },
  ]
  for (const u of opts.skipAdmins ? [] : users) {
    if (opts.requirePasswords && !u.password) continue
    const exists = await payload.count({ collection: 'users', where: { email: { equals: u.email } } })
    if (exists.totalDocs) continue
    const password = u.password || pw()
    await payload.create({ collection: 'users', data: { email: u.email, name: u.name, role: 'admin', password } })
    out.push(`Usuario admin: ${u.email}${u.password ? '' : ` / ${password}`}`)
  }

  const storeEmail = 'tienda-api@ejhprive.com'
  const hasStore = (await payload.count({ collection: 'users', where: { email: { equals: storeEmail } } })).totalDocs
  if (!hasStore && (!(opts.requirePasswords || opts.skipAdmins) || env.SEED_API_KEY)) {
    const apiKey = env.SEED_API_KEY || randomBytes(24).toString('hex')
    await payload.create({ collection: 'users', data: { email: storeEmail, name: 'Tienda (API)', role: 'storefront', password: pw(), enableAPIKey: true, apiKey } })
    out.push(env.SEED_API_KEY ? 'Usuario Tienda (API) creado con SEED_API_KEY' : `CMS_API_KEY=${apiKey}   ← copiar al .env de la tienda`)
  }
  return out
}
