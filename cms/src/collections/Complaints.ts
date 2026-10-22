import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { isAdmin, isTeam, isTeamOrStore } from '../access'

/** Response deadline: 15 business days (Mon–Fri; public holidays are not discounted). */
function addBusinessDays(from: Date, days: number) {
  const d = new Date(from)
  while (days > 0) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) days--
  }
  return d
}

const beforeChange: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation === 'create') {
    const now = new Date()
    const year = now.getFullYear()
    const last = await req.payload.find({ collection: 'complaints', where: { number: { like: `-${year}` } }, sort: '-createdAt', limit: 1, depth: 0, req, overrideAccess: true })
    const n = Number(String(last.docs[0]?.number ?? '0').split('-')[0]) + 1
    data.number = `${String(n).padStart(6, '0')}-${year}`
    data.status = 'pendiente'
    data.dueAt = addBusinessDays(now, 15).toISOString()
    data.response = undefined
    data.respondedAt = undefined
  }
  if (operation === 'update' && data.response && !originalDoc?.respondedAt) {
    data.respondedAt = new Date().toISOString()
    data.status = 'respondido'
  }
  return data
}

export const Complaints: CollectionConfig = {
  slug: 'complaints',
  labels: { singular: 'Reclamación', plural: 'Libro de Reclamaciones' },
  admin: {
    useAsTitle: 'number',
    defaultColumns: ['number', 'kind', 'consumer.name', 'status', 'dueAt', 'createdAt'],
    group: 'Tienda',
    description: 'Hojas registradas desde la web. El plazo de respuesta es de 15 días hábiles.',
  },
  defaultSort: '-createdAt',
  access: { create: isTeamOrStore, read: isTeam, update: isTeam, delete: isAdmin },
  hooks: { beforeChange: [beforeChange] },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'number', label: 'Hoja N.º', type: 'text', unique: true, index: true, admin: { readOnly: true } },
        { name: 'status', label: 'Estado', type: 'select', defaultValue: 'pendiente', options: [{ label: 'Pendiente', value: 'pendiente' }, { label: 'Respondido', value: 'respondido' }] },
        { name: 'dueAt', label: 'Responder antes del', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } } },
      ],
    },
    {
      name: 'consumer', label: '1. Consumidor reclamante', type: 'group',
      fields: [
        { type: 'row', fields: [
          { name: 'name', label: 'Nombre completo', type: 'text', required: true },
          { name: 'docType', label: 'Documento', type: 'select', required: true, defaultValue: 'DNI', options: ['DNI', 'CE', 'Pasaporte', 'RUC'] },
          { name: 'docNumber', label: 'N.º de documento', type: 'text', required: true },
        ] },
        { type: 'row', fields: [
          { name: 'phone', label: 'Teléfono', type: 'text', required: true },
          { name: 'email', label: 'Correo', type: 'email', required: true },
          { name: 'address', label: 'Domicilio', type: 'text', required: true },
        ] },
        { name: 'guardian', label: 'Padre, madre o apoderado (si es menor de edad)', type: 'text' },
      ],
    },
    {
      name: 'item', label: '2. Bien contratado', type: 'group',
      fields: [
        { type: 'row', fields: [
          { name: 'type', label: 'Tipo', type: 'radio', required: true, defaultValue: 'producto', options: [{ label: 'Producto', value: 'producto' }, { label: 'Servicio', value: 'servicio' }] },
          { name: 'amount', label: 'Monto reclamado (S/)', type: 'number', min: 0 },
          { name: 'order', label: 'N.º de pedido', type: 'text' },
        ] },
        { name: 'description', label: 'Descripción', type: 'textarea', required: true },
      ],
    },
    {
      type: 'collapsible', label: '3. Detalle',
      fields: [
        { name: 'kind', label: 'Tipo', type: 'radio', required: true, defaultValue: 'reclamo', options: [{ label: 'Reclamo (disconformidad con el producto o servicio)', value: 'reclamo' }, { label: 'Queja (disconformidad con la atención)', value: 'queja' }] },
        { name: 'detail', label: 'Detalle', type: 'textarea', required: true },
        { name: 'request', label: 'Pedido del consumidor', type: 'textarea', required: true },
      ],
    },
    {
      type: 'collapsible', label: '4. Respuesta del proveedor',
      fields: [
        { name: 'response', label: 'Observaciones y acciones adoptadas', type: 'textarea', access: { create: () => false } },
        { name: 'respondedAt', label: 'Fecha de respuesta', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
  ],
}
