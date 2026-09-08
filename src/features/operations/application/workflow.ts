import type { Driver, OperationsState, PickupOrder, Vehicle } from './types'

function activity(title: string, detail: string, tone: 'info' | 'success' | 'warning') {
  return { id: crypto.randomUUID(), title, detail, at: 'Ahora', tone }
}

export function processInboundOrder(state: OperationsState, orderId: string): OperationsState {
  const order = state.orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'received') return state
  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId
        ? { ...item, status: 'pending_assignment', calendarState: 'prepared' }
        : item,
    ),
    activity: [
      activity(
        'Orden creada automáticamente',
        `${order.reference} · añadida al calendario`,
        'success',
      ),
      ...state.activity,
    ],
  }
}

export function assignOrder(
  state: OperationsState,
  orderId: string,
  driverId: string,
  vehicleId = '',
): OperationsState {
  const order = state.orders.find((item) => item.id === orderId)
  const driver = state.drivers.find((item) => item.id === driverId)
  const vehicle = vehicleId ? state.vehicles.find((item) => item.id === vehicleId) : undefined
  if (
    !order ||
    !['pending_assignment', 'scheduled'].includes(order.status) ||
    !driver ||
    (vehicleId && (!vehicle || vehicle.status !== 'available'))
  )
    return state
  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId
        ? {
            ...item,
            driverId,
            vehicleId,
            status: 'scheduled',
            calendarState: 'sent',
            emailState: 'prepared',
          }
        : item,
    ),
    vehicles: vehicleId
      ? state.vehicles.map((item) =>
          item.id === vehicleId ? { ...item, status: 'on_route' } : item,
        )
      : state.vehicles,
    activity: [
      activity('Conductor asignado', `${order.reference} · ${driver.name}`, 'success'),
      ...state.activity,
    ],
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

export function completeOrder(state: OperationsState, orderId: string): OperationsState {
  const order = state.orders.find((item) => item.id === orderId)
  if (!order || (order.status !== 'scheduled' && order.status !== 'in_progress')) return state
  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId ? { ...item, status: 'completed', kabikuState: 'prepared' } : item,
    ),
    vehicles: state.vehicles.map((item) =>
      item.id === order.vehicleId ? { ...item, status: 'available' } : item,
    ),
    activity: [
      activity('Viaje completado', `${order.reference} · listo para facturar`, 'success'),
      ...state.activity,
    ],
  }
}

export function syncWithKabiku(state: OperationsState, orderId: string): OperationsState {
  const order = state.orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'completed') return state
  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId ? { ...item, status: 'invoiced', kabikuState: 'synced' } : item,
    ),
    activity: [
      activity(
        'Factura preparada para Kabiku',
        `${order.reference} · ${formatMoney(order.amountCents)}`,
        'success',
      ),
      ...state.activity,
    ],
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
  const message = `Hola ${driver.name.split(' ')[0]}, tienes una recogida el ${formatScheduledAt(order.scheduledAt)} en ${order.pickupAddress}, ${order.pickupCity}, para entregar en ${order.deliveryAddress}, ${order.deliveryCity}. Referencia ${order.reference}.`
  return `https://wa.me/${driver.phone}?text=${encodeURIComponent(message)}`
}

export function buildCalendarHref(order: PickupOrder, driver?: Driver, vehicle?: Vehicle): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildCalendarContent(order, driver, vehicle))}`
}

export function buildCalendarContent(
  order: PickupOrder,
  driver?: Driver,
  vehicle?: Vehicle,
): string {
  const start = new Date(order.scheduledAt)
  const end = new Date(start.getTime() + 90 * 60 * 1000)
  const date = (value: Date) =>
    value.toISOString().replaceAll('-', '').replaceAll(':', '').replace('.000', '')
  const escapeText = (value: string) =>
    value.replaceAll('\\', '\\\\').replaceAll(',', '\\,').replaceAll(';', '\\;')
  const description = escapeText(
    `${order.cargo} · ${driver?.name ?? 'Conductor pendiente'} · ${vehicle?.plate ?? 'Vehículo pendiente'}`,
  )
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gestion Recogidas//ES',
    'BEGIN:VEVENT',
    `UID:${order.id}@gestion-recogidas`,
    `DTSTART:${date(start)}`,
    `DTEND:${date(end)}`,
    `SUMMARY:${escapeText(`Recogida ${order.reference}`)}`,
    `LOCATION:${escapeText(`${order.pickupAddress}, ${order.pickupCity}`)}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
