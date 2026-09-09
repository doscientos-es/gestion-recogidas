import {
  Badge,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@doscientos/ui'
import { CalendarDays, ChevronLeft, ChevronRight, Filter, UsersRound } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'

import { useOperations } from '../application/operations-context'
import type { PickupOrder } from '../application/types'
import { formatScheduledAt } from '../application/workflow'

type CalendarDay = { date: Date; key: string }
type CalendarStatus = 'all' | PickupOrder['status']
type DriverFilter = string
type PositionedEvent = { order: PickupOrder; start: number; column: number; columnCount: number }

const dayMinutes = 24 * 60
const hourStart = 6
const hourEnd = 22
const hourHeight = 64
const serviceDuration = 90

const weekdayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long' })

function dateKey(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function calendarDays(weekStart: string): CalendarDay[] {
  const firstDay = new Date(`${weekStart}T12:00:00`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDay)
    date.setDate(firstDay.getDate() + index)
    return { date, key: dateKey(date) }
  })
}

function weekStartForDate(value: Date): string {
  const firstDay = new Date(value)
  firstDay.setHours(12, 0, 0, 0)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  firstDay.setDate(firstDay.getDate() - mondayOffset)
  return dateKey(firstDay)
}

function firstWeekStart(orders: PickupOrder[]): string {
  const firstServiceDay = orders
    .map((order) => order.scheduledAt.slice(0, 10))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort()[0]
  const firstDay = new Date(`${firstServiceDay ?? dateKey(new Date())}T12:00:00`)
  return weekStartForDate(firstDay)
}

