import { APIError, type PayloadRequest, type Where } from 'payload'

/**
 * Durable limits for what the public shop sends (orders and Libro de Reclamaciones sheets).
 * The shop's own per-IP limit lives in the memory of each serverless function, so it resets all the time and
 * can't stop a flood; these counts come from the database. Real traffic is far below them, and a customer who
 * hits one is sent to WhatsApp, where every order is finished anyway.
 */
export const LIMITS = {
  /** orders registered from the web per hour, all customers together */
  ordersPerHour: 40,
  /** orders still «Pendiente» from the same phone in 24 hours */
  pendingPerPhone: 5,
  /** sheets registered from the web per hour, all consumers together */
  complaintsPerHour: 20,
  /** sheets from the same document number in 24 hours */
  complaintsPerDocument: 5,
}

const HOUR = 3_600_000
const since = (ms: number) => new Date(Date.now() - ms).toISOString()

async function count(req: PayloadRequest, collection: 'orders' | 'complaints', where: Where) {
  return (await req.payload.count({ collection, where, req, overrideAccess: true })).totalDocs
}

const tooMany = (what: string) => new APIError(`Demasiados ${what} en poco tiempo. Escríbenos por WhatsApp y lo registramos contigo.`, 429, null, true)

export async function limitWebOrder(req: PayloadRequest, phone: unknown) {
  const [hour, same] = await Promise.all([
    count(req, 'orders', { and: [{ source: { equals: 'web' } }, { createdAt: { greater_than: since(HOUR) } }] }),
    count(req, 'orders', { and: [{ source: { equals: 'web' } }, { status: { equals: 'pendiente' } }, { 'customer.phone': { equals: String(phone ?? '') } }, { createdAt: { greater_than: since(24 * HOUR) } }] }),
  ])
  if (hour >= LIMITS.ordersPerHour || same >= LIMITS.pendingPerPhone) throw tooMany('pedidos')
}

export async function limitWebComplaint(req: PayloadRequest, docNumber: unknown) {
  const [hour, same] = await Promise.all([
    count(req, 'complaints', { createdAt: { greater_than: since(HOUR) } }),
    count(req, 'complaints', { and: [{ 'consumer.docNumber': { equals: String(docNumber ?? '') } }, { createdAt: { greater_than: since(24 * HOUR) } }] }),
  ])
  if (hour >= LIMITS.complaintsPerHour || same >= LIMITS.complaintsPerDocument) throw tooMany('reclamos')
}
