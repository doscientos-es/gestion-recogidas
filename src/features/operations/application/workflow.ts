import type { Driver, OperationsState, PickupOrder } from './types'

function activity(title: string, detail: string, tone: 'info' | 'success' | 'warning') {
  return { id: crypto.randomUUID(), title, detail, at: 'Ahora', tone }
}

export function assignOrder(
  state: OperationsState,
  orderId: string,
  driverId: string,
): OperationsState {
  const order = state.orders.find((item) => item.id === orderId)
  const driver = state.drivers.find((item) => item.id === driverId)
  if (!order || !['pending_assignment', 'assigned'].includes(order.status) || !driver) return state
  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId
        ? {
            ...item,
            driverId,
            status: 'assigned',
            calendarState: 'sent',
            emailState: 'prepared',
          }
        : item,
    ),
    activity: [
      activity('Conductor asignado', `${order.reference} · ${driver.name}`, 'success'),
      ...state.activity,
    ],
  }
}

export function addDriver(state: OperationsState, driver: Driver): OperationsState {
  return { ...state, drivers: [...state.drivers, driver] }
}

export function updateDriver(
  state: OperationsState,
  driverId: string,
  patch: Partial<Driver>,
): OperationsState {
  return {
    ...state,
    drivers: state.drivers.map((driver) =>
      driver.id === driverId ? { ...driver, ...patch } : driver,
    ),
  }
}

export function removeDriver(state: OperationsState, driverId: string): OperationsState {
  return {
    ...state,
    drivers: state.drivers.filter((driver) => driver.id !== driverId),
    orders: state.orders.map((order) => {
      if (order.driverId !== driverId) return order
      const { driverId: _removed, ...rest } = order
      return rest
    }),
  }
}

export function markEmailSent(state: OperationsState, orderId: string): OperationsState {
  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId ? { ...item, emailState: 'sent' } : item,
    ),
  }
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function formatScheduledAt(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function buildWhatsAppUrl(order: PickupOrder, driver: Driver): string {
  const passengers = order.passengerCount === 1 ? '1 pasajero' : `${order.passengerCount} pasajeros`
  const route = order.journeys
    .map((journey, index) => {
      const instructions = [
        journey.originInstructions && `origen: ${journey.originInstructions}`,
        journey.pickupInstructions && `recogida: ${journey.pickupInstructions}`,
        journey.destinationInstructions && `destino: ${journey.destinationInstructions}`,
        journey.expectedWait && `espera prevista: ${journey.expectedWait}`,
      ]
        .filter(Boolean)
        .join('; ')
      return `Trayecto ${index + 1}: ${journey.origin} → ${journey.destination}${instructions ? ` (${instructions})` : ''}`
    })
    .join('\n')
  const notes = [
    order.language && `Idioma: ${order.language}.`,
    order.driverObservations && `Observaciones: ${order.driverObservations}.`,
    order.waitHours && `Horas de espera: ${order.waitHours}.`,
  ]
    .filter(Boolean)
    .join(' ')
  const message = `Hola ${driver.name.split(' ')[0]}, tienes un ${order.serviceType.toLocaleLowerCase('es')} el ${formatScheduledAt(order.scheduledAt)}. ${passengers}; equipaje: ${order.luggage}. Referencia ${order.reference}.\n${route}\n${notes}`
  return `https://wa.me/${driver.phone}?text=${encodeURIComponent(message)}`
}

export function buildCalendarHref(order: PickupOrder, driver?: Driver): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildCalendarContent(order, driver))}`
}

export function buildCalendarContent(order: PickupOrder, driver?: Driver): string {
  const start = new Date(order.scheduledAt)
  const end = new Date(start.getTime() + 90 * 60 * 1000)
  const date = (value: Date) =>
    value.toISOString().replaceAll('-', '').replaceAll(':', '').replace('.000', '')
  const escapeText = (value: string) =>
    value.replaceAll('\\', '\\\\').replaceAll(',', '\\,').replaceAll(';', '\\;')
  const passengers = order.passengerCount === 1 ? '1 pasajero' : `${order.passengerCount} pasajeros`
  const description = escapeText(
    `${order.serviceType} · ${passengers} · Equipaje: ${order.luggage} · ${driver?.name ?? 'Conductor pendiente'}`,
  )
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gestion Recogidas//ES',
    'BEGIN:VEVENT',
    `UID:${order.id}@gestion-recogidas`,
    `DTSTART:${date(start)}`,
    `DTEND:${date(end)}`,
    `SUMMARY:${escapeText(`Traslado ${order.reference}`)}`,
    `LOCATION:${escapeText(`${order.pickupAddress}, ${order.pickupCity}`)}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
