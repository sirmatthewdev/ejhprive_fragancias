import { APIError, type CollectionConfig, type CollectionBeforeChangeHook } from 'payload'
import { isAdmin, isTeam, isTeamOrStore, teamField } from '../access'
import { isCommitted, moveStock, type FormatId } from '../inventory'
import { priceFor } from '../pricing'

export const STATUS = [
  { label: 'Pendiente (por confirmar)', value: 'pendiente' },
  { label: 'Confirmado / pagado', value: 'confirmado' },
  { label: 'En preparación', value: 'preparando' },
  { label: 'Enviado', value: 'enviado' },
  { label: 'Entregado', value: 'entregado' },
  { label: 'Cancelado', value: 'cancelado' },
] as const
const statusLabel = (v?: string | null) => STATUS.find((s) => s.value === v)?.label ?? v ?? ''

type Item = { product: number | { id: number }; format: FormatId; qty: number; unitPrice?: number | null; lineTotal?: number | null }
const sameItems = (a: Item[] = [], b: Item[] = []) =>
  JSON.stringify(a.map((i) => [typeof i.product === 'object' ? i.product.id : i.product, i.format, i.qty])) ===
  JSON.stringify(b.map((i) => [typeof i.product === 'object' ? i.product.id : i.product, i.format, i.qty]))

