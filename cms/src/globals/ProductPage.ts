import type { GlobalConfig } from 'payload'
import { isTeam } from '../access'

/** Texts and images shared by every product page and card. Empty = the shop's built-in text. */
export const ProductPage: GlobalConfig = {
  slug: 'product-page',
  label: 'Página de producto',
  admin: { group: 'Tienda', description: 'Textos e imágenes comunes a todos los productos. Un campo vacío usa el texto que trae la tienda.' },
  access: { read: () => true, update: isTeam },
  fields: [
    {
      type: 'collapsible', label: 'Formatos',
      fields: [{
        type: 'row',
        fields: [
          { name: 'format3', label: 'Detalle del decant 3 ml', type: 'text', admin: { placeholder: '≈ 40 atomizaciones' } },
          { name: 'format5', label: 'Detalle del decant 5 ml', type: 'text', admin: { placeholder: '≈ 70 atomizaciones' } },
          { name: 'format100', label: 'Detalle del frasco 100 ml', type: 'text', admin: { placeholder: 'Original sellado' } },
        ],
      }],
    },
    {
      type: 'collapsible', label: 'Sellos bajo el botón de compra',
      fields: [{
        type: 'row',
        fields: [
          { name: 'badge1', label: 'Sello 1', type: 'text', admin: { placeholder: '100% original' } },
          { name: 'badge2', label: 'Sello 2', type: 'text', admin: { placeholder: 'Envío a todo el país' } },
          { name: 'badge3', label: 'Sello 3', type: 'text', admin: { placeholder: 'Asesoría personal' } },
        ],
      }],
    },
    {
      type: 'collapsible', label: 'Sección de decants',
      admin: { description: 'Escribe {nombre} donde va el nombre del perfume.' },
      fields: [
        { name: 'decantKicker', label: 'Antetítulo', type: 'text', admin: { placeholder: 'Decant {nombre}' } },
        {
          type: 'row',
          fields: [
            { name: 'decantTitle', label: 'Título', type: 'text', admin: { placeholder: '¿Primera vez con {nombre}?' } },
            { name: 'decantTitleAccent', label: 'Título (parte destacada)', type: 'text', admin: { placeholder: 'Empieza con 3 ml.' } },
          ],
        },
        { name: 'decantText', label: 'Texto', type: 'textarea', admin: { placeholder: 'Fraccionado del frasco original en un atomizador de vidrio sellado. Si te enamora, el frasco de 100 ml te espera.' } },
        { name: 'decantButton', label: 'Botón', type: 'text', admin: { placeholder: 'Elegir decant de 3 ml' } },
      ],
    },
    {
      type: 'collapsible', label: 'Textos',
      fields: [
        { name: 'aboutTitle', label: 'Título de la descripción', type: 'text', admin: { placeholder: 'Sobre la fragancia' } },
        { name: 'fallbackDescription', label: 'Descripción si el producto no tiene', type: 'textarea' },
        { name: 'relatedTitle', label: 'Título de recomendados', type: 'text', admin: { placeholder: 'También te puede gustar' } },
      ],
    },
    {
      type: 'collapsible', label: 'Imágenes',
      fields: [{
        type: 'row',
        fields: [
          { name: 'decantPhoto', label: 'Foto de los decants', type: 'upload', relationTo: 'media', admin: { description: 'La misma para todos los productos. Ideal PNG con fondo transparente.' } },
          { name: 'placeholderPhoto', label: 'Foto mientras un producto no tiene la suya', type: 'upload', relationTo: 'media' },
        ],
      }],
    },
  ],
}
