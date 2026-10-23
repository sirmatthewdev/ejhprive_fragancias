/**
 * Commerce events for GTM / GA4 / Meta Pixel / TikTok Pixel. No-op until the visitor accepts cookies
 * and the tools are loaded (see components/Tracking.astro).
 */
type Item = { slug: string; name: string; brand: string; fmt: string; qty: number; price: number | null };

let enabled = false;
export const setTrackers = (on: boolean) => { enabled = on; };

const w = () => (typeof window === 'undefined' ? {} : (window as any));
const value = (items: Item[]) => items.reduce((n, i) => n + (i.price ?? 0) * i.qty, 0);
const ga4Items = (items: Item[]) => items.map((i) => ({ item_id: `${i.slug}-${i.fmt}`, item_name: i.name, item_brand: i.brand, item_variant: `${i.fmt} ml`, price: i.price ?? undefined, quantity: i.qty }));

function send(ga: string, meta: string, tiktok: string, items: Item[], extra: Record<string, unknown> = {}) {
  if (!enabled) return;
  const x = w();
  const v = value(items);
  const params = { currency: 'PEN', value: v, items: ga4Items(items), ...extra };
  x.dataLayer?.push({ event: ga, ecommerce: params });
  x.gtag?.('event', ga, params);
  x.fbq?.('track', meta, { currency: 'PEN', value: v, content_ids: items.map((i) => `${i.slug}-${i.fmt}`), content_type: 'product', num_items: items.reduce((n, i) => n + i.qty, 0) });
  x.ttq?.track?.(tiktok, { currency: 'PEN', value: v, contents: items.map((i) => ({ content_id: `${i.slug}-${i.fmt}`, content_name: i.name, quantity: i.qty, price: i.price ?? 0 })) });
}

export const trackViewItem = (i: Item) => send('view_item', 'ViewContent', 'ViewContent', [i]);
export const trackAddToCart = (i: Item) => send('add_to_cart', 'AddToCart', 'AddToCart', [i]);
export const trackBeginCheckout = (items: Item[]) => send('begin_checkout', 'InitiateCheckout', 'InitiateCheckout', items);
export const trackOrder = (items: Item[], orderNumber: string | null) => send('generate_lead', 'Lead', 'SubmitForm', items, { transaction_id: orderNumber ?? undefined });
export function trackContact(channel: string) {
  if (!enabled) return;
  const x = w();
  x.dataLayer?.push({ event: 'contact', channel });
  x.gtag?.('event', 'contact', { method: channel });
  x.fbq?.('track', 'Contact');
  x.ttq?.track?.('Contact');
}
