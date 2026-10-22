'use client'
import { useFormFields } from '@payloadcms/ui'

const MESSAGES: Record<string, (n: string, t: { carrier?: string; code?: string; url?: string }) => string> = {
  pendiente: (n) => `Hola, recibimos tu pedido ${n} en EJH PRIVÉ. Te confirmamos el precio final y el envío por aquí.`,
  confirmado: (n) => `¡Gracias! Tu pedido ${n} está confirmado. Ya lo estamos preparando.`,
  preparando: (n) => `Tu pedido ${n} está en preparación. Te avisamos apenas salga.`,
  enviado: (n, t) => `Tu pedido ${n} ya fue enviado${t.carrier ? ` por ${t.carrier}` : ''}.${t.code ? ` Código de seguimiento: ${t.code}.` : ''}${t.url ? ` Síguelo aquí: ${t.url}` : ''}`,
  entregado: (n) => `Tu pedido ${n} figura como entregado. ¡Que lo disfrutes! Si necesitas algo, escríbenos.`,
  cancelado: (n) => `Tu pedido ${n} quedó cancelado. Si fue un error, responde este mensaje y lo retomamos.`,
}

/** Opens WhatsApp with the customer's number and a message that matches the order status. */
export const NotifyCustomer = () => {
  const f = useFormFields(([fields]) => ({
    phone: fields['customer.phone']?.value as string | undefined,
    number: fields.number?.value as string | undefined,
    status: fields.status?.value as string | undefined,
    carrier: fields['shipment.carrier']?.value as string | undefined,
    code: fields['shipment.trackingCode']?.value as string | undefined,
    url: fields['shipment.trackingUrl']?.value as string | undefined,
  }))
  const digits = (f.phone ?? '').replace(/\D/g, '')
  if (!digits || !f.number) return null
  const text = (MESSAGES[f.status ?? 'pendiente'] ?? MESSAGES.pendiente)(f.number, f)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 1.5rem', flexWrap: 'wrap' }}>
      <a
        href={`https://wa.me/${digits}?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, background: '#F1E8D8', color: '#1A1320', fontWeight: 600, textDecoration: 'none' }}
      >
        Avisar al cliente por WhatsApp
      </a>
      <span style={{ fontSize: 13, opacity: 0.7, maxWidth: 560 }}>«{text}»</span>
    </div>
  )
}
