import type { OperationsState, PickupOrder } from './types'

export type DashboardDay = {
  day: string
  label: string
  pending: number
  total: number
}

export type ServiceBreakdown = { name: string; value: number }

export type DashboardMetrics = {
  assignedOrders: number
  days: DashboardDay[]
  estimatedAmountCents: number
  newOrders: number
  pendingOrders: number
  serviceBreakdown: ServiceBreakdown[]
  totalOrders: number
  upcomingOrders: PickupOrder[]
}

function dateKey(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function serviceDay(order: PickupOrder): string {
  return order.scheduledAt.slice(0, 10)
}

function dayLabel(day: string): string {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric' })
    .format(new Date(`${day}T12:00:00`))
    .replace('.', '')
}

export function dashboardMetrics(state: OperationsState, referenceDate = new Date()): DashboardMetrics {
  const sortedOrders = [...state.orders].sort((left, right) =>
    left.scheduledAt.localeCompare(right.scheduledAt),
  )
  const serviceDays = [...new Set(sortedOrders.map(serviceDay).filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)))].sort()
  const today = dateKey(referenceDate)
  const selectedDays = serviceDays.filter((day) => day >= today).slice(0, 7)
  const displayedDays = selectedDays.length > 0 ? selectedDays : serviceDays.slice(0, 7)
  const services = new Map<string, number>()

  for (const order of state.orders)
    services.set(order.serviceType, (services.get(order.serviceType) ?? 0) + 1)

  return {
    totalOrders: state.orders.length,
    pendingOrders: state.orders.filter((order) => order.status === 'pending_assignment').length,
    assignedOrders: state.orders.filter((order) => order.status === 'assigned').length,
    newOrders: state.orders.filter((order) => !order.isRead).length,
    estimatedAmountCents: state.orders.reduce((total, order) => total + order.amountCents, 0),
    days: displayedDays.map((day) => {
      const orders = sortedOrders.filter((order) => serviceDay(order) === day)
      return {
        day,
        label: dayLabel(day),
        total: orders.length,
        pending: orders.filter((order) => order.status === 'pending_assignment').length,
      }
    }),
    serviceBreakdown: [...services]
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5),
    upcomingOrders: sortedOrders.filter((order) => serviceDay(order) >= today).slice(0, 5),
  }
}