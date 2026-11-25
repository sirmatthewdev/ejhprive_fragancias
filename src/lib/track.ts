/**
 * Commerce events for GTM / GA4 / Meta Pixel / TikTok Pixel. Nothing is sent until the visitor accepts cookies
 * and the tools are loaded (see components/Tracking.astro). There is no `purchase`: the shop doesn't take payments,
 * an order is confirmed later in the panel; what happens here is `generate_lead` (order registered).
 */
type Item = { slug: string; name: string; brand: string; fmt: string; qty: number; price: number | null };

let enabled = false;
// what this page showed before the visitor answered the cookie notice: kept in memory, sent only if they accept
let pending: (() => void)[] = [];
export const setTrackers = (on: boolean) => { enabled = on; if (on) { pending.forEach((f) => f()); pending = []; } };
export const forgetPending = () => { pending = []; };

const w = () => (typeof window === 'undefined' ? {} : (window as any));
const value = (items: Item[]) => items.reduce((n, i) => n + (i.price ?? 0) * i.qty, 0);
const ga4Items = (items: Item[]) => items.map((i) => ({ item_id: `${i.slug}-${i.fmt}`, item_name: i.name, item_brand: i.brand, item_variant: `${i.fmt} ml`, price: i.price ?? undefined, quantity: i.qty }));

function send(ga: string, meta: string | null, tiktok: string | null, items: Item[], extra: Record<string, unknown> = {}) {
  if (!enabled) return;
  const x = w();
  const v = value(items);
  const params = { currency: 'PEN', value: v, items: ga4Items(items), ...extra };
  toGoogle(ga, params);
  if (!meta || !tiktok) return;
  x.fbq?.('track', meta, { currency: 'PEN', value: v, content_ids: items.map((i) => `${i.slug}-${i.fmt}`), content_type: 'product', num_items: items.reduce((n, i) => n + i.qty, 0) });
  x.ttq?.track?.(tiktok, { currency: 'PEN', value: v, contents: items.map((i) => ({ content_id: `${i.slug}-${i.fmt}`, content_name: i.name, quantity: i.qty, price: i.price ?? 0 })) });
}

/**
 * GA4 events as gtag commands. They also reach the GA4 destination inside the GTM container, which has no tags that
 * would forward plain dataLayer events; adding such tags in GTM would count these events twice.
 */
const toGoogle = (event: string, params: Record<string, unknown>) => void w().gtag?.('event', event, params);

const onceAllowed = (f: () => void) => { enabled ? f() : pending.length < 10 && pending.push(f); };

export const trackViewItem = (i: Item) => onceAllowed(() => send('view_item', 'ViewContent', 'ViewContent', [i]));
/** A list of products on screen (catalogue, category, home) and the one opened from it. */
export const trackViewList = (list: string, items: Item[]) => onceAllowed(() => {
  if (!enabled) return;
  toGoogle('view_item_list', { item_list_name: list, items: ga4Items(items).map((i, index) => ({ ...i, index, item_list_name: list })) });
});
export function trackSelectItem(list: string, item: Item, index: number) {
  if (!enabled) return;
  toGoogle('select_item', { item_list_name: list, items: ga4Items([item]).map((i) => ({ ...i, index, item_list_name: list })) });
}
export const trackRemoveFromCart = (i: Item) => send('remove_from_cart', null, null, [i]);
export const trackAddToCart = (i: Item) => send('add_to_cart', 'AddToCart', 'AddToCart', [i]);
export const trackBeginCheckout = (items: Item[]) => send('begin_checkout', 'InitiateCheckout', 'InitiateCheckout', items);
export const trackOrder = (items: Item[], orderNumber: string | null) => send('generate_lead', 'Lead', 'SubmitForm', items, { transaction_id: orderNumber ?? undefined });
export function trackContact(channel: string) {
  if (!enabled) return;
  const x = w();
  toGoogle('contact', { method: channel });
  x.fbq?.('track', 'Contact');
  x.ttq?.track?.('Contact');
}