function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T12:00:00`)
  date.setDate(date.getDate() + amount)
  return dateKey(date)
}

function orderMinutes(order: PickupOrder): number {
  const time = /T(\d{2}):(\d{2})/.exec(order.scheduledAt)
  if (!time) return hourStart * 60
  return Math.min(dayMinutes - 1, Number(time[1]) * 60 + Number(time[2]))
}

function layoutEvents(orders: PickupOrder[]): PositionedEvent[] {
  const sorted = [...orders].sort((a, b) => orderMinutes(a) - orderMinutes(b))
  const clusters: PickupOrder[][] = []
  let clusterEnd = -1
  for (const order of sorted) {
    const start = orderMinutes(order)
    if (start >= clusterEnd) {
      clusters.push([order])
      clusterEnd = start + serviceDuration
    } else {
      clusters.at(-1)?.push(order)
      clusterEnd = Math.max(clusterEnd, start + serviceDuration)
    }
  }
  return clusters.flatMap((cluster) => {
    const columns: number[] = []
    const positioned = cluster.map((order) => {
      const start = orderMinutes(order)
      let column = columns.findIndex((end) => end <= start)
      if (column === -1) {
        column = columns.length
        columns.push(0)
      }
      columns[column] = start + serviceDuration
      return { order, start, column }
    })
    return positioned.map((event) => ({ ...event, columnCount: columns.length }))
  })
}

function weekRange(days: CalendarDay[]): string {
  const first = days[0]?.date
  const last = days.at(-1)?.date
  if (!first || !last) return ''
  if (first.getMonth() === last.getMonth())
    return `${first.getDate()}–${last.getDate()} ${monthFormatter.format(last)}`
  return `${first.getDate()} ${monthFormatter.format(first)}–${last.getDate()} ${monthFormatter.format(last)}`
}

export function CalendarPage() {
  const { state } = useOperations()
  const [weekStart, setWeekStart] = useState(() => firstWeekStart(state.orders))
  const [status, setStatus] = useState<CalendarStatus>('all')
  const [driverId, setDriverId] = useState<DriverFilter>('all')
  const days = useMemo(() => calendarDays(weekStart), [weekStart])
  const visibleOrders = useMemo(
    () =>
      state.orders.filter(
        (order) =>
          (status === 'all' || order.status === status) &&
          (driverId === 'all' ||
            (driverId === 'unassigned' ? !order.driverId : order.driverId === driverId)),
      ),
    [driverId, state.orders, status],
  )
  const calendarOrders = useMemo(() => {
    const weekEnd = addDays(weekStart, 6)
    return visibleOrders.filter((order) => {
      const scheduledDay = order.scheduledAt.slice(0, 10)
      return scheduledDay >= weekStart && scheduledDay <= weekEnd
    })
  }, [visibleOrders, weekStart])
  const driverNames = useMemo(
    () => new Map(state.drivers.map((driver) => [driver.id, driver.name])),
    [state.drivers],
  )
  const today = dateKey(new Date())
  const hours = Array.from({ length: hourEnd - hourStart }, (_, index) => hourStart + index)
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Calendario</PageHeaderTitle>
          <PageHeaderDescription>
            Planificación compartida de recogidas y conductores.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <Badge>
          <CalendarDays aria-hidden className="size-3" />
          {weekRange(days)}
        </Badge>
      </PageHeader>
      <section className="calendar-toolbar" aria-label="Controles del calendario">
        <div className="calendar-navigation" aria-label="Navegación semanal">
          <button
            type="button"
            className="calendar-nav-button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            aria-label="Semana anterior"
          >
            <ChevronLeft aria-hidden />
          </button>
          <button
            type="button"
            className="calendar-today-button"
            onClick={() => setWeekStart(weekStartForDate(new Date()))}
          >
            Hoy
          </button>
          <button
            type="button"
            className="calendar-nav-button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label="Semana siguiente"
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
        <div className="calendar-filters">
          <Filter aria-hidden className="text-muted-foreground size-4" />
          <label>
            <span className="sr-only">Estado</span>
            <select
              className="field-control"
              value={status}
              onChange={(event) => setStatus(event.target.value as CalendarStatus)}
            >
              <option value="all">Todos los estados</option>
              <option value="pending_assignment">Por asignar</option>
              <option value="assigned">Asignados</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Transportista</span>
            <select
              className="field-control"
              value={driverId}
              onChange={(event) => setDriverId(event.target.value)}
            >
              <option value="all">Todos los transportistas</option>
              <option value="unassigned">Sin asignar</option>
              {state.drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="calendar-results" aria-live="polite">
          {calendarOrders.length} recogidas visibles
        </p>
      </section>
      <div className="calendar-scroll">
        <div className="calendar-week">
          <div className="calendar-week-header" aria-hidden>
            <span />
            {days.map((day) => (
              <div
                key={day.key}
                className={
                  day.key === today ? 'calendar-weekday calendar-weekday-today' : 'calendar-weekday'
                }
              >
                <span>{weekdayFormatter.format(day.date)}</span>
                <strong>{day.date.getDate()}</strong>
              </div>
            ))}
          </div>
          <div className="calendar-body">
            <div className="calendar-time-labels" aria-hidden>
              {hours.map((hour) => (
                <span key={hour} style={{ height: hourHeight }}>
                  {`${String(hour).padStart(2, '0')}:00`}
                </span>
              ))}
            </div>
            <div className="calendar-days-grid">
              {days.map((day) => (
                <CalendarDayColumn
                  key={day.key}
                  day={day}
                  orders={calendarOrders.filter((order) => order.scheduledAt.startsWith(day.key))}
                  isToday={day.key === today}
                  driverNames={driverNames}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CalendarDayColumn({
  day,
  orders,
  isToday,
  driverNames,
}: {
  day: CalendarDay
  orders: PickupOrder[]
  isToday: boolean
  driverNames: Map<string, string>
}) {
  const events = layoutEvents(orders)
  return (
    <section
      className={`calendar-day-timeline ${isToday ? 'calendar-day-timeline-today' : ''}`}
      aria-label={`Recogidas del ${day.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`}
    >
      {events.map(({ order, start, column, columnCount }) => {
        const clippedStart = Math.max(start, hourStart * 60)
        const duration = Math.max(40, Math.min(serviceDuration, hourEnd * 60 - clippedStart))
        const style: CSSProperties = {
          top: ((clippedStart - hourStart * 60) / 60) * hourHeight,
          height: (duration / 60) * hourHeight,
          left: `${(column / columnCount) * 100}%`,
          width: `${100 / columnCount}%`,
        }
        const driver = order.driverId
          ? (driverNames.get(order.driverId) ?? 'Asignado')
          : 'Sin asignar'
        return (
          <article
            key={order.id}
            className={`calendar-event calendar-event-${order.status}`}
            style={style}
            title={`${formatScheduledAt(order.scheduledAt)} · ${order.reference}`}
          >
            <p className="calendar-event-time">
              {formatScheduledAt(order.scheduledAt).split(',').at(-1)}
            </p>
            <p className="calendar-event-reference">{order.reference}</p>
            <p className="calendar-event-customer">{order.customer}</p>
            <p className="calendar-event-meta">
              <UsersRound aria-hidden />
              {order.passengerCount || '—'} · {driver}
            </p>
          </article>
        )
      })}
      {events.length === 0 ? <p className="calendar-empty">Sin recogidas</p> : null}
    </section>
  )
}