const beforeChange: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  const fromStore = req.user?.role === 'storefront'
  const who = fromStore ? 'Web' : (req.user as { name?: string } | null)?.name ?? 'Sistema'
  const now = new Date().toISOString()

  if (operation === 'create') {
    // the web can only open a pending order with customer data and items
    if (fromStore) {
      data.payment = undefined
      data.shipment = undefined
      data.internalNotes = undefined
      data.shippingCost = undefined
    }
    data.source = fromStore ? 'web' : 'panel'
    data.status = 'pendiente'
    data.stockApplied = false
    const last = await req.payload.find({ collection: 'orders', sort: '-createdAt', limit: 1, depth: 0, req, overrideAccess: true })
    const n = Number(String(last.docs[0]?.number ?? 'EJH-0000').replace(/\D/g, '')) + 1
    data.number = `EJH-${String(n).padStart(4, '0')}`
    data.history = [{ status: 'pendiente', at: now, by: who, note: fromStore ? 'Pedido registrado desde la web; se finaliza por WhatsApp.' : 'Pedido cargado desde el panel.' }]
  }

  // prices come from the catalog for web orders and for any line without a price
  const items: Item[] = data.items ?? []
  if (!items.length) throw new APIError('El pedido no tiene productos.', 400, null, true)
  for (const it of items) {
    if (!it.qty || it.qty < 1 || it.qty > 20) throw new APIError('Cantidad inválida.', 400, null, true)
    if (fromStore || it.unitPrice == null) {
      const prod = await req.payload.findByID({ collection: 'products', id: typeof it.product === 'object' ? it.product.id : it.product, depth: 0, req, overrideAccess: true })
      if (!prod.active) throw new APIError(`${prod.name} no está disponible.`, 400, null, true)
      it.unitPrice = priceFor(prod.prices, it.format).price // sale price when an offer is running
    }
    it.lineTotal = it.unitPrice == null ? null : it.unitPrice * it.qty
  }
  const priced = items.every((i) => i.lineTotal != null)
  data.subtotal = priced ? items.reduce((s, i) => s + (i.lineTotal ?? 0), 0) : null
  data.total = data.subtotal == null ? null : data.subtotal + (data.shippingCost ?? 0)

  if (operation === 'update' && originalDoc) {
    const prev = originalDoc.status as string
    const next = (data.status ?? prev) as string
    if (originalDoc.stockApplied && !sameItems(originalDoc.items, items))
      throw new APIError('Este pedido ya descontó stock. Vuelve el estado a «Pendiente» para editar los productos.', 400, null, true)

    if (next !== prev) {
      data.history = [...(originalDoc.history ?? []), { status: next, at: now, by: who, note: data.statusNote || null }]
      if (next === 'enviado' && !data.shipment?.shippedAt) data.shipment = { ...data.shipment, shippedAt: now }
      if (next === 'entregado' && !data.shipment?.deliveredAt) data.shipment = { ...data.shipment, deliveredAt: now }
    }
    data.statusNote = null
    if (data.payment?.paid && !data.payment?.paidAt) data.payment = { ...data.payment, paidAt: now }

    // stock follows the status: out when confirmed, back when cancelled or returned to pending
    if (isCommitted(next) && !originalDoc.stockApplied) {
      await moveStock(req, items, -1, { id: originalDoc.id, number: originalDoc.number })
      data.stockApplied = true
    } else if (!isCommitted(next) && originalDoc.stockApplied) {
      await moveStock(req, items, 1, { id: originalDoc.id, number: originalDoc.number })
      data.stockApplied = false
    }
  }
  return data
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  admin: {
    useAsTitle: 'number',
    defaultColumns: ['number', 'customer.name', 'status', 'total', 'customer.delivery', 'createdAt'],
    group: 'Tienda',
    listSearchableFields: ['number', 'customer.name', 'customer.phone', 'shipment.trackingCode'],
    description: 'Los pedidos de la web llegan como «Pendiente». Al confirmar se descuenta el stock; al cancelar, se repone.',
  },
  defaultSort: '-createdAt',
  access: { create: isTeamOrStore, read: isTeam, update: isTeam, delete: isAdmin },
  hooks: { beforeChange: [beforeChange] },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'number', label: 'N.º de pedido', type: 'text', unique: true, index: true, admin: { readOnly: true, width: '30%' } },
        { name: 'status', label: 'Estado', type: 'select', required: true, defaultValue: 'pendiente', options: [...STATUS], admin: { width: '40%' } },
        { name: 'source', label: 'Origen', type: 'select', options: [{ label: 'Web', value: 'web' }, { label: 'Panel', value: 'panel' }], admin: { readOnly: true, width: '30%' } },
      ],
    },
    { name: 'notify', type: 'ui', admin: { components: { Field: '/components/NotifyCustomer#NotifyCustomer' } } },
    { name: 'statusNote', label: 'Nota para el historial (opcional)', type: 'text', admin: { description: 'Se guarda junto al cambio de estado.' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Cliente',
          fields: [
            {
              name: 'customer',
              type: 'group',
              label: 'Cliente',
              fields: [
                { type: 'row', fields: [
                  { name: 'name', label: 'Nombre', type: 'text', required: true },
                  { name: 'phone', label: 'WhatsApp / teléfono', type: 'text', required: true },
                  { name: 'email', label: 'Correo', type: 'email' },
                ] },
                { name: 'delivery', label: 'Entrega', type: 'radio', required: true, defaultValue: 'envio', options: [{ label: 'Envío', value: 'envio' }, { label: 'Retiro', value: 'retiro' }], admin: { layout: 'horizontal' } },
                { type: 'row', fields: [
                  { name: 'department', label: 'Departamento', type: 'text' },
                  { name: 'province', label: 'Provincia', type: 'text' },
                  { name: 'district', label: 'Distrito', type: 'text' },
                ] },
                { type: 'row', fields: [
                  { name: 'address', label: 'Dirección', type: 'text' },
                  { name: 'reference', label: 'Referencia', type: 'text' },
                ] },
                { name: 'message', label: 'Comentario del cliente', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Productos',
          fields: [
            {
              name: 'items',
              label: 'Productos',
              type: 'array',
              required: true,
              minRows: 1,
              labels: { singular: 'Producto', plural: 'Productos' },
              fields: [
                { type: 'row', fields: [
                  { name: 'product', label: 'Fragancia', type: 'relationship', relationTo: 'products', required: true, admin: { width: '40%' } },
                  { name: 'format', label: 'Formato', type: 'select', required: true, options: [{ label: 'Decant 3 ml', value: '3' }, { label: 'Decant 5 ml', value: '5' }, { label: 'Frasco 100 ml', value: '100' }], admin: { width: '20%' } },
                  { name: 'qty', label: 'Cant.', type: 'number', required: true, min: 1, defaultValue: 1, admin: { width: '10%' } },
                  { name: 'unitPrice', label: 'Precio unit.', type: 'number', min: 0, admin: { width: '15%', description: 'Vacío = precio del catálogo' } },
                  { name: 'lineTotal', label: 'Total', type: 'number', admin: { readOnly: true, width: '15%' } },
                ] },
              ],
            },
            { type: 'row', fields: [
              { name: 'subtotal', label: 'Subtotal (S/)', type: 'number', admin: { readOnly: true } },
              { name: 'shippingCost', label: 'Envío (S/)', type: 'number', min: 0, access: { create: teamField } },
              { name: 'total', label: 'Total (S/)', type: 'number', admin: { readOnly: true } },
            ] },
          ],
        },
        {
          label: 'Pago y envío',
          fields: [
            {
              name: 'payment', label: 'Pago', type: 'group', access: { create: teamField, update: teamField },
              fields: [{ type: 'row', fields: [
                { name: 'method', label: 'Medio', type: 'select', options: [{ label: 'Yape', value: 'yape' }, { label: 'Plin', value: 'plin' }, { label: 'Tarjeta (link de pago)', value: 'tarjeta' }, { label: 'Powerpay (cuotas)', value: 'powerpay' }, { label: 'Mercado Pago', value: 'mercadopago' }, { label: 'Efectivo', value: 'efectivo' }] },
                { name: 'paid', label: 'Pagado', type: 'checkbox' },
                { name: 'paidAt', label: 'Fecha de pago', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
              ] }],
            },
            {
              name: 'shipment', label: 'Envío', type: 'group', access: { create: teamField, update: teamField },
              fields: [
                { type: 'row', fields: [
                  { name: 'carrier', label: 'Transportista', type: 'select', options: ['Olva Courier', 'Shalom', 'Urbano Express', 'Motorizado (Lima)', 'Retiro en persona', 'Otro'] },
                  { name: 'trackingCode', label: 'Código de seguimiento', type: 'text' },
                  { name: 'trackingUrl', label: 'Link de seguimiento', type: 'text' },
                ] },
                { type: 'row', fields: [
                  { name: 'shippedAt', label: 'Enviado', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
                  { name: 'deliveredAt', label: 'Entregado', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
                ] },
              ],
            },
            { name: 'internalNotes', label: 'Notas internas', type: 'textarea', access: { create: teamField, read: teamField } },
          ],
        },
        {
          label: 'Historial',
          fields: [
            {
              name: 'history', label: 'Historial de estados', type: 'array',
              admin: { readOnly: true, initCollapsed: false, components: { RowLabel: '/components/HistoryRowLabel#HistoryRowLabel' } },
              fields: [
                { type: 'row', fields: [
                  { name: 'status', label: 'Estado', type: 'select', options: [...STATUS] },
                  { name: 'at', label: 'Fecha', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
                  { name: 'by', label: 'Por', type: 'text' },
                ] },
                { name: 'note', label: 'Nota', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    { name: 'stockApplied', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
  ],
}

export { statusLabel }
