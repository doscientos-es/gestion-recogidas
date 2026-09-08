import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MetricCard,
  MetricGrid,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@doscientos/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, CalendarClock, CircleCheck, Inbox, Route, Sparkles } from 'lucide-react'

import { useOperations } from '../application/operations-context'
import { defaultTravelSearch } from '../application/travel-search'
import { formatMoney } from '../application/workflow'

export function DashboardPage() {
  const { loading, saving, state, processOrder } = useOperations()
  const navigate = useNavigate()
  const received = state.orders.find((order) => order.status === 'received')
  const pendingAssignment = state.orders.filter(
    (order) => order.status === 'pending_assignment',
  ).length
  const active = state.orders.filter((order) =>
    ['received', 'pending_assignment'].includes(order.status),
  ).length
  const confirmed = state.orders.filter((order) => order.status === 'scheduled')
  const nextOrder = [...state.orders]
    .filter(
      (order) =>
        !['completed', 'invoiced'].includes(order.status) &&
        new Date(order.scheduledAt).getTime() >= Date.now(),
    )
    .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt))[0]
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Buenos días</PageHeaderTitle>
          <PageHeaderDescription>
            Todo lo importante de la operativa de hoy, en una sola vista.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <Badge variant="success">Sistema operativo</Badge>
      </PageHeader>
      <MetricGrid>
        <MetricCard
          label="Viajes pendientes"
          value={active}
          description={`${pendingAssignment} ${pendingAssignment === 1 ? 'pendiente' : 'pendientes'} de asignación`}
          icon={<Route aria-hidden />}
          tone="info"
        />
        <MetricCard
          label="Próxima recogida"
          value={
            nextOrder
              ? new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(
                  new Date(nextOrder.scheduledAt),
                )
              : 'Sin pendientes'
          }
          description={
            nextOrder ? `${nextOrder.pickupCity} → ${nextOrder.deliveryCity}` : 'Agenda despejada'
          }
          icon={<CalendarClock aria-hidden />}
          tone="warning"
        />
        <MetricCard
          label="Confirmados"
          value={confirmed.length}
          description="Conductor asignado"
          icon={<CircleCheck aria-hidden />}
          tone="success"
        />
        <MetricCard
          label="Conductores"
          value={state.drivers.length}
          description="Solo teléfono necesario"
          icon={<Sparkles aria-hidden />}
        />
      </MetricGrid>
      {received ? (
        <Card className="inbox-card">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-primary flex items-center gap-2 text-sm font-semibold">
                  <Inbox aria-hidden className="size-4" />
                  Nuevo correo procesado
                </p>
                <CardTitle className="mt-2">Solicitud de {received.customer}</CardTitle>
              </div>
              <Badge variant="warning">Recibido por email</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[1fr_auto]">
            <div className="grid gap-3 sm:grid-cols-3">
              <Mini label="Trayecto" value={`${received.pickupCity} → ${received.deliveryCity}`} />
              <Mini label="Fecha" value="Jue. 10 sep · 09:30" />
              <Mini label="Adjunto" value={received.attachmentName ?? ''} />
            </div>
            <div className="flex items-center gap-2">
              <Button
                isDisabled={loading || saving}
                onPress={() => {
                  processOrder(received.id)
                  void navigate({
                    to: '/viajes',
                    search: { ...defaultTravelSearch, status: 'pending_assignment' },
                  })
                }}
              >
                Crear orden y asignar
              </Button>
              <Link
                to="/viajes"
                search={{ ...defaultTravelSearch }}
                className="icon-link"
                aria-label="Abrir viajes"
              >
                <ArrowRight aria-hidden />
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <ActivityFeed />
        <AutomationFlow />
      </div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}
function ActivityFeed() {
  const { state } = useOperations()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.activity.slice(0, 4).map((item) => (
          <div key={item.id} className="flex gap-3">
            <span className={`activity-dot activity-dot-${item.tone}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-muted-foreground truncate text-xs">{item.detail}</p>
            </div>
            <span className="text-muted-foreground text-xs">{item.at}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
function AutomationFlow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Flujo automatizado</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flow-list">
          {[
            'Correo y adjunto recibidos',
            'Datos extraídos y guardados',
            'Pendiente de asignar conductor',
            'Admin asigna conductor',
            'Aviso manual por WhatsApp',
            'Viaje confirmado · Ver en Kabiku',
          ].map((item, index) => (
            <li key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
