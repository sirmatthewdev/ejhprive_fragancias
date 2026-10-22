import type { Payload } from 'payload'
import { isAvailable, type FormatId } from '../inventory'

const PIPELINE = [
  { value: 'pendiente', label: 'Por confirmar', hint: 'Responder por WhatsApp' },
  { value: 'confirmado', label: 'Confirmados', hint: 'Preparar' },
  { value: 'preparando', label: 'En preparación', hint: 'Despachar' },
  { value: 'enviado', label: 'En camino', hint: 'Esperando entrega' },
]

/** Overview shown above the default dashboard: order pipeline + stock alerts. */
export async function Dashboard({ payload }: { payload: Payload }) {
  const counts = await Promise.all(
    PIPELINE.map((s) => payload.count({ collection: 'orders', where: { status: { equals: s.value } }, overrideAccess: true })),
  )
  const recent = await payload.find({ collection: 'orders', sort: '-createdAt', limit: 6, depth: 0, overrideAccess: true })
  const products = await payload.find({ collection: 'products', limit: 100, depth: 0, overrideAccess: true, sort: 'name' })
  const alerts = products.docs.flatMap((p) => {
    const s = { sealed: p.stock?.sealed ?? 0, decantMl: p.stock?.decantMl ?? 0 }
    const out = (['3', '5', '100'] as FormatId[]).filter((f) => !isAvailable(s, f))
    const low = s.sealed <= (p.stock?.lowSealed ?? 1)
    return out.length || low ? [{ id: p.id, name: p.name, s, out, low }] : []
  })
  const complaints = await payload.find({ collection: 'complaints', where: { status: { equals: 'pendiente' } }, sort: 'dueAt', limit: 5, depth: 0, overrideAccess: true })
  const money = (n?: number | null) => (n == null ? 'A confirmar' : new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n))

  return (
    <div className="ejh-dash">
      {complaints.totalDocs > 0 && (
        <a className="ejh-dash__alert" href="/admin/collections/complaints?where[status][equals]=pendiente">
          <strong>Libro de Reclamaciones:</strong> {complaints.totalDocs} sin responder. La próxima vence el{' '}
          {new Date(complaints.docs[0].dueAt as string).toLocaleDateString('es-PE')}.
        </a>
      )}
      <h2 className="ejh-dash__title">Pedidos</h2>
      <div className="ejh-dash__grid">
        {PIPELINE.map((s, i) => (
          <a key={s.value} className="ejh-dash__card" href={`/admin/collections/orders?where[status][equals]=${s.value}`}>
            <span className="ejh-dash__label">{s.label}</span>
            <span className="ejh-dash__num">{counts[i].totalDocs}</span>
            <span className="ejh-dash__hint">{s.hint}</span>
          </a>
        ))}
      </div>

      <div className="ejh-dash__cols">
        <section>
          <h3 className="ejh-dash__subtitle">Últimos pedidos</h3>
          {recent.docs.length === 0 ? <p className="ejh-dash__empty">Todavía no hay pedidos.</p> : (
            <ul className="ejh-dash__list">
              {recent.docs.map((o) => (
                <li key={o.id}>
                  <a href={`/admin/collections/orders/${o.id}`}>
                    <strong>{o.number}</strong> · {o.customer?.name}
                    <span className={`ejh-pill ejh-pill--${o.status}`}>{o.status}</span>
                    <span className="ejh-dash__muted">{money(o.total)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3 className="ejh-dash__subtitle">Alertas de stock</h3>
          {alerts.length === 0 ? <p className="ejh-dash__empty">Todo con stock.</p> : (
            <ul className="ejh-dash__list">
              {alerts.map((a) => (
                <li key={a.id}>
                  <a href={`/admin/collections/products/${a.id}`}>
                    <strong>{a.name}</strong> · {a.s.sealed} frascos · {a.s.decantMl} ml
                    {a.out.length > 0 && <span className="ejh-pill ejh-pill--cancelado">Agotado: {a.out.map((f) => (f === '100' ? 'frasco' : `${f} ml`)).join(', ')}</span>}
                    {a.out.length === 0 && a.low && <span className="ejh-pill ejh-pill--pendiente">Stock bajo</span>}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
