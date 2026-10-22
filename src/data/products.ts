import type { ImageMetadata } from 'astro';

import khamrah from '../assets/img/product-khamrah.jpg';
import qahwa from '../assets/img/product-qahwa.jpg';
import mandarin from '../assets/img/product-mandarin.jpg';
import spectra from '../assets/img/product-spectra.jpg';
import hawas from '../assets/img/product-hawas.jpg';
import ninepm from '../assets/img/product-ninepm.jpg';
// real photo of the spray decants (Pexels 7000326, free licence); the same vial is used for every fragrance
import decantPhoto from '../assets/img/decants-real.jpg';

export type Family = 'Gourmand' | 'Ámbar especiada' | 'Nocturna' | 'Fresca';
export type FormatId = '3' | '5' | '100';

export interface Meter { label: string; value: string; pct: number }

export interface Product {
  slug: string;
  brand: 'Lattafa' | 'Armaf' | 'Rasasi' | 'Afnan';
  name: string;
  family: Family;
  familyLabel: string;
  gender: 'Unisex' | 'Masculina';
  tag?: string;
  /** Short line used in cards, hero and meta descriptions. */
  accord: string;
  desc: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  /** Editorial estimates — confirm with the client before launch. */
  meters: Meter[];
  img: ImageMetadata;
  decant: ImageMetadata;
  related: string[];
}

// Prices and stock live in the CMS (cms/ → Productos); see src/lib/cms.ts.

export const FORMATS: { id: FormatId; size: string; kind: 'Decant' | 'Frasco'; detail: string }[] = [
  { id: '3', size: '3 ml', kind: 'Decant', detail: '≈ 40 atomizaciones' },
  { id: '5', size: '5 ml', kind: 'Decant', detail: '≈ 70 atomizaciones' },
  { id: '100', size: '100 ml', kind: 'Frasco', detail: 'Original sellado' },
];

