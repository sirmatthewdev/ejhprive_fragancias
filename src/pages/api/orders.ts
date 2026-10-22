import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { createOrder } from '../../lib/cms';

export const prerender = false;

const Order = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(6).max(30),
    email: z.string().trim().email().max(120).optional().or(z.literal('')),
    delivery: z.enum(['envio', 'retiro']),
    department: z.string().trim().max(40).optional(),
    province: z.string().trim().max(60).optional(),
    district: z.string().trim().max(60).optional(),
    address: z.string().trim().max(160).optional(),
    reference: z.string().trim().max(160).optional(),
    message: z.string().trim().max(500).optional(),
  }),
  items: z.array(z.object({ slug: z.string().max(60), fmt: z.enum(['3', '5', '100']), qty: z.number().int().min(1).max(9) })).min(1).max(20),
});

// 10 orders per IP per hour is plenty for real customers
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now(), recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  hits.set(ip, [...recent, now]);
  return recent.length >= 10;
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Registers the bag as a pending order in the CMS and returns its number for the WhatsApp message. */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (limited(clientAddress)) return json({ error: 'Demasiados pedidos seguidos. Escríbenos por WhatsApp.' }, 429);
  const parsed = Order.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Revisa los datos del formulario.' }, 400);
  const c = parsed.data.customer;
  if (c.delivery === 'envio' && !(c.department && c.province && c.district && c.address)) return json({ error: 'Completa la dirección de envío.' }, 400);
  try {
    const { number } = await createOrder({ ...parsed.data, customer: { ...parsed.data.customer, email: parsed.data.customer.email || undefined } });
    return json({ number });
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[orders]', msg);
    if (msg.startsWith('Sin stock')) return json({ error: 'No hay stock suficiente para alguno de los productos de tu bolsa. Ajusta las cantidades y vuelve a intentarlo.' }, 409);
    return json({ error: 'No pudimos registrar el pedido.' }, 502);
  }
};
