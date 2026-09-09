import {
  Badge,
  Card,
  CardContent,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@doscientos/ui'
import { CalendarDays, UsersRound } from 'lucide-react'

import { useOperations } from '../application/operations-context'
import type { PickupOrder } from '../application/types'
import { formatScheduledAt } from '../application/workflow'
import { StatusBadge } from './status-badge'

type CalendarDay = { date: Date; key: string }

const weekdayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long' })

function dateKey(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function calendarDays(orders: PickupOrder[]): CalendarDay[] {
  const firstServiceDay = orders
    .map((order) => order.scheduledAt.slice(0, 10))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort()[0]
  const firstDay = new Date(`${firstServiceDay ?? dateKey(new Date())}T12:00:00`)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  firstDay.setDate(firstDay.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDay)
    date.setDate(firstDay.getDate() + index)
    return { date, key: dateKey(date) }
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
  const days = calendarDays(state.orders)
  const today = dateKey(new Date())
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
      <div className="calendar-grid">
        {days.map((day) => {
          const orders = state.orders.filter((order) => order.scheduledAt.startsWith(day.key))
          return (
            <section
              key={day.key}
              className={`calendar-day ${day.key === today ? 'calendar-day-today' : ''}`}
            >
              <header>
                <span>{weekdayFormatter.format(day.date)}</span>
                <strong>{day.date.getDate()}</strong>
              </header>
              <div className="space-y-2">
                {orders.map((order) => (
                  <Card key={order.id} size="sm" className="calendar-event">
                    <CardContent>
                      <p className="text-xs font-semibold">
                        {formatScheduledAt(order.scheduledAt).split(',').at(-1)}
                      </p>
                      <p className="mt-1 text-sm font-medium">{order.reference}</p>
                      <p className="text-muted-foreground mt-2 text-xs">{order.serviceType}</p>
                      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                        <UsersRound aria-hidden className="size-3" />
                        {order.passengerCount || '—'}
                      </p>
                      <div className="mt-3">
                        <StatusBadge status={order.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {orders.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-xs">Sin recogidas</p>
                ) : null}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
