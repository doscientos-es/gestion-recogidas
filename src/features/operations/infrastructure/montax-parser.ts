import type { JourneyLeg, PickupOrder } from '../application/types'

function value(text: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp(`(?:^|\\n)${escapedLabel}[ \\t]*:[ \\t]*(.*)`, 'i'))
  const inlineValue = match?.[1]?.trim()
  if (inlineValue) return inlineValue
  const nextLine = text.match(
    new RegExp(`(?:^|\\n)${escapedLabel}[ \\t]*:[ \\t]*\\n+[ \\t]*([^\\n]+)`, 'i'),
  )
  return nextLine?.[1]?.trim() ?? ''
}

function clean(text: string) {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[○•][ \t]*/g, '\n')
    .replace(/\*([^*]+)\*/g, '\n$1\n')
    .replace(/\s+(TRAYECTOS)\s*:/gi, '\n$1:')
    .replace(
      /\s+(LUGAR\s+DE\s+(?:ORIGEN|DESTINO)\/INSTRUCCIONES|TIEMPO\s+ESPERA\s+PREVISTO)\s*:/gi,
      '\n$1:',
    )
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/[ ]{2,}/g, ' ')
}

function section(text: string, heading: string, nextHeadings: string[]): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const next = nextHeadings.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const match = text.match(
    new RegExp(
      `(?:^|\\n)${escapedHeading}[ \\t]*:?[ \\t]*\\n?([\\s\\S]*?)(?=\\n(?:${next})[ \\t]*:|$)`,
      'i',
    ),
  )
  return match?.[1]?.replace(/\n+/g, ' ').trim() ?? ''
}

function extractTrayectos(text: string): JourneyLeg[] {
  const trayectos: JourneyLeg[] = []
  // Dividir el texto en bloques por "TRAYECTO N:"
  const bloques = text.split(/TRAYECTO\s+\d+\s*:/i)

  // El primer bloque (antes del primer TRAYECTO) no contiene datos de trayecto
  for (let i = 1; i < bloques.length; i++) {
    const bloque = bloques[i]
    if (!bloque) continue
    const origenMatch = bloque.match(
      /ORIGEN\s*:?\s*(.+?)(?=LUGAR|DESTINO|TRAYECTO|EXTRAS|PREFERENCIAS|PRECIO|$)/is,
    )
    const destinoMatch = bloque.match(
      /DESTINO\s*:?\s*(.+?)(?=LUGAR|TRAYECTO|EXTRAS|PREFERENCIAS|PRECIO|$)/is,
    )
    const recogidaMatch = bloque.match(
      /LUGAR\s+DE\s+RECOGIDA\s*:?\s*(.+?)(?=TRAYECTO|EXTRAS|PREFERENCIAS|PRECIO|$)/is,
    )
    const origenInstructions = value(bloque, 'LUGAR DE ORIGEN/INSTRUCCIONES')
    const destinationInstructions = value(bloque, 'LUGAR DE DESTINO/INSTRUCCIONES')
    const expectedWait = value(bloque, 'TIEMPO ESPERA PREVISTO')

    const origen = origenMatch?.[1]?.trim() ?? ''
    const destinoRaw = destinoMatch?.[1]?.trim() ?? ''
    const pickupInstructions = recogidaMatch?.[1]?.trim()
    // Limpiar el destino de cualquier texto adicional de "LUGAR DE ENTREGA"
    const destino = destinoRaw.split(/LUGAR[^:]*:/i)[0]?.trim() ?? destinoRaw

    if (origen && destino) {
      trayectos.push({
        origin: origen,
        destination: destino,
        ...(pickupInstructions ? { pickupInstructions } : {}),
        ...(origenInstructions ? { originInstructions: origenInstructions } : {}),
        ...(destinationInstructions ? { destinationInstructions } : {}),
        ...(expectedWait ? { expectedWait } : {}),
      })
    }
  }

  return trayectos
}

function extractAmount(text: string, label: string): number | undefined {
  const rawImporte = value(text, label).match(/^[\d.,]+/)?.[0]
  if (!rawImporte) return undefined
  const importe = rawImporte.replace(/\./g, '').replace(',', '.')
  const euros = parseFloat(importe)
  return Number.isNaN(euros) ? undefined : Math.round(euros * 100)
}

function extractTelefono(text: string): string {
  const match = text.match(/TEL[EÉ]FONO\s*:?\s*(\d[\d\s]*)/i)
  return match?.[1]?.replace(/\s/g, '') ?? ''
}

function firstValue(text: string, labels: string[]): string {
  for (const label of labels) {
    const found = value(text, label)
    if (found) return found
  }
  return ''
}

function extractCount(text: string, labels: string[]): number | undefined {
  const found = firstValue(text, labels)
  const count = Number.parseInt(found, 10)
  return Number.isFinite(count) && count > 0 ? count : undefined
}

const madridOffsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Madrid',
  timeZoneName: 'longOffset',
})

