import { APIError, type CollectionConfig } from 'payload'
import { isAdmin, isTeam, isTeamOrStore } from '../access'
import { BOTTLE_ML } from '../inventory'

const saleBelow = (regularField: 'p3' | 'p5' | 'p100') =>
  (value: number | null | undefined, { siblingData }: { siblingData: Record<string, unknown> }) => {
    const regular = siblingData?.[regularField] as number | null | undefined
    if (value == null || regular == null || value < regular) return true
    return 'El precio de oferta debe ser menor que el regular.'
  }

/**
 * Commercial data per fragrance (prices, stock, visibility). Editorial content and imagery
 * stay in the storefront code; `slug` is the link between both and must not change.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Producto', plural: 'Productos' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'brand', 'active', 'stock.sealed', 'stock.decantMl', 'updatedAt'],
    group: 'Tienda',
    listSearchableFields: ['name', 'brand', 'slug'],
  },
  access: { read: isTeamOrStore, create: isAdmin, update: isTeam, delete: isAdmin },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, context }) => {
        if (!data?.stock?.openBottle) return data
        const sealed = data.stock.sealed ?? originalDoc?.stock?.sealed ?? 0
        if (sealed < 1) throw new APIError('No quedan frascos sellados para abrir.', 400, null, true)
        data.stock = { ...data.stock, sealed: sealed - 1, decantMl: (data.stock.decantMl ?? originalDoc?.stock?.decantMl ?? 0) + BOTTLE_ML, openBottle: false }
        context.openedBottle = true
        return data
      },
    ],
    // every manual stock edit leaves a trace in "Movimientos de stock"
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        if (context.fromInventory) return
        const db = (doc.stock?.sealed ?? 0) - (operation === 'update' ? previousDoc?.stock?.sealed ?? 0 : 0)
        const dm = (doc.stock?.decantMl ?? 0) - (operation === 'update' ? previousDoc?.stock?.decantMl ?? 0 : 0)
        if (!db && !dm) return
        await req.payload.create({
          collection: 'inventory-movements', req, depth: 0, context: { fromInventory: true },
          data: {
            product: doc.id, bottles: db, ml: dm, user: req.user?.id ? Number(req.user.id) : undefined,
            type: context.openedBottle ? 'apertura' : operation === 'create' ? 'ingreso' : 'ajuste',
            note: context.openedBottle ? 'Frasco sellado abierto para decants' : 'Edición manual del producto',
          },
        })
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'brand', label: 'Marca', type: 'select', required: true, options: ['Lattafa', 'Armaf', 'Rasasi', 'Afnan'] },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'slug', label: 'Identificador web', type: 'text', required: true, unique: true, index: true, access: { update: ({ req }) => req.user?.role === 'admin' }, admin: { description: 'Debe coincidir con la URL de la tienda (/productos/<identificador>/).' } },
        { name: 'active', label: 'Visible en la tienda', type: 'checkbox', defaultValue: true },
        { name: 'tag', label: 'Etiqueta', type: 'text', admin: { description: 'Ej.: Más vendido, Nuevo. Vacío = sin etiqueta.' } },
      ],
    },
    {
      name: 'prices',
      label: 'Precios (S/)',
      type: 'group',
      admin: { description: 'Precio regular vacío = la tienda muestra «A confirmar». Si cargas un precio de oferta menor, la tienda lo muestra con el regular tachado y el % de descuento.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'p3', label: 'Decant 3 ml · regular', type: 'number', min: 0 },
            { name: 'p5', label: 'Decant 5 ml · regular', type: 'number', min: 0 },
            { name: 'p100', label: 'Frasco 100 ml · regular', type: 'number', min: 0 },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 's3', label: 'Decant 3 ml · oferta', type: 'number', min: 0, validate: saleBelow('p3') },
            { name: 's5', label: 'Decant 5 ml · oferta', type: 'number', min: 0, validate: saleBelow('p5') },
            { name: 's100', label: 'Frasco 100 ml · oferta', type: 'number', min: 0, validate: saleBelow('p100') },
          ],
        },
        {
          name: 'saleEndsAt',
          label: 'La oferta termina',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Opcional. Pasada esta fecha la tienda vuelve sola al precio regular.' },
        },
      ],
    },
    {
      name: 'stock',
      label: 'Stock',
      type: 'group',
      admin: { description: `Frascos sellados: lo que se vende como frasco de 100 ml. ml para decants: lo único con lo que se venden decants de 3 y 5 ml; si llega a 0, la tienda los muestra agotados. Para sumar ml, marca «Abrir un frasco sellado» (resta 1 frasco y suma ${BOTTLE_ML} ml). Cada cambio queda en «Movimientos de stock».` },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'sealed', label: 'Frascos sellados', type: 'number', min: 0, defaultValue: 0, required: true },
            { name: 'decantMl', label: 'ml disponibles para decants', type: 'number', min: 0, defaultValue: 0, required: true },
            { name: 'lowSealed', label: 'Alerta si quedan ≤ frascos', type: 'number', min: 0, defaultValue: 1 },
          ],
        },
        {
          name: 'openBottle',
          label: `Abrir un frasco sellado para decants (−1 frasco, +${BOTTLE_ML} ml) al guardar`,
          type: 'checkbox',
          virtual: true,
          admin: { description: 'Se aplica una vez al guardar y queda registrado como «Apertura de frasco».' },
        },
      ],
    },
  ],
}