export const products: Product[] = [
  {
    slug: 'khamrah', brand: 'Lattafa', name: 'Khamrah', family: 'Gourmand', familyLabel: 'Ámbar especiada · Gourmand', gender: 'Unisex', tag: 'Más vendido',
    accord: 'Canela · Dátiles · Vainilla',
    desc: 'El clásico de Lattafa: una apertura especiada de canela y nuez moscada que da paso a un corazón goloso de dátiles y praliné, sobre un fondo cálido de vainilla, haba tonka y benjuí. Gran presencia, ideal para la noche y los meses fríos.',
    notes: { top: ['Canela', 'Nuez moscada', 'Bergamota'], heart: ['Dátiles', 'Praliné', 'Nardo'], base: ['Vainilla', 'Haba tonka', 'Benjuí', 'Amberwood'] },
    meters: [{ label: 'Duración', value: 'Alta', pct: 85 }, { label: 'Proyección', value: 'Alta', pct: 80 }, { label: 'Dulzor', value: 'Marcado', pct: 75 }, { label: 'Ideal para', value: 'Noche · frío', pct: 70 }],
    img: khamrah, decant: decantPhoto, related: ['qahwa', 'ninepm', 'spectra'],
  },
  {
    slug: 'khamrah-qahwa', brand: 'Lattafa', name: 'Khamrah Qahwa', family: 'Gourmand', familyLabel: 'Gourmand · Café', gender: 'Unisex', tag: 'Favorito',
    accord: 'Cardamomo · Praliné · Café',
    desc: 'La versión con café del Khamrah: canela, cardamomo y jengibre abren paso a un corazón de praliné y frutas confitadas, con un fondo tostado de café, vainilla y haba tonka. Envolvente y muy reconocible.',
    notes: { top: ['Canela', 'Cardamomo', 'Jengibre'], heart: ['Praliné', 'Frutas confitadas', 'Flores blancas'], base: ['Café', 'Vainilla', 'Haba tonka', 'Benjuí', 'Almizcle'] },
    meters: [{ label: 'Duración', value: 'Alta', pct: 85 }, { label: 'Proyección', value: 'Media-alta', pct: 72 }, { label: 'Dulzor', value: 'Marcado', pct: 78 }, { label: 'Ideal para', value: 'Tarde · noche', pct: 68 }],
    img: qahwa, decant: decantPhoto, related: ['khamrah', 'ninepm', 'mandarin'],
  },
  {
    slug: '9-pm', brand: 'Afnan', name: '9 PM', family: 'Nocturna', familyLabel: 'Ámbar vainillada · Nocturna', gender: 'Masculina', tag: 'Para la noche',
    accord: 'Manzana · Lavanda · Vainilla',
    desc: 'Pensado para la noche: manzana, canela, lavanda y bergamota abren paso a azahar y lirio de los valles, sobre un fondo envolvente de vainilla, haba tonka, ámbar y pachulí.',
    notes: { top: ['Manzana', 'Canela', 'Lavanda', 'Bergamota'], heart: ['Azahar', 'Lirio de los valles'], base: ['Vainilla', 'Haba tonka', 'Ámbar', 'Pachulí'] },
    meters: [{ label: 'Duración', value: 'Alta', pct: 80 }, { label: 'Proyección', value: 'Alta', pct: 82 }, { label: 'Dulzor', value: 'Marcado', pct: 72 }, { label: 'Ideal para', value: 'Noche', pct: 85 }],
    img: ninepm, decant: decantPhoto, related: ['khamrah', 'spectra', 'qahwa'],
  },
  {
    slug: 'odyssey-mandarin-sky', brand: 'Armaf', name: 'Odyssey Mandarin Sky', family: 'Ámbar especiada', familyLabel: 'Ámbar especiada · Cítrica', gender: 'Masculina',
    accord: 'Mandarina · Caramelo · Haba tonka',
    desc: 'Mandarina y naranja con un toque de azafrán y salvia, sobre un corazón de caramelo y haba tonka, y un fondo de vetiver, cedro y ambroxan. Solar, dulce y magnético.',
    notes: { top: ['Salvia', 'Mandarina', 'Naranja', 'Azafrán'], heart: ['Caramelo', 'Haba tonka', 'Tagete'], base: ['Vetiver', 'Cedro', 'Ambroxan'] },
    meters: [{ label: 'Duración', value: 'Media-alta', pct: 72 }, { label: 'Proyección', value: 'Media-alta', pct: 70 }, { label: 'Dulzor', value: 'Medio', pct: 60 }, { label: 'Ideal para', value: 'Día · salidas', pct: 65 }],
    img: mandarin, decant: decantPhoto, related: ['spectra', 'khamrah', 'hawas'],
  },
  {
    slug: 'odyssey-spectra', brand: 'Armaf', name: 'Odyssey Spectra', family: 'Ámbar especiada', familyLabel: 'Ámbar especiada · Unisex', gender: 'Unisex', tag: 'Nuevo',
    accord: 'Manzana · Azahar · Tabaco',
    desc: 'Manzana y bergamota envueltas en canela, con un corazón floral de azahar, lirio de los valles y lavanda, que descansa sobre vainilla, tabaco, pachulí y ámbar. Versátil y fácil de llevar.',
    notes: { top: ['Manzana', 'Bergamota', 'Canela'], heart: ['Azahar', 'Lirio de los valles', 'Lavanda'], base: ['Vainilla', 'Haba tonka', 'Tabaco', 'Pachulí', 'Ámbar'] },
    meters: [{ label: 'Duración', value: 'Media-alta', pct: 70 }, { label: 'Proyección', value: 'Media', pct: 62 }, { label: 'Dulzor', value: 'Medio', pct: 58 }, { label: 'Ideal para', value: 'Todo el año', pct: 75 }],
    img: spectra, decant: decantPhoto, related: ['ninepm', 'mandarin', 'khamrah'],
  },
  {
    slug: 'hawas-ice', brand: 'Rasasi', name: 'Hawas Ice', family: 'Fresca', familyLabel: 'Fresca · Acuática', gender: 'Masculina', tag: 'Para el calor',
    accord: 'Manzana helada · Limón · Musgo',
    desc: 'Manzana helada, limón, bergamota y anís estrellado sobre un corazón de azahar, ciruela y cardamomo, con un fondo de musgo, madera de deriva, ámbar y almizcle. Frescura intensa sin perder carácter.',
    notes: { top: ['Manzana helada', 'Limón', 'Bergamota', 'Anís estrellado'], heart: ['Azahar', 'Ciruela', 'Cardamomo'], base: ['Musgo', 'Madera de deriva', 'Ámbar', 'Almizcle'] },
    meters: [{ label: 'Duración', value: 'Media-alta', pct: 70 }, { label: 'Proyección', value: 'Alta', pct: 78 }, { label: 'Dulzor', value: 'Bajo', pct: 30 }, { label: 'Ideal para', value: 'Día · calor', pct: 80 }],
    img: hawas, decant: decantPhoto, related: ['mandarin', 'spectra', 'ninepm'],
  },
];

// related ids above use short keys; map them to slugs
const SHORT: Record<string, string> = {
  khamrah: 'khamrah', qahwa: 'khamrah-qahwa', ninepm: '9-pm', mandarin: 'odyssey-mandarin-sky', spectra: 'odyssey-spectra', hawas: 'hawas-ice',
};

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);
export const relatedOf = (p: Product) => p.related.map((k) => bySlug(SHORT[k])!).filter(Boolean);
export const productUrl = (p: Pick<Product, 'slug'>) => `/productos/${p.slug}/`;

export const FAMILIES: { id: Family; blurb: string; tone: string }[] = [
  { id: 'Gourmand', blurb: 'Dulces, cálidas, adictivas', tone: '#8A4A2A' },
  { id: 'Ámbar especiada', blurb: 'Especias, resinas y luz', tone: '#5E4690' },
  { id: 'Nocturna', blurb: 'Para cuando cae el sol', tone: '#4A2E6B' },
  { id: 'Fresca', blurb: 'Limpias, heladas, diurnas', tone: '#3F5A7A' },
];
