/**
 * Local first-run data. Usage: npm run seed   (idempotent: skips records that already exist)
 * Prints generated credentials once; store them safely and change passwords from the panel.
 */
import { getPayload } from 'payload'
import config from './payload.config'
import { seed } from './seedData'

const payload = await getPayload({ config })
const out = await seed(payload, { demoStock: true })
console.log(out.join('\n') || 'Nada que crear: ya estaba todo.')
process.exit(0)
