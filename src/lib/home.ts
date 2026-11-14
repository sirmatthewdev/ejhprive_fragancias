/**
 * Home page content from the panel («Inicio», «Marcas», «Preguntas frecuentes»), merged over the
 * shop's built-in content: every empty field keeps what the page had before. 30 s freshness.
 */
import type { ImageMetadata } from 'astro';
import { CMS_API_KEY, CMS_URL } from 'astro:env/server';
import { FAQ } from '../data/faq';
import catFrascos from '../assets/img/cat-frascos.jpg';
import decantsPlate from '../assets/img/decants-plate.jpg';
import decantsSilk from '../assets/img/decants-silk.jpg';
import decantsWide from '../assets/img/decants-real-wide.jpg';
import brandLattafa from '../assets/img/brand-lattafa.jpg';
import brandArmaf from '../assets/img/brand-armaf.jpg';
import logoLattafa from '../assets/brands/lattafa.png';
import logoArmaf from '../assets/brands/armaf.png';
import logoRasasi from '../assets/brands/rasasi.png';
import logoAfnan from '../assets/brands/afnan.png';

export type Img = string | ImageMetadata;
export type IconName = 'shield' | 'drop' | 'truck' | 'chat' | 'bag' | 'mail' | 'book' | 'cash';

export interface Brand {
  name: string; logo: Img | null; logoSize: 'small' | 'normal' | 'large'; inRow: boolean;
  house: { text: string; image: Img | null; imageAlt: string; slugs: string[]; pos: string } | null;
}
export interface Faq { q: string; a: string; home: boolean }

// ---- built-in content (what the page showed before it was editable) ----
const BUILT_IN_LOGOS: Record<string, ImageMetadata> = { Lattafa: logoLattafa, Armaf: logoArmaf, Rasasi: logoRasasi, Afnan: logoAfnan };
const BUILT_IN_HOUSE_IMAGES: Record<string, ImageMetadata> = { Lattafa: brandLattafa, Armaf: brandArmaf };
// framing of the built-in photos (the Armaf shot keeps the bottles' tops in view)
const BUILT_IN_POS: Record<string, string> = { Armaf: 'object-[50%_18%]' };
const BUILT_IN_BRANDS: Brand[] = [
  { name: 'Lattafa', logo: logoLattafa, logoSize: 'normal', inRow: true, house: { text: 'La casa de Dubái detrás de dos de las fragancias árabes más buscadas: Khamrah, especiada y golosa, y su versión con café, Khamrah Qahwa.', image: brandLattafa, imageAlt: 'Lattafa Khamrah y Khamrah Qahwa', slugs: ['khamrah', 'khamrah-qahwa'], pos: 'object-center' } },
  { name: 'Armaf', logo: logoArmaf, logoSize: 'large', inRow: true, house: { text: 'La línea Odyssey reinterpreta perfiles de diseñador con carácter propio: Mandarin Sky, cítrica y caramelizada, y Spectra, especiada y versátil.', image: brandArmaf, imageAlt: 'Armaf Odyssey Mandarin Sky y Odyssey Spectra', slugs: ['odyssey-mandarin-sky', 'odyssey-spectra'], pos: 'object-[50%_18%]' } },
  { name: 'Rasasi', logo: logoRasasi, logoSize: 'small', inRow: true, house: null },
  { name: 'Afnan', logo: logoAfnan, logoSize: 'normal', inRow: true, house: null },
];

