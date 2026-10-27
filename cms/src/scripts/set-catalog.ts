/**
 * Sets the opening catalogue: every 100 ml bottle at S/ 139 (Hawas Ice S/ 159), no decant prices yet,
 * SEALED sealed bottles each and no decant ml. Goes through Payload, so each change is logged in
 * «Movimientos de stock».
 *
 *   SEALED=2 DATABASE_URL=… npm run set-catalog
 */
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'

// setting prices and stock doesn't depend on the secret, so a throwaway value is enough to boot Payload here
process.env.PAYLOAD_SECRET ||= randomBytes(32).toString('hex')
const sealed = Number(process.env.SEALED)
if (!Number.isInteger(sealed) || sealed < 0) {
  console.error('Uso: SEALED=<frascos por perfume> npm run set-catalog')
  process.exit(1)
}
const { default: config } = await import('../payload.config')
const payload = await getPayload({ config })
const { docs } = await payload.find({ collection: 'products', limit: 100, depth: 0, overrideAccess: true })
for (const p of docs) {
  const p100 = p.slug === 'hawas-ice' ? 159 : 139
  await payload.update({
    collection: 'products', id: p.id, depth: 0, overrideAccess: true,
    data: {
      prices: { p3: null, p5: null, p100, s3: null, s5: null, s100: null, saleEndsAt: null },
      stock: { ...p.stock, sealed, decantMl: 0, openBottle: false },
    },
  })
  console.log(`  ${p.name}: frasco 100 ml S/ ${p100} · ${sealed} frascos · decants sin precio ni stock`)
}
process.exit(0)
