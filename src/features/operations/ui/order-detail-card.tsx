import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@doscientos/ui'
import { MailCheck, MessageCircle } from 'lucide-react'
import { useState } from 'react'

import { useOperations } from '../application/operations-context'
import type { Driver, PickupOrder } from '../application/types'
import { buildWhatsAppUrl, formatMoney, formatScheduledAt } from '../application/workflow'
import { RouteSummary } from './route-summary'
import { StatusBadge } from './status-badge'

export function OrderDetailCard({ order }: { order: PickupOrder }) {
  const { state, processOrder, assign } = useOperations()
  const [driverId, setDriverId] = useState(order.driverId ?? state.drivers[0]?.id ?? '')
  const [assigning, setAssigning] = useState(false)
  const driver = state.drivers.find((item) => item.id === order.driverId)

  return (
    <Card className="border-primary/15 overflow-hidden">
      <CardHeader className="bg-muted/40 border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs">{order.reference}</p>
            <CardTitle className="mt-1">{order.customer}</CardTitle>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <RouteSummary order={order} />
        <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3">
          <Info label="Fecha y hora" value={formatScheduledAt(order.scheduledAt)} />
          <Info label="Carga" value={`${order.cargo} · ${order.weightKg} kg`} />
          <Info label="Importe" value={formatMoney(order.amountCents)} />
        </div>
        {order.status === 'received' ? (
          <InboundAction order={order} onProcess={() => processOrder(order.id)} />
        ) : null}
        {order.status === 'pending_assignment' || order.status === 'scheduled' ? (
          <div className="bg-primary/5 border-primary/15 space-y-4 rounded-xl border p-4">
            <div>
              <h3 className="font-semibold">
                {order.status === 'scheduled' ? 'Cambiar conductor' : 'Asignar conductor'}
              </h3>
              <p className="text-muted-foreground text-sm">
                El viaje quedará confirmado al asignar un conductor.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                id="order-driver"
                label="Conductor"
                value={driverId}
                onChange={setDriverId}
                options={state.drivers.map((item) => [item.id, item.name])}
              />
            </div>
            <Button
              isDisabled={!driverId || assigning}
              onPress={() => {
                setAssigning(true)
                void assign(order.id, driverId, '').finally(() => setAssigning(false))
              }}
            >
              {assigning
                ? 'Guardando…'
                : order.status === 'scheduled'
                  ? 'Guardar cambio'
                  : 'Confirmar viaje'}
            </Button>
          </div>
        ) : null}
        {driver ? <CommunicationActions order={order} driver={driver} /> : null}
      </CardContent>
    </Card>
  )
}

function InboundAction({ order, onProcess }: { order: PickupOrder; onProcess: () => void }) {
  return (
    <div className="border-info/25 bg-info/5 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">Adjunto analizado correctamente</p>
        <p className="text-muted-foreground text-sm">
          {order.attachmentName} · 11 datos identificados con confianza alta
        </p>
      </div>
      <Button onPress={onProcess}>Crear orden de recogida</Button>
    </div>
  )
}

function CommunicationActions({ order, driver }: { order: PickupOrder; driver: Driver }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <MailCheck aria-hidden className="text-success size-4" />
        <span>
          Conductor asignado: {driver.name} · {driver.phone}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          className="action-link action-link-whatsapp"
          href={buildWhatsAppUrl(order, driver)}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle aria-hidden />
          Abrir WhatsApp
        </a>
        <a className="action-link" href="#kabiku">
          Ver en Kabiku
        </a>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: string[][]
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="field-control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </div>
  )
}
