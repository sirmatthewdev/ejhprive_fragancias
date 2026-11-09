import type { CollectionConfig } from 'payload'
import { isAdmin, isTeam } from '../access'

/**
 * Brands on the home page: the logo row and the featured «casas». A product belongs to a brand
 * when its «Marca» text matches this name.
 */
export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: 'Marca', plural: 'Marcas' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'inRow', 'featured', 'order'], group: 'Inicio' },
  defaultSort: 'order',
  access: { read: () => true, create: isTeam, update: isTeam, delete: isAdmin },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true, unique: true, admin: { description: 'Igual que el campo «Marca» de sus productos.' } },
        { name: 'order', label: 'Orden', type: 'number', defaultValue: 0 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media', admin: { description: 'PNG claro (crema o blanco) con fondo transparente. Vacío = el logo que trae la tienda, si existe.' } },
        { name: 'logoSize', label: 'Tamaño del logo', type: 'select', defaultValue: 'normal', options: [{ label: 'Chico', value: 'small' }, { label: 'Normal', value: 'normal' }, { label: 'Grande', value: 'large' }] },
      ],
    },
    { name: 'inRow', label: 'Mostrar en la fila de logos del inicio', type: 'checkbox', defaultValue: true, admin: { description: 'Solo aparece si tiene productos visibles.' } },
    { name: 'featured', label: 'Destacar como «casa» en el inicio', type: 'checkbox', defaultValue: false },
    {
      type: 'group', name: 'house', label: 'Bloque destacado',
      admin: { condition: (data) => !!data?.featured },
      fields: [
        { name: 'text', label: 'Texto', type: 'textarea' },
        {
          type: 'row',
          fields: [
            { name: 'image', label: 'Foto horizontal', type: 'upload', relationTo: 'media', admin: { description: 'Ideal 16:10. Vacío = la foto que trae la tienda, si existe.' } },
            { name: 'imageAlt', label: 'Descripción de la foto', type: 'text' },
          ],
        },
        { name: 'products', label: 'Productos a enlazar', type: 'relationship', relationTo: 'products', hasMany: true, maxRows: 4, admin: { description: 'La foto lleva al primero.' } },
      ],
    },
  ],
}
