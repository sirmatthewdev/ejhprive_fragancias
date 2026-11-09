import type { CollectionConfig } from 'payload'
import { isAdmin, isTeam } from '../access'

/** Preguntas frecuentes: «Cómo comprar» shows all of them, the home page the marked ones. */
export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Pregunta frecuente', plural: 'Preguntas frecuentes' },
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'onHome', 'order'], group: 'Inicio' },
  defaultSort: 'order',
  access: { read: () => true, create: isTeam, update: isTeam, delete: isAdmin },
  fields: [
    { name: 'question', label: 'Pregunta', type: 'text', required: true },
    { name: 'answer', label: 'Respuesta', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        { name: 'onHome', label: 'Mostrar en el inicio', type: 'checkbox', defaultValue: false },
        { name: 'order', label: 'Orden', type: 'number', defaultValue: 0 },
      ],
    },
  ],
}
