import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Archivo', plural: 'Archivos' },
  admin: { group: 'Configuración' },
  access: {
    read: () => true,
    create: ({ req }) => ['admin', 'staff'].includes(String(req.user?.role)),
    update: ({ req }) => ['admin', 'staff'].includes(String(req.user?.role)),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'alt',
      label: 'Texto alternativo',
      type: 'text',
      required: true,
      admin: { description: 'Describe la imagen (accesibilidad y Google). Ej.: «Frasco de Khamrah con dátiles y canela».' },
    },
  ],
  // photos only, max 6 MB; Payload creates a 4:5 card size
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    imageSizes: [{ name: 'card', width: 900, height: 1125, position: 'centre' }],
  },
  hooks: {
    beforeOperation: [({ req, operation }) => {
      const f = req.file
      if ((operation === 'create' || operation === 'update') && f && f.size > 6 * 1024 * 1024) throw new Error('La imagen supera 6 MB. Comprímela antes de subirla.')
    }],
  },
}
