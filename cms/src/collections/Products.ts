import { APIError, type CollectionConfig } from 'payload'
import { isAdmin, isTeam, isTeamOrStore } from '../access'
import { BOTTLE_ML } from '../inventory'

// level scales for the product page meters; the shop draws the bar from the chosen level
const LEVELS = ['Baja', 'Media', 'Media-alta', 'Alta', 'Muy alta']
const SWEETNESS = ['Bajo', 'Medio', 'Marcado', 'Muy marcado']

const saleBelow = (regularField: 'p3' | 'p5' | 'p100') =>
  (value: number | null | undefined, { siblingData }: { siblingData: Record<string, unknown> }) => {
    const regular = siblingData?.[regularField] as number | null | undefined
    if (value == null || regular == null || value < regular) return true
    return 'El precio de oferta debe ser menor que el regular.'
  }

/**
 * Everything the shop sells: prices, stock, visibility, photo and the product sheet. The original
 * fragrances also have editorial content in the storefront code; `slug` links both and must not change.
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
        { name: 'brand', label: 'Marca', type: 'text', required: true, admin: { description: 'Ej.: Lattafa, Armaf, Rasasi, Afnan' } },
        { name: 'order', label: 'Orden en el catálogo', type: 'number', admin: { description: 'Menor primero. Vacío = al final.' } },
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
      type: 'row',
      fields: [
        { name: 'photo', label: 'Foto principal (opcional)', type: 'upload', relationTo: 'media', admin: { description: 'La del catálogo y la primera de la ficha (p. ej. el frasco con su caja). Reemplaza la foto de la tienda. Ideal 4:5 (vertical), mínimo 1200 × 1500 px.' } },
        { name: 'photo2', label: 'Foto 2 (opcional)', type: 'upload', relationTo: 'media', admin: { description: 'Otra vista en la ficha del producto (otro ángulo, la caja abierta…). Ideal 4:5.' } },
        { name: 'decantPhoto', label: 'Foto de decants (opcional)', type: 'upload', relationTo: 'media', admin: { description: 'Los decants de este perfume: se ve al elegir 3 ml o 5 ml. Vacía = la foto de decants general («Página de producto»).' } },
      ],
    },
    {
      // a product created here appears in the shop on its own with this sheet; for the original
      // fragrances (written in the shop's code) any field filled in here replaces the built-in text
      name: 'details',
      label: 'Ficha en la tienda',
      type: 'group',
      admin: { description: 'Lo que la tienda muestra del perfume. Un producto nuevo aparece en la web con estos datos y la foto de arriba. Campo vacío = se usa el texto que ya trae la tienda (si lo tiene).' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'gender', label: 'Para', type: 'select', options: [{ label: 'Hombre', value: 'Masculina' }, { label: 'Mujer', value: 'Femenina' }, { label: 'Unisex', value: 'Unisex' }] },
            { name: 'family', label: 'Familia olfativa', type: 'relationship', relationTo: 'families' },
            { name: 'familyLabel', label: 'Subtítulo', type: 'text', admin: { description: 'Ej.: Gourmand · Café' } },
          ],
        },
        { name: 'accord', label: 'Acorde corto', type: 'text', admin: { description: 'Tres notas que lo resumen. Ej.: Canela · Dátiles · Vainilla' } },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        {
          type: 'row',
          fields: [
            { name: 'notesTop', label: 'Notas de salida', type: 'text', admin: { description: 'Separadas por comas' } },
            { name: 'notesHeart', label: 'Notas de corazón', type: 'text', admin: { description: 'Separadas por comas' } },
            { name: 'notesBase', label: 'Notas de fondo', type: 'text', admin: { description: 'Separadas por comas' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'duration', label: 'Duración', type: 'select', options: LEVELS },
            { name: 'projection', label: 'Proyección', type: 'select', options: LEVELS },
            { name: 'sweetness', label: 'Dulzor', type: 'select', options: SWEETNESS },
            { name: 'idealFor', label: 'Ideal para', type: 'text', admin: { description: 'Ej.: Noche · frío' } },
          ],
        },
        {
          name: 'related', label: 'También te puede gustar', type: 'relationship', relationTo: 'products', hasMany: true, maxRows: 3,
          filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
          admin: { description: 'Hasta 3. Vacío = la tienda elige por familia y género.' },
        },
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
      // The stock is owned by the management system (ejh-prive-gestion): it pushes sealed bottles
      // (Lima + Cajamarca + investors) and opened ml through the API with the «Gestión (API)» user.
      // Read-only here so a manual edit is not silently overwritten on the next sync. Orders still
      // move stock through their hooks (inventory.ts), which do not go through the admin form.
      admin: { description: 'Lo actualiza solo el sistema de gestión de EJH PRIVÉ (ventas, compras, aperturas de frasco y traslados). Para cambiarlo, regístralo en la gestión: un cambio hecho aquí se perdería en la siguiente sincronización.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'sealed', label: 'Frascos sellados', type: 'number', min: 0, defaultValue: 0, required: true, admin: { readOnly: true } },
            { name: 'decantMl', label: 'ml disponibles para decants', type: 'number', min: 0, defaultValue: 0, required: true, admin: { readOnly: true } },
            { name: 'lowSealed', label: 'Alerta si quedan ≤ frascos', type: 'number', min: 0, defaultValue: 1 },
          ],
        },
        {
          name: 'openBottle',
          label: `Abrir un frasco sellado para decants (−1 frasco, +${BOTTLE_ML} ml) al guardar`,
          type: 'checkbox',
          virtual: true,
          // bottles are opened in the management system now (it pushes the resulting ml)
          admin: { hidden: true, description: 'Se aplica una vez al guardar y queda registrado como «Apertura de frasco».' },
        },
      ],
    },
  ],
}
