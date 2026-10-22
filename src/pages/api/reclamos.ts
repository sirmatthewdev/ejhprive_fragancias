import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { createComplaint } from '../../lib/cms';

export const prerender = false;

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const Complaint = z.object({
  consumer: z.object({
    name: text(3, 120), docType: z.enum(['DNI', 'CE', 'Pasaporte', 'RUC']), docNumber: text(6, 15),
    phone: text(6, 30), email: z.string().trim().email().max(120), address: text(5, 200), guardian: z.string().trim().max(120).optional(),
  }),
  item: z.object({ type: z.enum(['producto', 'servicio']), amount: z.number().min(0).max(100000).optional(), order: z.string().trim().max(20).optional(), description: text(3, 1000) }),
  kind: z.enum(['reclamo', 'queja']),
  detail: text(10, 3000),
  request: text(5, 2000),
  accept: z.literal(true),
});

const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now(), recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  hits.set(ip, [...recent, now]);
  return recent.length >= 5;
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Stores a Libro de Reclamaciones sheet in the CMS and returns its number. */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (limited(clientAddress)) return json({ error: 'Demasiados envíos seguidos. Inténtalo más tarde.' }, 429);
  const parsed = Complaint.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Revisa los campos obligatorios.', fields: parsed.error.issues.map((i) => i.path.join('.')) }, 400);
  const { accept: _, ...data } = parsed.data;
  try {
    return json(await createComplaint(data));
  } catch (e) {
    console.error('[reclamos]', (e as Error).message);
    return json({ error: 'No pudimos registrar tu reclamo. Inténtalo de nuevo o escríbenos.' }, 502);
  }
};
