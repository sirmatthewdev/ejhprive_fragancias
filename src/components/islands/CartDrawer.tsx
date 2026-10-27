import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { trackBeginCheckout, trackOrder } from '../../lib/track';
import { $cart, $cartExpired, $cartOpen, $count, $subtotal, clearCart, fmtLabel, hydrateCart, money, roomFor, setQty, syncCartStock, type CartLine } from '../../lib/cart';

interface Props { waBase: string }
type Step = 'bag' | 'details' | 'done';
interface Done { number: string | null; message: string }

const DEPARTMENTS = ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'];
const field = 'h-12 w-full rounded-xl border border-cream/16 bg-onyx px-4 text-[15px] text-cream placeholder:text-mist focus:border-lilac focus:outline-none';
const wa = (base: string, text: string) => `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;

function orderMessage(lines: CartLine[], number: string | null, c?: Record<string, string>) {
  return [
    number ? `Hola EJH PRIVÉ, hice el pedido ${number}:` : 'Hola EJH PRIVÉ, quiero hacer este pedido:',
    ...lines.map((l) => `• ${l.qty} × ${l.brand} ${l.name} — ${fmtLabel(l.fmt)}`),
    ...(c ? ['', `Nombre: ${c.name}`, c.delivery === 'envio' ? `Envío a: ${[c.address, c.district, c.province, c.department].filter(Boolean).join(', ')}${c.reference ? ` (Ref.: ${c.reference})` : ''}` : 'Retiro en persona'] : []),
    '',
    '¿Me confirman precio final y envío?',
  ].join('\n');
}

/**
 * Side drawer with a two-step checkout: bag → customer details.
 * The order is registered in the panel (status «Pendiente») and closed over WhatsApp with its number.
 */
export default function CartDrawer({ waBase }: Props) {
  const open = useStore($cartOpen);
  const lines = useStore($cart);
  const count = useStore($count);
  const subtotal = useStore($subtotal);
  const expired = useStore($cartExpired);
  const panel = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>('bag');
  const [delivery, setDelivery] = useState<'envio' | 'retiro'>('envio');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [adjusted, setAdjusted] = useState<string | null>(null);
  const decants = lines.filter((l) => l.fmt !== '100').reduce((n, l) => n + l.qty, 0);
  const setGoal = 3;

  useEffect(hydrateCart, []);
  useEffect(() => {
    if (!open) {
      if (step === 'done') { setStep('bag'); setDone(null); }
      return;
    }
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    syncCartStock().then(setAdjusted);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && $cartOpen.set(false);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [open]);
  useEffect(() => { if (!lines.length && step === 'details') setStep('bag'); }, [lines.length]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const c = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setSending(true); setError(null);
    const msg = await syncCartStock();
    if (msg) { setAdjusted(msg); setSending(false); setStep('bag'); return; }
    try {
      const r = await fetch('/api/orders/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: { ...c, delivery }, items: lines.map((l) => ({ slug: l.slug, fmt: l.fmt, qty: l.qty })) }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error ?? 'No pudimos registrar el pedido.');
      trackOrder(lines, body.number);
      setDone({ number: body.number, message: orderMessage(lines, body.number, { ...c, delivery }) });
      clearCart();
      setStep('done');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  const title = step === 'details' ? 'Tus datos' : step === 'done' ? '¡Pedido registrado!' : 'Tu bolsa';

  return (
    <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={() => $cartOpen.set(false)}
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-graphite text-cream outline-none transition-[transform,visibility,box-shadow] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${open ? 'visible translate-x-0 shadow-[-40px_0_80px_rgb(0_0_0/.5)]' : 'invisible translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-cream/10 px-6 py-5">
          <div className="flex items-center gap-2">
            {step === 'details' && (
              <button type="button" onClick={() => setStep('bag')} aria-label="Volver a la bolsa" className="-ml-2 flex size-9 items-center justify-center rounded-full hover:bg-cream/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              </button>
            )}
            <h2 id="cart-title" className="font-serif text-3xl">{title} {step === 'bag' && <span className="font-sans text-sm text-mist">({count})</span>}</h2>
          </div>
          <button type="button" onClick={() => $cartOpen.set(false)} aria-label="Cerrar bolsa" className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-cream/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {step === 'bag' && (
          <>
            {adjusted && <p role="status" className="border-b border-cream/10 bg-[#E5B97A]/10 px-6 py-3 text-sm text-[#E5B97A]">{adjusted}</p>}
            {lines.length > 0 && (
              <div className="border-b border-cream/10 px-6 py-4 text-sm">
                <p className="text-sand">
                  {decants >= setGoal ? '¡Tu set descubrimiento está completo!' : `Suma ${setGoal - decants} decant${setGoal - decants === 1 ? '' : 's'} más para armar tu set descubrimiento.`}
                </p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-cream/10">
                  <div className="h-full origin-left rounded-full bg-lilac transition-transform duration-700" style={{ transform: `scaleX(${Math.min(1, decants / setGoal)})` }} />
                </div>
              </div>
            )}
            <ul className="flex-1 overflow-y-auto px-6" data-lenis-prevent>
              {lines.length === 0 && (
                <li className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
                  <p className="font-serif text-3xl">Tu bolsa está vacía</p>
                  <p className="max-w-[260px] text-sm text-mist">{expired ? 'Pasaron 15 minutos sin cambios y tu bolsa se vació. Vuelve a agregar lo que quieras.' : 'Empieza con un decant de 3 ml: es la mejor forma de encontrar tu firma.'}</p>
                  <a href="/productos/?formato=decant" onClick={() => $cartOpen.set(false)} className="btn btn-cream mt-2">Ver decants</a>
                </li>
              )}
              {lines.map((l) => (
                <li key={l.slug + l.fmt} className="flex gap-4 border-b border-cream/10 py-5">
                  <a href={l.href} onClick={() => $cartOpen.set(false)} className="shrink-0">
                    <img src={l.img} alt="" width={80} height={100} className="h-[100px] w-20 rounded-xl object-cover" />
                  </a>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-lilac">{l.brand}</span>
                    <a href={l.href} onClick={() => $cartOpen.set(false)} className="truncate font-serif text-xl leading-tight">{l.name}</a>
                    <span className="text-xs text-mist">{fmtLabel(l.fmt)}{roomFor(l.slug, l.fmt, l.stock) === 0 && <span className="text-[#E5B97A]"> · Máximo disponible</span>}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex h-9 items-center rounded-full border border-cream/20">
                        <button type="button" aria-label={`Quitar uno de ${l.name}`} onClick={() => setQty(l.slug, l.fmt, l.qty - 1)} className="size-9">−</button>
                        <span className="min-w-5 text-center text-sm font-semibold" aria-live="polite">{l.qty}</span>
                        <button type="button" aria-label={`Agregar uno de ${l.name}`} onClick={() => setQty(l.slug, l.fmt, l.qty + 1)} disabled={roomFor(l.slug, l.fmt, l.stock) === 0} className="size-9 disabled:cursor-not-allowed disabled:opacity-30">+</button>
                      </div>
                      <span className="text-sm font-semibold">{money(l.price == null ? null : l.price * l.qty)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {lines.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-cream/10 px-6 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-sand">Subtotal</span>
                  <span className="text-xl font-semibold">{money(subtotal)}</span>
                </div>
                <p className="text-xs text-mist">Te confirmamos precio final y envío por WhatsApp antes de pagar.</p>
                <button type="button" onClick={() => { trackBeginCheckout(lines); setStep('details'); }} className="btn btn-cream btn-fill w-full">Continuar</button>
                <button type="button" onClick={() => $cartOpen.set(false)} className="text-sm text-sand underline-offset-4 hover:underline">Seguir comprando</button>
              </div>
            )}
          </>
        )}

        {step === 'details' && (
          <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6" data-lenis-prevent>
              <p className="text-sm text-sand">Registramos tu pedido y lo terminamos de coordinar por WhatsApp.</p>
              <label className="flex flex-col gap-2 text-[13px] font-semibold">Nombre y apellido
                <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={field} />
              </label>
              <label className="flex flex-col gap-2 text-[13px] font-semibold">WhatsApp
                <input name="phone" required type="tel" minLength={6} maxLength={30} autoComplete="tel" placeholder="+51 9…" className={field} />
              </label>
              <label className="flex flex-col gap-2 text-[13px] font-semibold">Correo <span className="font-normal text-mist">(opcional)</span>
                <input name="email" type="email" maxLength={120} autoComplete="email" className={field} />
              </label>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-[13px] font-semibold">Entrega</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['envio', 'retiro'] as const).map((d) => (
                    <button key={d} type="button" aria-pressed={delivery === d} onClick={() => setDelivery(d)}
                      className={`h-12 rounded-xl border text-sm font-semibold transition-colors ${delivery === d ? 'border-cream bg-cream text-plum' : 'border-cream/16 text-sand hover:border-cream/40'}`}>
                      {d === 'envio' ? 'Envío a domicilio' : 'Retiro'}
                    </button>
                  ))}
                </div>
              </fieldset>
              {delivery === 'envio' && (
                <>
                  <label className="flex flex-col gap-2 text-[13px] font-semibold">Departamento
                    <select name="department" required defaultValue="Lima" autoComplete="address-level1" className={field}>
                      {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-2 text-[13px] font-semibold">Provincia<input name="province" required maxLength={60} autoComplete="address-level2" className={field} /></label>
                    <label className="flex flex-col gap-2 text-[13px] font-semibold">Distrito<input name="district" required maxLength={60} autoComplete="address-level3" className={field} /></label>
                  </div>
                  <label className="flex flex-col gap-2 text-[13px] font-semibold">Dirección<input name="address" required maxLength={160} autoComplete="street-address" placeholder="Av., calle, número, dpto." className={field} /></label>
                  <label className="flex flex-col gap-2 text-[13px] font-semibold">Referencia <span className="font-normal text-mist">(opcional)</span><input name="reference" maxLength={160} placeholder="Frente al parque, portón negro…" className={field} /></label>
                </>
              )}
              <label className="flex flex-col gap-2 text-[13px] font-semibold">Comentario <span className="font-normal text-mist">(opcional)</span>
                <textarea name="message" rows={3} maxLength={500} className={`${field} h-auto py-3`} />
              </label>
              {error && <p role="alert" className="rounded-xl border border-[#E58A8A]/40 bg-[#E58A8A]/10 px-4 py-3 text-sm text-[#F3C4C4]">{error}</p>}
            </div>
            <div className="flex flex-col gap-3 border-t border-cream/10 px-6 py-5">
              <button disabled={sending} className="btn btn-cream btn-fill w-full disabled:opacity-60">{sending ? 'Registrando…' : 'Registrar pedido'}</button>
              {error && <a href={wa(waBase, orderMessage(lines, null))} target="_blank" rel="noopener" className="text-center text-sm text-sand underline underline-offset-4">Enviar igual por WhatsApp</a>}
            </div>
          </form>
        )}

        {step === 'done' && done && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-lilac/15 text-lilac">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
            </span>
            {done.number && <p className="font-serif text-4xl" aria-live="polite">{done.number}</p>}
            <p className="max-w-[300px] text-sand">Último paso: envíanos el pedido por WhatsApp para confirmar precio, pago y envío.</p>
            <a href={wa(waBase, done.message)} target="_blank" rel="noopener" className="btn btn-cream btn-fill w-full">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.4 19zM9 8.5c.3 3 3.2 5.9 6.2 6.2" /></svg>
              Enviar por WhatsApp
            </a>
            <button type="button" onClick={() => $cartOpen.set(false)} className="text-sm text-sand underline-offset-4 hover:underline">Seguir mirando</button>
          </div>
        )}
      </div>
    </div>
  );
}
