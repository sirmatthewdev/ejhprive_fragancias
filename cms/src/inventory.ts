import { APIError, type PayloadRequest } from 'payload'

export type FormatId = '3' | '5' | '100'
export const BOTTLE_ML = 100
export const FORMAT_ML: Record<FormatId, number> = { '3': 3, '5': 5, '100': 100 }
export const FORMAT_LABEL: Record<FormatId, string> = { '3': 'Decant 3 ml', '5': 'Decant 5 ml', '100': 'Frasco 100 ml' }

/** Order states in which the goods are reserved/out of the shelf. */
export const COMMITTED = ['confirmado', 'preparando', 'enviado', 'entregado'] as const
export const isCommitted = (s?: string | null) => !!s && (COMMITTED as readonly string[]).includes(s)

export interface Stock { sealed: number; decantMl: number }

/** Decants come only from the ml opened for decants; bottles only from sealed stock. */
export const isAvailable = (s: Stock, fmt: FormatId) =>
  fmt === '100' ? s.sealed > 0 : s.decantMl >= FORMAT_ML[fmt]

interface Line { product: number | string | { id: number | string }; format: FormatId; qty: number }
const idOf = (p: Line['product']) => (typeof p === 'object' ? p.id : p)

/**
 * Takes order lines out of stock (dir = -1) or puts them back (dir = +1).
 * Runs inside the caller's transaction (same req) and writes one movement per change.
 */
export async function moveStock(req: PayloadRequest, lines: Line[], dir: -1 | 1, order: { id?: number | string; number?: string | null }) {
  const { payload } = req
  const byProduct = new Map<string, Line[]>()
  for (const l of lines) byProduct.set(String(idOf(l.product)), [...(byProduct.get(String(idOf(l.product))) ?? []), l])

  for (const [pid, plines] of byProduct) {
    const product = await payload.findByID({ collection: 'products', id: pid, req, depth: 0 })
    let sealed = product.stock?.sealed ?? 0
    let decantMl = product.stock?.decantMl ?? 0
    const movements: { type: string; bottles: number; ml: number; note: string }[] = []

    for (const l of plines) {
      const label = `${l.qty} × ${FORMAT_LABEL[l.format]}`
      if (l.format === '100') {
        if (dir === -1 && sealed < l.qty) throw new APIError(`Stock insuficiente de ${product.name}: quedan ${sealed} frascos sellados.`, 400, null, true)
        sealed += dir * l.qty
        movements.push({ type: dir === -1 ? 'venta' : 'devolucion', bottles: dir * l.qty, ml: 0, note: label })
        continue
      }
      const need = FORMAT_ML[l.format] * l.qty
      if (dir === 1) {
        decantMl += need
        movements.push({ type: 'devolucion', bottles: 0, ml: need, note: label })
        continue
      }
      // sealed bottles are never opened automatically: the team opens one from the product page
      if (decantMl < need) throw new APIError(`Stock insuficiente de ${product.name}: quedan ${decantMl} ml para decants. Abre un frasco sellado desde el producto para sumar ${BOTTLE_ML} ml.`, 400, null, true)
      decantMl -= need
      movements.push({ type: 'venta', bottles: 0, ml: -need, note: label })
    }

    await payload.update({
      collection: 'products', id: pid, req, depth: 0,
      data: { stock: { sealed, decantMl } },
      context: { fromInventory: true },
    })
    for (const m of movements) {
      await payload.create({
        collection: 'inventory-movements', req, depth: 0,
        data: { product: Number(pid), type: m.type as never, bottles: m.bottles, ml: m.ml, note: m.note, order: order.id ? Number(order.id) : undefined, user: req.user?.id ? Number(req.user.id) : undefined },
        context: { fromInventory: true },
      })
    }
  }
}