const DEFAULTS = {
  hero: {
    kicker: 'Perfumería árabe · 100% original', title: 'El arte de llevar', titleAccent: 'una firma.',
    lead: 'Khamrah, 9 PM, Hawas Ice y más, en frasco de 100 ml o en decants de 3 y 5 ml para descubrirlos en tu piel.',
    primary: 'Explorar colección', secondary: 'Descubrir decants',
    scenes: ['khamrah', '9-pm', 'odyssey-mandarin-sky'],
  },
  formats: {
    title: 'Elige cómo', titleAccent: 'descubrirlo', lead: 'El frasco completo para tu firma de siempre, o un decant para probar antes de decidir.',
    bottleKicker: 'Colección completa', bottleTitle: 'Frascos 100 ml', bottleText: 'Originales, sellados, listos para regalar.', bottleImage: catFrascos as Img,
    decantKicker: 'Prueba antes de elegir', decantTitle: 'Decants 3 · 5 ml', decantText: 'Todas las fragancias, del frasco original.', decantImage: decantsPlate as Img,
  },
  collection: { kicker: 'Una selección corta y deliberada', title: 'La colección', button: 'Ver catálogo', slugs: [] as string[] },
  decants: {
    kicker: 'Decants EJH', title: 'Pruébalo en tu piel', titleAccent: 'antes de elegir tu frasco.',
    text: 'Fraccionamos cada fragancia directamente del frasco original, en atomizadores de vidrio sellados y etiquetados con nombre, volumen y lote.',
    steps: [
      { title: 'Elige fragancia y tamaño', text: 'Decant de 3 ml (≈ 40 atomizaciones) o 5 ml (≈ 70).' },
      { title: 'Lo fraccionamos del original', text: 'Sin diluir ni alterar, en vidrio sellado y etiquetado.' },
      { title: 'Recíbelo y pruébalo', text: 'Si te enamora, pasa al frasco de 100 ml.' },
    ],
    chips: [{ value: '3 ml', label: '≈ 40 atomizaciones' }, { value: '5 ml', label: '≈ 70 atomizaciones' }, { value: 'Set ×3', label: 'Tres decants a elección' }],
    button: 'Elegir mis decants', image: decantsSilk as Img, caption: 'Decants EJH', captionDetail: '3 ml · 5 ml',
  },
  families: { kicker: 'Encuentra tu firma', title: 'Por familia olfativa', lead: 'Si ya sabes qué te gusta, empieza por aquí.' },
  brands: { title: 'Las casas detrás', titleAccent: 'de cada fragancia' },
  trust: {
    quote: '“Un perfume no se elige: se reconoce.”',
    items: [
      { icon: 'shield' as IconName, title: '100% originales', text: 'Frascos sellados e importados. Nunca réplicas.' },
      { icon: 'drop' as IconName, title: 'Fraccionado del original', text: 'Decants en vidrio, sellados y con lote.' },
      { icon: 'truck' as IconName, title: 'Envío en 24–48 h', text: 'A todo el país, con seguimiento.' },
      { icon: 'chat' as IconName, title: 'Asesoría personal', text: 'Te ayudamos a elegir por WhatsApp.' },
    ],
    link: 'Conoce EJH PRIVÉ',
  },
  faq: { kicker: 'Antes de comprar', title: 'Preguntas frecuentes', link: 'Ver todas' },
  cta: {
    kicker: 'Asesoría personal', title: '¿No sabes cuál elegir?',
    text: 'Cuéntanos qué perfumes te gustan y te recomendamos tu próxima firma. Si dudas, empieza con un decant de 3 ml.',
    whatsappMessage: 'Hola EJH PRIVÉ, ¿me ayudan a elegir un perfume?', primary: 'Asesoría por WhatsApp', secondary: 'Ver decants', image: decantsWide as Img,
  },
};
export type HomeContent = typeof DEFAULTS & { brandList: Brand[]; faqs: Faq[] };

// ---- panel → content ----
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const media = (m: any): string | undefined => {
  const u = m?.url;
  if (!u) return undefined;
  return /^https?:/.test(u) ? u : `${CMS_URL}${u}`;
};
const slugs = (v: unknown) => (Array.isArray(v) ? v.map((x: any) => x?.slug).filter(Boolean) as string[] : []);
/** copy every non-empty text of `src` over `base` (only keys `base` already has) */
const texts = <T extends Record<string, unknown>>(base: T, src: any): T => {
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(base)) if (typeof base[k] === 'string') out[k] = str(src?.[k]) ?? base[k];
  return out as T;
};

