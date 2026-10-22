import type { FormatId } from './inventory'

export interface Prices {
  p3?: number | null; p5?: number | null; p100?: number | null
  s3?: number | null; s5?: number | null; s100?: number | null
  saleEndsAt?: string | null
}

/** Regular price, plus the sale price when it is lower than the regular one and still running. */
export function priceFor(prices: Prices | null | undefined, fmt: FormatId, now = new Date()) {
  const regular = prices?.[`p${fmt}` as const] ?? null
  const sale = prices?.[`s${fmt}` as const] ?? null
  const running = !prices?.saleEndsAt || new Date(prices.saleEndsAt) > now
  const onSale = sale != null && running && (regular == null || sale < regular)
  return { regular, sale: onSale ? sale : null, price: onSale ? sale : regular }
}
