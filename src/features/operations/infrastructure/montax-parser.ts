import type { PickupOrder } from '../application/types'

function value(text: string, label: string): string {
  const match = text.match(new RegExp(`${label}\\s*:?\\s*(.*)`, 'i'))
  return match?.[1]?.trim() ?? ''
}

function clean(text: string) {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ ]{2,}/g, ' ')
}

export function parseMontaxEmail(input: {
  text?: string
  html?: string
  emailId: string
  receivedAt?: string
}): PickupOrder {
  const raw = clean(input.text || (input.html ?? '').replace(/<[^>]+>/g, '\n'))
  const id = value(raw, 'ID SERVICIO') || input.emailId.slice(0, 12)
  const date = value(raw, 'FECHA DEL SERVICIO')
  const time = value(raw, 'HORA DEL SERVICIO')
  const origin = value(raw, 'ORIGEN')
  const destination = value(raw, 'DESTINO')
  const scheduledAt = new Date(`${date} ${time}`).toISOString()
  return {
    id: `montax-${input.emailId}`,
    reference: `MONTAX-${id}`,
    customer: value(raw, 'NOMBRE Y APELLIDOS') || 'Cliente pendiente',
    pickupAddress: origin || 'Origen pendiente',
    pickupCity: '',
    deliveryAddress: destination || 'Destino pendiente',
    deliveryCity: '',
    scheduledAt: Number.isNaN(new Date(`${date} ${time}`).getTime())
      ? new Date().toISOString()
      : scheduledAt,
    cargo: `${value(raw, 'TIPO SERVICIO') || 'Servicio'} · ${value(raw, 'Nº PAX')} pasajeros`,
    weightKg: 0,
    amountCents: 0,
    source: 'email',
    status: 'pending_assignment',
    calendarState: 'pending',
    emailState: 'pending',
    receivedAt: input.receivedAt ?? new Date().toISOString(),
  }
}
