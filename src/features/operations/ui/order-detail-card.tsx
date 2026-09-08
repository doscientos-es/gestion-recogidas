import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@doscientos/ui'
import { CalendarClock, MailCheck, MessageCircle, Package, Pencil, WalletCards } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'

import { useOperations } from '../application/operations-context'
import type { Driver, PickupOrder } from '../application/types'
import { buildWhatsAppUrl, formatMoney, formatScheduledAt } from '../application/workflow'
import { RouteSummary } from './route-summary'
import { StatusBadge } from './status-badge'

export function OrderDetailCard({ order }: { order: PickupOrder }) {
  const { state, assign } = useOperations()
  const [driverId, setDriverId] = useState(order.driverId ?? state.drivers[0]?.id ?? '')
  const [assigning, setAssigning] = useState(false)
  const [editing, setEditing] = useState(false)
  const driver = state.drivers.find((item) => item.id === order.driverId)

  return (
    <Card className="border-primary/15 overflow-hidden">
      <CardHeader className="bg-muted/40 border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs">{order.reference}</p>
            <CardTitle className="mt-1">{order.customer}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <Button
              variant="outline"
              size="sm"
              onPress={() => setEditing((value) => !value)}
              aria-expanded={editing}
            >
              <Pencil aria-hidden />
              {editing ? 'Cancelar' : 'Editar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {editing ? (
          <OrderEditForm order={order} onDone={() => setEditing(false)} />
        ) : (
          <>
            <RouteSummary order={order} />
            <div className="detail-summary">
              <Info
                icon={<CalendarClock aria-hidden />}
                label="Fecha y hora"
                value={formatScheduledAt(order.scheduledAt)}
              />
              <Info
                icon={<Package aria-hidden />}
                label="Carga"
                value={`${order.cargo} · ${order.weightKg} kg`}
              />
              <Info
                icon={<WalletCards aria-hidden />}
                label="Importe"
                value={formatMoney(order.amountCents)}
              />
            </div>
          </>
        )}
        {order.status === 'pending_assignment' || order.status === 'assigned' ? (
          <div className="driver-assignment">
            <div>
              <h3 className="text-sm font-semibold">
                {order.status === 'assigned' ? 'Cambiar conductor' : 'Asignar conductor'}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Selecciona quién realizará este viaje.
              </p>
            </div>
            <div className="driver-assignment-actions">
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
                size="sm"
              onPress={() => {
                setAssigning(true)
                void assign(order.id, driverId, '').finally(() => setAssigning(false))
              }}
            >
              {assigning
                ? 'Guardando…'
                : order.status === 'assigned'
                  ? 'Guardar cambio'
                  : 'Asignar conductor'}
            </Button>
          </div>
        ) : null}
        {driver ? <CommunicationActions order={order} driver={driver} /> : null}
      </CardContent>
    </Card>
  )
}

/** Convierte una fecha ISO al valor local que espera un input datetime-local. */
function toLocalInput(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function OrderEditForm({ order, onDone }: { order: PickupOrder; onDone: () => void }) {
  const { updateOrder } = useOperations()
  const [values, setValues] = useState({
    customer: order.customer,
    pickupAddress: order.pickupAddress,
    pickupCity: order.pickupCity,
    deliveryAddress: order.deliveryAddress,
    deliveryCity: order.deliveryCity,
    date: toLocalInput(order.scheduledAt),
    cargo: order.cargo,
    weightKg: String(order.weightKg),
    amountEuros: (order.amountCents / 100).toFixed(2),
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    updateOrder(order.id, {
      customer: values.customer.trim(),
      pickupAddress: values.pickupAddress.trim(),
      pickupCity: values.pickupCity.trim(),
      deliveryAddress: values.deliveryAddress.trim(),
      deliveryCity: values.deliveryCity.trim(),
      scheduledAt: new Date(values.date).toISOString(),
      cargo: values.cargo.trim(),
      weightKg: Number(values.weightKg),
      amountCents: Math.round(Number(values.amountEuros) * 100),
    })
    onDone()
  }
  return (
    <form className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2" onSubmit={submit}>
      <EditField
        label="Cliente"
        value={values.customer}
        onChange={(customer) => setValues({ ...values, customer })}
      />
      <div>
        <label className="field-label" htmlFor={`edit-date-${order.id}`}>
          Fecha y hora
        </label>
        <input
          id={`edit-date-${order.id}`}
          className="field-control w-full"
          type="datetime-local"
          required
          value={values.date}
          onChange={(event) => setValues({ ...values, date: event.target.value })}
        />
      </div>
      <EditField
        label="Dirección de recogida"
        value={values.pickupAddress}
        onChange={(pickupAddress) => setValues({ ...values, pickupAddress })}
      />
      <EditField
        label="Ciudad de recogida"
        value={values.pickupCity}
        onChange={(pickupCity) => setValues({ ...values, pickupCity })}
      />
      <EditField
        label="Dirección de entrega"
        value={values.deliveryAddress}
        onChange={(deliveryAddress) => setValues({ ...values, deliveryAddress })}
      />
      <EditField
        label="Ciudad de entrega"
        value={values.deliveryCity}
        onChange={(deliveryCity) => setValues({ ...values, deliveryCity })}
      />
      <EditField
        label="Carga"
        value={values.cargo}
        onChange={(cargo) => setValues({ ...values, cargo })}
      />
      <EditField
        label="Peso (kg)"
        type="number"
        min="1"
        value={values.weightKg}
        onChange={(weightKg) => setValues({ ...values, weightKg })}
      />
      <EditField
        label="Importe (€)"
        type="number"
        min="0"
        step="0.01"
        value={values.amountEuros}
        onChange={(amountEuros) => setValues({ ...values, amountEuros })}
      />
      <div className="flex items-end gap-2">
        <Button type="submit">Guardar cambios</Button>
        <Button type="button" variant="outline" onPress={onDone}>
          Descartar
        </Button>
      </div>
    </form>
  )
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
  min,
  step,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number'
  min?: string
  step?: string
}) {
  const id = `edit-${label}`
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field-control w-full"
        type={type}
        min={min}
        step={step}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
      </div>
    </div>
  )
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="detail-summary-item">
      <span className="detail-summary-icon">{icon}</span>
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
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
