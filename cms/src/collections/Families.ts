import type { CollectionConfig } from 'payload'
import { isAdmin, isTeam } from '../access'

/** Olfactive families: the shop's filters, menu, home index and each product's colour come from here. */
export const Families: CollectionConfig = {
  slug: 'families',
  labels: { singular: 'Familia olfativa', plural: 'Familias olfativas' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'blurb', 'order'], group: 'Tienda' },
  defaultSort: 'order',
  access: { read: () => true, create: isTeam, update: isTeam, delete: isAdmin },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true, unique: true, admin: { description: 'Aparece en los filtros y el menú. Ej.: Gourmand' } },
        { name: 'blurb', label: 'Frase corta', type: 'text', admin: { description: 'Ej.: Dulces, cálidas, adictivas' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'color', label: 'Color', type: 'text', defaultValue: '#5B3A8E',
          validate: (v: string | null | undefined) => !v || /^#[0-9a-fA-F]{6}$/.test(v) || 'Usa un color hexadecimal, ej.: #8A4A2A',
          admin: { description: 'Tono del brillo detrás de los decants. Hexadecimal, ej.: #8A4A2A' },
        },
        { name: 'order', label: 'Orden', type: 'number', defaultValue: 0, admin: { description: 'Menor primero.' } },
      ],
    },
  ],
}
