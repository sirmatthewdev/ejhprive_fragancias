/**
 * Creates one administrator explicitly. Never runs on its own and never overwrites an existing account.
 *
 *   ADMIN_EMAIL=persona@dominio.com ADMIN_NAME="Nombre Apellido" npm run create-admin
 *
 * A strong random password is generated and printed ONCE in this terminal (it is not stored anywhere
 * else); the person should change it from «Mi cuenta» after the first login. Against production:
 *   ADMIN_EMAIL=… ADMIN_NAME="…" npx vercel env run -e production -- npm run create-admin
 * (`payload run` does not forward CLI arguments, hence the environment variables.)
 */
import { randomBytes } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { getPayload } from 'payload'

// PAYLOAD_SECRET is a sensitive Vercel variable and can't be pulled; creating a user doesn't depend on it
// (passwords are hashed with their own salt), so a throwaway value is enough to boot Payload here.
process.env.PAYLOAD_SECRET ||= randomBytes(32).toString('hex')
const { default: config } = await import('../payload.config')

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const name = process.env.ADMIN_NAME?.trim()

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name) {
  console.error('Uso: ADMIN_EMAIL=persona@dominio.com ADMIN_NAME="Nombre Apellido" npm run create-admin')
  process.exit(1)
}

const payload = await getPayload({ config })
const exists = await payload.count({ collection: 'users', where: { email: { equals: email } } })
if (exists.totalDocs) {
  console.log(`Ya existe una cuenta para ${email}; no se modificó.`)
  process.exit(0)
}
// 18 random bytes → 24 url-safe characters
const password = randomBytes(18).toString('base64url')
await payload.create({ collection: 'users', data: { email, name, role: 'admin', password }, overrideAccess: true })
// ADMIN_PASSWORD_FILE keeps the password out of the terminal (and any log of it): it is appended to that file instead
const file = process.env.ADMIN_PASSWORD_FILE
if (file) {
  appendFileSync(file, `${email}\t${password}\n`, { mode: 0o600 })
  console.log(`Administrador creado: ${name} <${email}>. Contraseña temporal guardada en el archivo indicado.`)
} else {
  console.log(`\nAdministrador creado: ${name} <${email}>\nContraseña temporal (se muestra solo esta vez): ${password}\n`)
}
process.exit(0)
