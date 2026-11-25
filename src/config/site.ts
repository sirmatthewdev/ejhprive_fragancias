/**
 * Business data. Values in [brackets] are placeholders pending confirmation by EJH PRIVÉ.
 * `whatsapp` must be the full international number without "+" or spaces (e.g. 51987654321).
 */
export const SITE = {
  name: 'EJH PRIVÉ',
  url: 'https://www.ejhprive.com',
  locale: 'es_PE',
  country: 'PE',
  description:
    'Perfumería árabe 100% original en Perú: Lattafa, Armaf, Rasasi y Afnan en frasco de 100 ml y decants de 3 y 5 ml fraccionados del frasco original.',
  whatsapp: '51944093055', // único número de atención y pedidos
  whatsappDisplay: '+51 944 093 055',
  instagram: 'https://www.instagram.com/perfumeriaejh/',
  tiktok: 'https://www.tiktok.com/@perfumeriaejh',
  email: '', // [correo de contacto]
  dispatch: '24 a 48 horas hábiles',
  /** Required on the Libro de Reclamaciones (Código de Protección y Defensa del Consumidor). Empty = not shown yet. */
  legal: {
    businessName: '', // [Razón social]
    ruc: '', // [RUC]
    address: '', // [Dirección fiscal]
  },
};

export const NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos/' },
  { label: 'Decants', href: '/decants/' },
  { label: 'Quiénes somos', href: '/nosotros/' },
  { label: 'Cómo comprar', href: '/como-comprar/' },
  { label: 'Contacto', href: '/contacto/' },
];

export const waLink = (text?: string) => {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}${q}` : `https://wa.me/${q}`;
};

/** Social networks with a URL, for the home section, contact page and Store schema. */
export const SOCIALS = ([
  { brand: 'instagram', label: 'Instagram', href: SITE.instagram, text: 'Novedades, nuevas llegadas y reseñas de clientes.' },
  { brand: 'tiktok', label: 'TikTok', href: SITE.tiktok, text: 'Pruebas en piel, comparaciones y recomendaciones en video.' },
] as const).filter((s) => s.href).map((s) => ({ ...s, handle: `@${s.href.replace(/\/+$/, '').split('/').pop()!.replace(/^@/, '')}` }));