/** Montax facilita la hora local peninsular sin indicar la zona en el email. */
function madridDateTime(date: string, time: string): string | undefined {
  const dateParts = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const timeParts = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!dateParts || !timeParts) return undefined
  const [, day, month, year] = dateParts
  const [, hour, minute] = timeParts
  const dayNumber = Number(day)
  const monthNumber = Number(month)
  const yearNumber = Number(year)
  const hourNumber = Number(hour)
  const minuteNumber = Number(minute)
  const values = [dayNumber, monthNumber, yearNumber, hourNumber, minuteNumber]
  if (values.some((value) => !Number.isInteger(value))) return undefined
  const intendedUtc = new Date(
    Date.UTC(yearNumber, monthNumber - 1, dayNumber, hourNumber, minuteNumber),
  )
  if (
    intendedUtc.getUTCFullYear() !== yearNumber ||
    intendedUtc.getUTCMonth() !== monthNumber - 1 ||
    intendedUtc.getUTCDate() !== dayNumber ||
    intendedUtc.getUTCHours() !== hourNumber ||
    intendedUtc.getUTCMinutes() !== minuteNumber
  )
    return undefined
  const offset = madridOffsetFormatter
    .formatToParts(intendedUtc)
    .find((part) => part.type === 'timeZoneName')
    ?.value.match(/^GMT([+-])(\d{2}):(\d{2})$/)
  if (!offset) return undefined
  const offsetMinutes = (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === '+' ? 1 : -1)
  return new Date(intendedUtc.getTime() - offsetMinutes * 60_000).toISOString()
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

  const origin = primerTrayecto?.origin || value(raw, 'ORIGEN') || 'Origen pendiente'
  const destination = primerTrayecto?.destination || value(raw, 'DESTINO') || 'Destino pendiente'

  const tipoServicio = value(raw, 'TIPO SERVICIO') || 'Servicio'
  const passengerCount = extractCount(raw, ['Nº PAX', 'NUMERO DE PASAJEROS']) ?? 0
  const telefono = extractTelefono(raw)
  const passengerEmail = value(raw, 'EMAIL')
  const luggage = firstValue(raw, [
    'EQUIPAJE',
    'Nº MALETAS',
    'NUMERO DE MALETAS',
    'MALETAS',
    'MALETERO',
  ])
  const preferences = value(raw, 'PREFERENCIAS')
  const language = value(raw, 'IDIOMA')
  const childSeatCount = extractCount(raw, ['ASIENTO INFANTIL', 'SILLAS INFANTILES'])
  const driverObservations = section(raw, 'OBSERVACIONES PARA EL CONDUCTOR', [
    'DATOS DE LA RESERVA',
  ])
  const waitingConditions = section(raw, 'REFERENTE A LAS HORAS DE ESPERA', [])

  let scheduledAt = new Date().toISOString()
  const parsedScheduledAt = madridDateTime(date, time)
  if (parsedScheduledAt) scheduledAt = parsedScheduledAt

  const amountCents = extractAmount(raw, 'IMPORTE TOTAL DEL SERVICIO') ?? 0
  const waitHours = value(raw, 'HORAS DE ESPERA')
  const waitRateCents = extractAmount(raw, 'PRECIO HORAS ESPERA (EUR/HORA)')
  const waitAmountCents = extractAmount(raw, 'IMPORTE HORAS ESPERA')
  const journeyAmountCents = extractAmount(raw, 'IMPORTE TRAYECTO/S')
  const extrasAmountCents = extractAmount(raw, 'IMPORTE EXTRAS')

  return {
    id: `montax-${input.emailId}`,
    reference: `MONTAX-${id}`,
    customer: value(raw, 'NOMBRE Y APELLIDOS') || 'Cliente pendiente',
    pickupAddress: origin,
    pickupCity: '',
    deliveryAddress: destination,
    deliveryCity: '',
    scheduledAt,
    serviceType: tipoServicio,
    passengerCount,
    luggage: luggage || 'No indicado',
    ...(telefono ? { passengerPhone: telefono } : {}),
    ...(passengerEmail ? { passengerEmail } : {}),
    ...(preferences ? { preferences } : {}),
    ...(language ? { language } : {}),
    ...(childSeatCount ? { childSeatCount } : {}),
    ...(driverObservations ? { driverObservations } : {}),
    ...(waitHours ? { waitHours } : {}),
    ...(waitRateCents !== undefined ? { waitRateCents } : {}),
    ...(waitAmountCents !== undefined ? { waitAmountCents } : {}),
    ...(journeyAmountCents !== undefined ? { journeyAmountCents } : {}),
    ...(extrasAmountCents !== undefined ? { extrasAmountCents } : {}),
    ...(waitingConditions ? { waitingConditions } : {}),
    journeys: trayectos.length ? trayectos : [{ origin, destination }],
    amountCents,
    source: 'email',
    status: 'pending_assignment',
    calendarState: 'pending',
    emailState: 'pending',
    receivedAt: input.receivedAt ?? new Date().toISOString(),
  }
}
