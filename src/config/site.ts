/**
 * Business data. Values in [brackets] are placeholders pending confirmation by EJH PRIVÉ.
 * `whatsapp` must be the full international number without "+" or spaces (e.g. 51987654321).
 */
export const SITE = {
  name: 'EJH PRIVÉ',
  url: 'https://ejhprive.com', // [dominio a confirmar]
  locale: 'es_PE',
  country: 'PE',
  description:
    'Perfumería árabe 100% original: Lattafa, Armaf, Rasasi y Afnan en frasco de 100 ml y decants de 3 y 5 ml fraccionados del frasco original.',
  whatsapp: '', // [número de WhatsApp, formato 51 + 9 dígitos, ej. 51987654321]
  instagram: '', // [https://instagram.com/usuario]
  tiktok: '', // [https://tiktok.com/@usuario]
  email: '', // [correo de contacto]
  dispatch: '24 a 48 horas hábiles',
  /** Required on the Libro de Reclamaciones (Código de Protección y Defensa del Consumidor). */
  legal: {
    businessName: '[Razón social]',
    ruc: '[RUC]',
    address: '[Dirección fiscal]',
  },
};

export const NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos/' },
  { label: 'Decants', href: '/#decants' },
  { label: 'Quiénes somos', href: '/nosotros/' },
  { label: 'Cómo comprar', href: '/como-comprar/' },
  { label: 'Contacto', href: '/contacto/' },
];

export const waLink = (text?: string) => {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}${q}` : `https://wa.me/${q}`;
};
