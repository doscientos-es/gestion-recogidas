import {
  Card,
  CardContent,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@doscientos/ui'
import { Link } from '@tanstack/react-router'
import { CalendarClock, CircleDollarSign, Inbox, UserRoundPlus, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { dashboardMetrics } from '../application/dashboard-metrics'
import { useOperations } from '../application/operations-context'
import { defaultTravelSearch } from '../application/travel-search'
import { formatMoney, formatScheduledAt } from '../application/workflow'
import { StatusBadge } from './status-badge'

const chartColors = ['#0f5963', '#2382a5', '#31a0a9', '#b97518', '#687b7d']
const fallbackChartColor = '#0f5963'

export function DashboardPage() {
  const { state } = useOperations()
  const metrics = dashboardMetrics(state)
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Resumen</PageHeaderTitle>
          <PageHeaderDescription>
            Estado de la operativa compartida y de los próximos servicios.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <Link to="/viajes" search={{ ...defaultTravelSearch }} className="action-link">
          <Inbox aria-hidden />
          Ver viajes
        </Link>
      </PageHeader>

      <section className="dashboard-metrics" aria-label="Indicadores operativos">
        <Metric
          icon={<CalendarClock aria-hidden />}
          label="Viajes recibidos"
          value={metrics.totalOrders}
        />
        <Metric
          icon={<UserRoundPlus aria-hidden />}
          label="Por asignar"
          value={metrics.pendingOrders}
        />
        <Metric icon={<Inbox aria-hidden />} label="Nuevos por revisar" value={metrics.newOrders} />
        <Metric
          icon={<CircleDollarSign aria-hidden />}
          label="Importe estimado"
          value={formatMoney(metrics.estimatedAmountCents)}
        />
      </section>

      <section className="dashboard-charts" aria-label="Gráficos operativos">
        <Card>
          <CardContent className="dashboard-card-content">
            <div>
              <h2 className="text-sm font-semibold">Carga de servicios</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Próximos días con viajes y pendientes.
              </p>
            </div>
            <div className="dashboard-chart" role="img" aria-label="Carga de servicios por día">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.days} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboard-total" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#0f5963" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0f5963" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Viajes"
                    stroke="#0f5963"
                    fill="url(#dashboard-total)"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name="Por asignar"
                    stroke="#b97518"
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="dashboard-card-content">
            <div>
              <h2 className="text-sm font-semibold">Tipos de servicio</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Distribución de los viajes recibidos.
              </p>
            </div>
            <div
              className="dashboard-chart"
              role="img"
              aria-label="Distribución por tipo de servicio"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.serviceBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={3}
                  >
                    {metrics.serviceBreakdown.map((service, index) => (
                      <Cell
                        key={service.name}
                        fill={chartColors[index % chartColors.length] ?? fallbackChartColor}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="dashboard-lists">
        <Card>
          <CardContent className="dashboard-card-content">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">Próximos servicios</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Los cinco siguientes en la planificación.
                </p>
              </div>
              <Users aria-hidden className="text-muted-foreground size-4" />
            </div>
            <div className="divide-border divide-y">
              {metrics.upcomingOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{order.reference}</p>
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      {formatScheduledAt(order.scheduledAt)} · {order.passengerCount} pasajeros
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
              {metrics.upcomingOrders.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No hay servicios próximos.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="dashboard-card-content">
            <div>
              <h2 className="text-sm font-semibold">Actividad reciente</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Últimos cambios de la bandeja compartida.
              </p>
            </div>
            <ol className="space-y-4">
              {state.activity.slice(0, 5).map((item) => (
                <li key={item.id} className="flex gap-3 text-sm">
                  <span className={`activity-dot activity-dot-${item.tone}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{item.detail}</p>
                  </div>
                  <time className="text-muted-foreground ml-auto text-xs">{item.at}</time>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number | string
}) {
  return (
    <Card>
      <CardContent className="dashboard-metric">
        <span className="dashboard-metric-icon">{icon}</span>
        <div>
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
