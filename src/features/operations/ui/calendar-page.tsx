import {
  Badge,
  Card,
  CardContent,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@doscientos/ui'
import { CalendarDays, MapPin } from 'lucide-react'

import { useOperations } from '../application/operations-context'
import { formatScheduledAt } from '../application/workflow'
import { StatusBadge } from './status-badge'

const days = [
  { key: '2026-09-07', label: 'Lun', date: '7' },
  { key: '2026-09-08', label: 'Mar', date: '8' },
  { key: '2026-09-09', label: 'Mié', date: '9' },
  { key: '2026-09-10', label: 'Jue', date: '10' },
  { key: '2026-09-11', label: 'Vie', date: '11' },
]
export function CalendarPage() {
  const { state } = useOperations()
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
          7–11 septiembre
        </Badge>
      </PageHeader>
      <div className="calendar-grid">
        {days.map((day) => {
          const orders = state.orders.filter((order) => order.scheduledAt.startsWith(day.key))
          return (
            <section
              key={day.key}
              className={`calendar-day ${day.date === '10' ? 'calendar-day-today' : ''}`}
            >
              <header>
                <span>{day.label}</span>
                <strong>{day.date}</strong>
              </header>
              <div className="space-y-2">
                {orders.map((order) => (
                  <Card key={order.id} size="sm" className="calendar-event">
                    <CardContent>
                      <p className="text-xs font-semibold">
                        {formatScheduledAt(order.scheduledAt).split(',').at(-1)}
                      </p>
                      <p className="mt-1 text-sm font-medium">{order.reference}</p>
                      <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                        <MapPin aria-hidden className="size-3" />
                        {order.pickupCity} → {order.deliveryCity}
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