function merge(home: any, brands: any[] | null, faqs: any[] | null): HomeContent {
  const h = home ?? {};
  const d = DEFAULTS;
  const stepRows = (h.decants?.steps ?? []).map((s: any) => ({ title: str(s.title), text: str(s.text) })).filter((s: any) => s.title);
  const chipRows = (h.decants?.chips ?? []).map((c: any) => ({ value: str(c.value), label: str(c.label) ?? '' })).filter((c: any) => c.value);
  const trustRows = (h.trust?.items ?? []).map((i: any) => ({ icon: (i.icon ?? 'shield') as IconName, title: str(i.title), text: str(i.text) ?? '' })).filter((i: any) => i.title);
  return {
    hero: { ...texts(d.hero, h.hero), scenes: slugs(h.hero?.scenes).length ? slugs(h.hero?.scenes) : d.hero.scenes },
    formats: { ...texts(d.formats, h.formats), bottleImage: media(h.formats?.bottleImage) ?? d.formats.bottleImage, decantImage: media(h.formats?.decantImage) ?? d.formats.decantImage },
    collection: { ...texts(d.collection, h.collection), slugs: slugs(h.collection?.products) },
    decants: {
      ...texts(d.decants, h.decants),
      steps: stepRows.length ? stepRows : d.decants.steps,
      chips: chipRows.length ? chipRows : d.decants.chips,
      image: media(h.decants?.image) ?? d.decants.image,
    },
    families: texts(d.families, h.families),
    brands: texts(d.brands, h.brands),
    trust: { ...texts(d.trust, h.trust), items: trustRows.length ? trustRows : d.trust.items },
    faq: texts(d.faq, h.faq),
    cta: { ...texts(d.cta, h.cta), image: media(h.cta?.image) ?? d.cta.image },
    brandList: brands?.length
      ? brands.map((b) => ({
          name: b.name,
          logo: media(b.logo) ?? BUILT_IN_LOGOS[b.name] ?? null,
          logoSize: b.logoSize ?? 'normal',
          inRow: b.inRow !== false,
          house: b.featured
            ? { text: str(b.house?.text) ?? '', image: media(b.house?.image) ?? BUILT_IN_HOUSE_IMAGES[b.name] ?? null, imageAlt: str(b.house?.imageAlt) ?? b.name, slugs: slugs(b.house?.products),
                pos: media(b.house?.image) ? 'object-center' : BUILT_IN_POS[b.name] ?? 'object-center' }
            : null,
        }))
      : BUILT_IN_BRANDS,
    faqs: faqs?.length ? faqs.map((f) => ({ q: f.question, a: f.answer, home: !!f.onHome })) : FAQ.map((f) => ({ q: f.q, a: f.a, home: !!f.home })),
  };
}

const TTL = 30_000;
let cache: { at: number; data: HomeContent } | null = null;
let inflight: Promise<HomeContent> | null = null;

async function load(): Promise<HomeContent> {
  try {
    if (!CMS_URL) throw new Error('sin CMS_URL');
    // the shop's API key: products linked from the home page are only readable by the team and the shop
    const headers: Record<string, string> = CMS_API_KEY ? { Authorization: `users API-Key ${CMS_API_KEY}` } : {};
    const get = (path: string) => fetch(`${CMS_URL}/cms-api/${path}`, { headers, signal: AbortSignal.timeout(2500) }).then((r) => { if (!r.ok) throw new Error(`CMS ${r.status}`); return r.json(); });
    const [home, brands, faqs] = await Promise.all([get('globals/home?depth=1'), get('brands?limit=100&sort=order&depth=1'), get('faqs?limit=100&sort=order&depth=0')]);
    const data = merge(home, brands.docs, faqs.docs);
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.warn('[cms] inicio no disponible, uso el contenido de la tienda:', (e as Error).message);
    return cache?.data ?? merge(null, null, null);
  } finally {
    inflight = null;
  }
}

/** true once the panel has answered (the content is not the built-in fallback) */
export const homeIsLive = () => cache !== null;

export async function getHome(): Promise<HomeContent> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  inflight ??= load();
  return inflight;
}
