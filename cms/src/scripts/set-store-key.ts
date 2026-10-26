/**
 * Sets the API key of the shop's «Tienda (API)» user (the value the shop sends as CMS_API_KEY).
 * Needs the deployment's real PAYLOAD_SECRET: Payload indexes API keys with it.
 *
 *   PAYLOAD_SECRET=… STORE_API_KEY=… npx vercel env run -e production -- npm run set-store-key
 *
 * Nothing secret is printed.
 */
import { getPayload } from 'payload'

const key = process.env.STORE_API_KEY?.trim()
if (!key || key.length < 32 || !process.env.PAYLOAD_SECRET) {
  console.error('Uso: PAYLOAD_SECRET=… STORE_API_KEY=<32+ caracteres> npm run set-store-key')
  process.exit(1)
}
const { default: config } = await import('../payload.config')
const payload = await getPayload({ config })
const { docs } = await payload.find({ collection: 'users', where: { email: { equals: 'tienda-api@ejhprive.com' } }, limit: 1, overrideAccess: true })
if (!docs[0]) {
  console.error('No existe el usuario Tienda (API); se crea al iniciar el panel por primera vez.')
  process.exit(1)
}
await payload.update({ collection: 'users', id: docs[0].id, data: { enableAPIKey: true, apiKey: key }, overrideAccess: true })
console.log('Clave del usuario Tienda (API) actualizada.')
process.exit(0)
