import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { $cart, addToCart, discount, fetchStock, fmtLabel, hydrateCart, money } from '../../lib/cart';
import { ML, remaining, type Stock } from '../../lib/stock';
import type { FormatId } from '../../data/products';

interface Props {
  slug: string; name: string; brand: string; href: string;
  images: { frasco: string; decant: string };
  prices: Record<FormatId, { price: number | null; regular: number | null; onSale: boolean }>;
  available: Record<FormatId, boolean>;
  /** null = unknown (CMS unreachable): not capped here, the order endpoint validates */
  stock: Stock | null;
  formats: { id: FormatId; size: string; kind: string; detail: string }[];
  waBase: string;
}

/** Format selector + quantity + add to bag. Emits `ejh:format` so the gallery can follow the choice. */
export default function ProductBuy({ slug, name, brand, href, images, prices, available: initialAvailable, stock: initialStock, formats, waBase }: Props) {
  const [stock, setStock] = useState<Stock | null>(initialStock);
  const availableOf = (st: Stock | null): Record<FormatId, boolean> =>
    st ? { '3': st.decantMl >= ML['3'], '5': st.decantMl >= ML['5'], '100': st.sealed > 0 } : initialAvailable;
  const available = availableOf(stock);
  const firstAvailable = (['5', '3', '100'] as FormatId[]).find((f) => available[f]) ?? '5';
  const [fmt, setFmt] = useState<FormatId>(firstAvailable);
  const inStock = available[fmt];
  const off = discount(prices[fmt].regular, prices[fmt].price);
  const soldOut = !available['3'] && !available['5'] && !available['100'];
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // what is already in the bag for this fragrance counts against the stock (read after mount so hydration matches)
  const cart = useStore($cart);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    hydrateCart(); setMounted(true);
    fetchStock([slug]).then((r) => { const st = r?.[slug]?.stock; if (st) setStock(st); });
  }, []);
  // if the chosen format ran out after a refresh, move to one that is still available
  useEffect(() => {
    if (!available[fmt]) { const alt = (['5', '3', '100'] as FormatId[]).find((f) => available[f]); if (alt) setFmt(alt); }
  }, [stock]);
  const inBag = mounted ? cart.filter((l) => l.slug === slug).map((l) => ({ fmt: l.fmt, qty: l.qty })) : [];
  const room = remaining(stock, inBag, fmt);
  const inBagThis = inBag.find((l) => l.fmt === fmt)?.qty ?? 0;
  useEffect(() => { setQty((q) => Math.max(1, Math.min(q, room || 1))); }, [room]);
  useEffect(() => { setQty(1); setNotice(null); }, [fmt]); // a new format starts from one unit

  useEffect(() => {
    const q = new URL(location.href).searchParams.get('formato');
    if ((q === '3' || q === '5' || q === '100') && available[q]) setFmt(q);
    const pick = (e: Event) => { const f = (e as CustomEvent<FormatId>).detail; if (available[f]) setFmt(f); };
    document.addEventListener('ejh:pick-format', pick);
    return () => document.removeEventListener('ejh:pick-format', pick);
  }, []);
  useEffect(() => {
    document.dispatchEvent(new CustomEvent('ejh:format', { detail: fmt }));
    const bar = document.querySelector('[data-sticky-label]');
    if (bar) bar.textContent = `${name} · ${fmtLabel(fmt)}`;
  }, [fmt]);

  const [checking, setChecking] = useState(false);
  const add = async () => {
    if (!inStock || room <= 0 || checking) return;
    // re-check stock at the moment of adding: it may have changed while the page was open
    setChecking(true);
    const fresh = (await fetchStock([slug]))?.[slug]?.stock ?? stock;
    setChecking(false);
    if (fresh) setStock(fresh);
    const n = addToCart({ slug, name, brand, fmt, price: prices[fmt].price, img: images.frasco, href, stock: fresh }, qty);
    if (n === 0) { setNotice('Ya no queda stock para este formato.'); return; }
    setNotice(n < qty ? `Solo pudimos agregar ${n}: es todo el stock disponible.` : null);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  const wa = `${waBase}${waBase.includes('?') ? '&' : '?'}text=${encodeURIComponent(`Hola EJH PRIVÉ, quiero ${qty} × ${brand} ${name} (${fmtLabel(fmt)}).`)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-cream/10 py-5">
        <span className={`text-[1.75rem] font-semibold ${off ? 'text-lilac' : ''}`}>{money(prices[fmt].price)}</span>
        {off && (
          <>
            <s className="text-base text-mist" aria-label={`Precio regular ${money(prices[fmt].regular)}`}>{money(prices[fmt].regular)}</s>
            <span className="chip h-6 bg-lilac px-2 text-[11px] text-plum">{off}</span>
          </>
        )}
        <span className="text-[13px] text-mist">{fmt === '100' ? 'Paga con Yape, Plin, tarjeta o en cuotas' : 'Fraccionado del frasco original'}</span>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[13px] font-semibold">Formato · <span className="text-lilac">{fmtLabel(fmt)}</span></legend>
        <div className="grid grid-cols-3 gap-2.5">
          {formats.map((f) => {
            const on = f.id === fmt;
            const out = !available[f.id];
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                disabled={out}
                onClick={() => setFmt(f.id)}
                className={`group relative flex flex-col items-start gap-1 overflow-hidden rounded-2xl border p-3.5 text-left transition-[background-color,color,border-color,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)] disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5 ${on ? 'border-cream bg-cream text-plum' : 'border-cream/14 bg-graphite text-cream enabled:hover:border-cream/40'}`}
              >
                <span className="font-serif text-[1.7rem] leading-none">{f.size}</span>
                <span className="text-xs opacity-80">{f.kind}</span>
                <span className="text-[11px] opacity-65">{out ? 'Agotado' : f.detail}</span>
                {!out && discount(prices[f.id].regular, prices[f.id].price) && (
                  <span className="absolute right-2 top-2 rounded-full bg-lilac px-1.5 py-0.5 text-[10px] font-bold text-plum">{discount(prices[f.id].regular, prices[f.id].price)}</span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {inStock && room === 0 ? (
        <p className="flex items-center gap-2.5 text-sm text-sand">
          <span className="size-2 rounded-full bg-[#E5B97A]" />
          {inBagThis ? `Ya tienes en tu bolsa todo el stock disponible de este formato (${inBagThis}).` : 'No queda stock suficiente para este formato; prueba con otro.'}
        </p>
      ) : inStock ? (
        <p className="flex items-center gap-2.5 text-sm text-sand">
          <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-[#9ED9A6] opacity-60" /><span className="size-2 rounded-full bg-[#9ED9A6]" /></span>
          {stock && room <= 3 ? `${room === 1 ? 'Última unidad' : `Últimas ${room} unidades`} · se despacha en 24–48 h` : 'En stock · se despacha en 24–48 h'}
        </p>
      ) : (
        <p className="flex items-center gap-2.5 text-sm text-sand">
          <span className="size-2 rounded-full bg-[#E5B97A]" />
          {soldOut ? 'Agotado por ahora. Escríbenos y te avisamos cuando vuelva.' : 'Este formato está agotado; elige otro.'}
        </p>
      )}

      <div className="flex flex-wrap gap-2.5">
        <div className="inline-flex h-[54px] items-center rounded-full border border-cream/20">
          <button type="button" aria-label="Quitar uno" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="h-full w-12 text-xl disabled:cursor-not-allowed disabled:opacity-30">−</button>
          <span className="min-w-6 text-center font-semibold" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Agregar uno" onClick={() => setQty((q) => Math.min(Math.max(room, 1), q + 1))} disabled={qty >= room} className="h-full w-12 text-xl disabled:cursor-not-allowed disabled:opacity-30">+</button>
        </div>
        <button type="button" onClick={add} disabled={!inStock || room <= 0 || checking} data-add-to-cart className="btn btn-cream btn-fill h-[54px] flex-1 basis-52 text-[15px] disabled:cursor-not-allowed disabled:opacity-50">
          <span className="relative block h-5 overflow-hidden">
            <span className={`block transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${added ? '-translate-y-full' : ''}`}>Agregar a la bolsa</span>
            <span className={`absolute inset-0 block transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${added ? '' : 'translate-y-full'}`}>Agregado ✓</span>
          </span>
        </button>
      </div>
      {notice && <p role="status" className="-mt-2 text-sm text-[#E5B97A]">{notice}</p>}
      <a href={wa} target="_blank" rel="noopener" className="btn btn-ghost h-[52px] border-lilac/50">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.4 19zM9 8.5c.3 3 3.2 5.9 6.2 6.2" /></svg>
        Comprar por WhatsApp
      </a>
    </div>
  );
}
