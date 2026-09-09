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

interface Trayecto {
  origen: string
  destino: string
}

function extractTrayectos(text: string): Trayecto[] {
  const trayectos: Trayecto[] = []
  // Dividir el texto en bloques por "TRAYECTO N:"
  const bloques = text.split(/TRAYECTO\s+\d+\s*:/i)

  // El primer bloque (antes del primer TRAYECTO) no contiene datos de trayecto
  for (let i = 1; i < bloques.length; i++) {
    const bloque = bloques[i]
    if (!bloque) continue
    const origenMatch = bloque.match(/ORIGEN\s*:?\s*(.+?)(?=LUGAR|DESTINO|TRAYECTO|EXTRAS|PREFERENCIAS|PRECIO|$)/is)
    const destinoMatch = bloque.match(/DESTINO\s*:?\s*(.+?)(?=LUGAR|TRAYECTO|EXTRAS|PREFERENCIAS|PRECIO|$)/is)

    const origen = origenMatch?.[1]?.trim() ?? ''
    const destinoRaw = destinoMatch?.[1]?.trim() ?? ''
    // Limpiar el destino de cualquier texto adicional de "LUGAR DE ENTREGA"
    const destino = destinoRaw.split(/LUGAR[^:]*:/i)[0]?.trim() ?? destinoRaw

    if (origen && destino) {
      trayectos.push({ origen, destino })
    }
  }

  return trayectos
}

function extractImporteTotal(text: string): number {
  const match = text.match(/IMPORTE\s+TOTAL\s+DEL\s+SERVICIO\s*:?\s*([\d.,]+)/i)
  const rawImporte = match?.[1]
  if (!rawImporte) return 0
  const importe = rawImporte.replace(/\./g, '').replace(',', '.')
  const euros = parseFloat(importe)
  return Number.isNaN(euros) ? 0 : Math.round(euros * 100)
}

function extractTelefono(text: string): string {
  const match = text.match(/TEL[EÉ]FONO\s*:?\s*(\d[\d\s]*)/i)
  return match?.[1]?.replace(/\s/g, '') ?? ''
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

  const trayectos = extractTrayectos(raw)
  const primerTrayecto = trayectos[0]

  const origin = primerTrayecto?.origen || value(raw, 'ORIGEN') || 'Origen pendiente'
  const destination = primerTrayecto?.destino || value(raw, 'DESTINO') || 'Destino pendiente'

  const tipoServicio = value(raw, 'TIPO SERVICIO') || 'Servicio'
  const pax = value(raw, 'Nº PAX')
  const numTrayectos = trayectos.length
  const trayectosInfo = numTrayectos > 1 ? ` · ${numTrayectos} trayectos` : ''
  const telefono = extractTelefono(raw)

  let scheduledAt = new Date().toISOString()
  if (date && time) {
    const [day, month, year] = date.split('/')
    if (day && month && year) {
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time.padStart(5, '0')}:00`
      const parsed = new Date(isoDate)
      if (!Number.isNaN(parsed.getTime())) {
        scheduledAt = parsed.toISOString()
      }
    }
  }

  const amountCents = extractImporteTotal(raw)

  return {
    id: `montax-${input.emailId}`,
    reference: `MONTAX-${id}`,
    customer: value(raw, 'NOMBRE Y APELLIDOS') || 'Cliente pendiente',
    pickupAddress: origin,
    pickupCity: '',
    deliveryAddress: destination,
    deliveryCity: '',
    scheduledAt,
    cargo: `${tipoServicio} · ${pax} pax${trayectosInfo}${telefono ? ` · Tel ${telefono}` : ''}`,
    weightKg: 0,
    amountCents,
    source: 'email',
    status: 'pending_assignment',
    calendarState: 'pending',
    emailState: 'pending',
    receivedAt: input.receivedAt ?? new Date().toISOString(),
  }
}
