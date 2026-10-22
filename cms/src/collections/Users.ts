import type { CollectionConfig } from 'payload'
import { adminField, canUsePanel, isAdmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Configuración',
  },
  auth: {
    useAPIKey: true, // only the "Tienda (API)" user needs a key
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  access: {
    admin: canUsePanel,
    create: isAdmin,
    delete: isAdmin,
    // everyone can read/update themselves; admins manage everybody
    read: ({ req }) => (req.user?.role === 'admin' ? true : { id: { equals: req.user?.id } }),
    update: ({ req }) => (req.user?.role === 'admin' ? true : { id: { equals: req.user?.id } }),
  },
  fields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      access: { update: adminField },
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Equipo (pedidos y stock)', value: 'staff' },
        { label: 'Tienda (API)', value: 'storefront' },
      ],
      admin: { description: 'Administrador: todo. Equipo: pedidos, productos y stock. Tienda (API): solo la web, para registrar pedidos.' },
    },
  ],
}
