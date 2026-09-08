import {
  Badge,
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
import { ArrowUpRight, Gauge, MapPinned, Truck, Wrench } from 'lucide-react'

import { useOperations } from '../application/operations-context'

const statusLabel = { available: 'Disponible', on_route: 'En ruta', maintenance: 'En taller' }
export function VehiclesPage() {
  const { state } = useOperations()
  const nextService = [...state.vehicles].sort(
    (left, right) =>
      left.nextServiceKm - left.odometerKm - (right.nextServiceKm - right.odometerKm),
  )[0]
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Control de vehículos</PageHeaderTitle>
          <PageHeaderDescription>
            Estado de la flota y acceso al seguimiento telemático.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <a className="action-link" href="https://movildata.com" target="_blank" rel="noreferrer">
          Abrir Movildata <ArrowUpRight aria-hidden />
        </a>
      </PageHeader>
      <MetricGrid>
        <MetricCard
          label="Vehículos"
          value={state.vehicles.length}
          description="Flota registrada"
          icon={<Truck aria-hidden />}
        />
        <MetricCard
          label="Disponibles"
          value={state.vehicles.filter((item) => item.status === 'available').length}
          description="Listos para asignar"
          icon={<MapPinned aria-hidden />}
          tone="success"
        />
        <MetricCard
          label="Revisión próxima"
          value={
            nextService
              ? `${Math.max(0, nextService.nextServiceKm - nextService.odometerKm)} km`
              : '—'
          }
          description={nextService?.model ?? 'Sin vehículos registrados'}
          icon={<Wrench aria-hidden />}
          tone="warning"
        />
      </MetricGrid>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.vehicles.map((vehicle) => {
          const progress = Math.min(100, (vehicle.odometerKm / vehicle.nextServiceKm) * 100)
          return (
            <Card key={vehicle.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{vehicle.model}</CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">{vehicle.type}</p>
                  </div>
                  <Badge
                    variant={
                      vehicle.status === 'available'
                        ? 'success'
                        : vehicle.status === 'maintenance'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {statusLabel[vehicle.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="plate">{vehicle.plate}</p>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Gauge aria-hidden className="size-3" />
                      Kilometraje
                    </span>
                    <strong>{vehicle.odometerKm.toLocaleString('es-ES')} km</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Próxima revisión a los {vehicle.nextServiceKm.toLocaleString('es-ES')} km
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
