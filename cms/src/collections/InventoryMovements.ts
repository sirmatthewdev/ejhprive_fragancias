import type { CollectionConfig } from 'payload'
import { isAdmin, isTeam } from '../access'

/** Read-only audit trail; written by order hooks and manual product edits. */
export const InventoryMovements: CollectionConfig = {
  slug: 'inventory-movements',
  labels: { singular: 'Movimiento de stock', plural: 'Movimientos de stock' },
  admin: {
    useAsTitle: 'note',
    defaultColumns: ['createdAt', 'product', 'type', 'bottles', 'ml', 'order', 'user'],
    group: 'Tienda',
    description: 'Historial automático: ventas, devoluciones, frascos abiertos para decants y ajustes manuales.',
  },
  defaultSort: '-createdAt',
  access: {
    read: isTeam,
    create: ({ req }) => !!req.context?.fromInventory || req.user?.role === 'admin',
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    { name: 'product', label: 'Producto', type: 'relationship', relationTo: 'products', required: true, index: true },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { label: 'Venta', value: 'venta' },
        { label: 'Devolución / cancelación', value: 'devolucion' },
        { label: 'Apertura de frasco', value: 'apertura' },
        { label: 'Ingreso de mercadería', value: 'ingreso' },
        { label: 'Ajuste manual', value: 'ajuste' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'bottles', label: 'Frascos (±)', type: 'number', defaultValue: 0 },
        { name: 'ml', label: 'ml (±)', type: 'number', defaultValue: 0 },
      ],
    },
    { name: 'order', label: 'Pedido', type: 'relationship', relationTo: 'orders' },
    { name: 'user', label: 'Usuario', type: 'relationship', relationTo: 'users' },
    { name: 'note', label: 'Detalle', type: 'text' },
  ],
}
