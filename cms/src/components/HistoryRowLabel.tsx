'use client'
import { useRowLabel } from '@payloadcms/ui'

const LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmado: 'Confirmado', preparando: 'En preparación', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado',
}

export const HistoryRowLabel = () => {
  const { data } = useRowLabel<{ status?: string; at?: string; by?: string }>()
  const when = data?.at ? new Date(data.at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : ''
  return <span>{LABEL[data?.status ?? ''] ?? '—'} · {when}{data?.by ? ` · ${data.by}` : ''}</span>
}
