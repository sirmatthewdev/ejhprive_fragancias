import type { Field, GlobalConfig } from 'payload'
import { isTeam } from '../access'

const t = (name: string, label: string, placeholder?: string, textarea = false): Field =>
  ({ name, label, type: textarea ? 'textarea' : 'text', admin: placeholder ? { placeholder } : undefined }) as Field
const img = (name: string, label: string, description?: string): Field =>
  ({ name, label, type: 'upload', relationTo: 'media', admin: { description: description ?? 'Vacío = la foto que trae la tienda.' } }) as Field
const row = (...fields: Field[]): Field => ({ type: 'row', fields })
const ICONS = [
  { label: 'Escudo', value: 'shield' }, { label: 'Gota', value: 'drop' }, { label: 'Camión', value: 'truck' }, { label: 'Chat', value: 'chat' },
  { label: 'Bolsa', value: 'bag' }, { label: 'Correo', value: 'mail' }, { label: 'Libro', value: 'book' }, { label: 'Efectivo', value: 'cash' },
]

/** Every text, photo and product pick on the home page. Empty = the shop's built-in content. */
export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Inicio',
  admin: { group: 'Inicio', description: 'Textos, fotos y productos de la página de inicio. Un campo vacío usa lo que trae la tienda.' },
  access: { read: () => true, update: isTeam },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Portada', name: 'hero',
          fields: [
            t('kicker', 'Antetítulo', 'Perfumería árabe · 100% original'),
            row(t('title', 'Título', 'El arte de llevar'), t('titleAccent', 'Título (parte destacada)', 'una firma.')),
            t('lead', 'Texto', 'Khamrah, 9 PM, Hawas Ice y más, en frasco de 100 ml o en decants de 3 y 5 ml para descubrirlos en tu piel.', true),
            row(t('primary', 'Botón principal', 'Explorar colección'), t('secondary', 'Botón secundario', 'Descubrir decants')),
            {
              name: 'scenes', label: 'Perfumes del video', type: 'relationship', relationTo: 'products', hasMany: true, maxRows: 3,
              admin: { description: 'Los 3 frascos que aparecen en el video, en el mismo orden (cada uno se ve 4 segundos). Si cambias el video, cambia estos.' },
            },
          ],
        },
        {
          label: 'Formatos', name: 'formats',
          fields: [
            row(t('title', 'Título', 'Elige cómo'), t('titleAccent', 'Título (parte destacada)', 'descubrirlo')),
            t('lead', 'Texto', 'El frasco completo para tu firma de siempre, o un decant para probar antes de decidir.', true),
            row(t('bottleKicker', 'Frascos: antetítulo', 'Colección completa'), t('bottleTitle', 'Frascos: título', 'Frascos 100 ml'), t('bottleText', 'Frascos: texto', 'Originales, sellados, listos para regalar.')),
            img('bottleImage', 'Frascos: foto'),
            row(t('decantKicker', 'Decants: antetítulo', 'Prueba antes de elegir'), t('decantTitle', 'Decants: título', 'Decants 3 · 5 ml'), t('decantText', 'Decants: texto', 'Todas las fragancias, del frasco original.')),
            img('decantImage', 'Decants: foto'),
          ],
        },
        {
          label: 'Colección', name: 'collection',
          fields: [
            row(t('kicker', 'Antetítulo', 'Una selección corta y deliberada'), t('title', 'Título', 'La colección'), t('button', 'Botón', 'Ver catálogo')),
            {
              name: 'products', label: 'Productos a mostrar', type: 'relationship', relationTo: 'products', hasMany: true,
              admin: { description: 'En este orden. Vacío = todos los productos visibles, en el orden del catálogo.' },
            },
          ],
        },
        {
          label: 'Decants', name: 'decants',
          fields: [
            t('kicker', 'Antetítulo', 'Decants EJH'),
            row(t('title', 'Título', 'Pruébalo en tu piel'), t('titleAccent', 'Título (parte destacada)', 'antes de elegir tu frasco.')),
            t('text', 'Texto', 'Fraccionamos cada fragancia directamente del frasco original, en atomizadores de vidrio sellados y etiquetados con nombre, volumen y lote.', true),
            {
              name: 'steps', label: 'Pasos', type: 'array', maxRows: 5,
              admin: { description: 'Vacío = los 3 pasos que trae la tienda.' },
              fields: [row(t('title', 'Título'), t('text', 'Texto'))],
            },
            {
              name: 'chips', label: 'Recuadros', type: 'array', maxRows: 3,
              admin: { description: 'Hasta 3. El último va resaltado. Vacío = 3 ml, 5 ml y Set ×3.' },
              fields: [row(t('value', 'Valor', '3 ml'), t('label', 'Detalle', '≈ 40 atomizaciones'))],
            },
            t('button', 'Botón', 'Elegir mis decants'),
            row(img('image', 'Foto vertical'), t('caption', 'Leyenda de la foto', 'Decants EJH'), t('captionDetail', 'Leyenda (detalle)', '3 ml · 5 ml')),
          ],
        },
        {
          label: 'Familias', name: 'families',
          fields: [
            row(t('kicker', 'Antetítulo', 'Encuentra tu firma'), t('title', 'Título', 'Por familia olfativa')),
            t('lead', 'Texto', 'Si ya sabes qué te gusta, empieza por aquí.'),
          ],
        },
        {
          label: 'Marcas', name: 'brands',
          admin: { description: 'Las marcas, sus logos y sus bloques destacados se editan en Inicio → Marcas.' },
          fields: [row(t('title', 'Título', 'Las casas detrás'), t('titleAccent', 'Título (parte destacada)', 'de cada fragancia'))],
        },
        {
          label: 'Promesas', name: 'trust',
          fields: [
            t('quote', 'Frase', '“Un perfume no se elige: se reconoce.”'),
            {
              name: 'items', label: 'Promesas', type: 'array', maxRows: 4,
              admin: { description: 'Vacío = las 4 que trae la tienda.' },
              fields: [row({ name: 'icon', label: 'Ícono', type: 'select', options: ICONS, defaultValue: 'shield' } as Field, t('title', 'Título'), t('text', 'Texto'))],
            },
            t('link', 'Enlace', 'Conoce EJH PRIVÉ'),
          ],
        },
        {
          label: 'Preguntas', name: 'faq',
          admin: { description: 'Las preguntas se editan en Inicio → Preguntas frecuentes (marca «Mostrar en el inicio»).' },
          fields: [row(t('kicker', 'Antetítulo', 'Antes de comprar'), t('title', 'Título', 'Preguntas frecuentes'), t('link', 'Enlace', 'Ver todas'))],
        },
        {
          label: 'Cierre', name: 'cta',
          fields: [
            row(t('kicker', 'Antetítulo', 'Asesoría personal'), t('title', 'Título', '¿No sabes cuál elegir?')),
            t('text', 'Texto', 'Cuéntanos qué perfumes te gustan y te recomendamos tu próxima firma. Si dudas, empieza con un decant de 3 ml.', true),
            t('whatsappMessage', 'Mensaje de WhatsApp', 'Hola EJH PRIVÉ, ¿me ayudan a elegir un perfume?'),
            row(t('primary', 'Botón WhatsApp', 'Asesoría por WhatsApp'), t('secondary', 'Botón secundario', 'Ver decants')),
            img('image', 'Foto de fondo'),
          ],
        },
      ],
    },
  ],
}
