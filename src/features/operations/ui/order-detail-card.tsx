import { Button, Label } from '@doscientos/ui'
import {
  BriefcaseBusiness,
  CalendarClock,
  Mail,
  MailCheck,
  MessageCircle,
  Pencil,
  Phone,
  Route,
  UsersRound,
  WalletCards,
} from 'lucide-react'
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
    <div className="order-detail-content space-y-5">
      <header className="border-b pr-10 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs">{order.reference}</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">{order.customer}</h2>
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
      </header>
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
              icon={<UsersRound aria-hidden />}
              label="Pasajeros"
              value={order.passengerCount ? `${order.passengerCount} pasajeros` : 'No indicado'}
            />
            <Info icon={<BriefcaseBusiness aria-hidden />} label="Equipaje" value={order.luggage} />
            <Info
              icon={<WalletCards aria-hidden />}
              label="Importe"
              value={formatMoney(order.amountCents)}
            />
          </div>
          <PassengerServiceDetails order={order} />
        </>
      )}
      {order.status === 'pending_assignment' || order.status === 'assigned' ? (
        <div className="driver-assignment">
          <div className="driver-assignment-actions">
            <SelectField
              id="order-driver"
              label={order.status === 'assigned' ? 'Cambiar conductor' : 'Asignar conductor'}
              value={driverId}
              onChange={setDriverId}
              options={state.drivers.map((item) => [item.id, item.name])}
            />
            <Button
              isDisabled={
                !driverId ||
                assigning ||
                (order.status === 'assigned' && driverId === order.driverId)
              }
              size="sm"
              onPress={() => {
                setAssigning(true)
                void assign(order.id, driverId).finally(() => setAssigning(false))
              }}
            >
              {assigning
                ? 'Guardando…'
                : order.status === 'assigned'
                  ? 'Guardar cambio'
                  : 'Asignar conductor'}
            </Button>
          </div>
        </div>
      ) : null}
      {driver ? <CommunicationActions order={order} driver={driver} /> : null}
    </div>
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
    serviceType: order.serviceType,
    passengerCount: String(order.passengerCount),
    luggage: order.luggage,
    passengerPhone: order.passengerPhone ?? '',
    passengerEmail: order.passengerEmail ?? '',
    preferences: order.preferences ?? '',
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
      serviceType: values.serviceType.trim(),
      passengerCount: Number(values.passengerCount),
      luggage: values.luggage.trim(),
      ...(values.passengerPhone.trim() ? { passengerPhone: values.passengerPhone.trim() } : {}),
      ...(values.passengerEmail.trim() ? { passengerEmail: values.passengerEmail.trim() } : {}),
      ...(values.preferences.trim() ? { preferences: values.preferences.trim() } : {}),
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
        label="Tipo de servicio"
        value={values.serviceType}
        onChange={(serviceType) => setValues({ ...values, serviceType })}
      />
      <EditField
        label="Pasajeros"
        type="number"
        min="0"
        value={values.passengerCount}
        onChange={(passengerCount) => setValues({ ...values, passengerCount })}
      />
      <EditField
        label="Equipaje"
        value={values.luggage}
        onChange={(luggage) => setValues({ ...values, luggage })}
      />
      <EditField
        label="Teléfono del pasajero"
        type="tel"
        value={values.passengerPhone}
        onChange={(passengerPhone) => setValues({ ...values, passengerPhone })}
      />
      <EditField
        label="Email del pasajero"
        type="email"
        value={values.passengerEmail}
        onChange={(passengerEmail) => setValues({ ...values, passengerEmail })}
      />
      <EditField
        label="Preferencias"
        value={values.preferences}
        onChange={(preferences) => setValues({ ...values, preferences })}
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

function PassengerServiceDetails({ order }: { order: PickupOrder }) {
  const journeys = Array.isArray(order.journeys)
    ? order.journeys
    : [{ origin: order.pickupAddress, destination: order.deliveryAddress }]
  return (
    <div className="bg-muted/30 border-border space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Servicio
          </p>
          <p className="mt-1 font-medium">{order.serviceType}</p>
        </div>
        {order.childSeatCount ? (
          <span className="bg-background rounded-full px-2.5 py-1 text-xs">
            {order.childSeatCount} silla infantil
          </span>
        ) : null}
      </div>
      {order.passengerPhone || order.passengerEmail ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {order.passengerPhone ? (
            <span className="flex items-center gap-1.5">
              <Phone aria-hidden className="size-3.5" />
              {order.passengerPhone}
            </span>
          ) : null}
          {order.passengerEmail ? (
            <span className="flex items-center gap-1.5">
              <Mail aria-hidden className="size-3.5" />
              {order.passengerEmail}
            </span>
          ) : null}
        </div>
      ) : null}
      {order.preferences ? (
        <p className="text-sm">
          <span className="font-medium">Preferencias: </span>
          {order.preferences}
        </p>
      ) : null}
      {order.language ? (
        <p className="text-sm">
          <span className="font-medium">Idioma preferente: </span>
          {order.language}
        </p>
      ) : null}
      {order.driverObservations ? (
        <p className="text-sm">
          <span className="font-medium">Observaciones para el conductor: </span>
          {order.driverObservations}
        </p>
      ) : null}
      {journeys.length > 1 || journeys.some(hasJourneyDetails) ? (
        <div className="border-t pt-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Route aria-hidden className="size-4" />
            Itinerario completo
          </p>
          <ol className="mt-2 space-y-2 text-sm">
            {journeys.map((journey, index) => (
              <li key={`${journey.origin}-${journey.destination}-${index}`}>
                <span className="font-medium">{index + 1}. </span>
                {journey.origin} → {journey.destination}
                {journey.pickupInstructions ? (
                  <span className="text-muted-foreground block pl-4">
                    Recogida: {journey.pickupInstructions}
                  </span>
                ) : null}
                {journey.originInstructions ? (
                  <span className="text-muted-foreground block pl-4">
                    Origen: {journey.originInstructions}
                  </span>
                ) : null}
                {journey.destinationInstructions ? (
                  <span className="text-muted-foreground block pl-4">
                    Destino: {journey.destinationInstructions}
                  </span>
                ) : null}
                {journey.expectedWait ? (
                  <span className="text-muted-foreground block pl-4">
                    Espera prevista: {journey.expectedWait}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : journeys[0]?.pickupInstructions ? (
        <p className="text-sm">
          <span className="font-medium">Indicaciones: </span>
          {journeys[0].pickupInstructions}
        </p>
      ) : null}
      <PricingDetails order={order} />
      {order.waitingConditions ? (
        <details className="border-t pt-3 text-sm">
          <summary className="cursor-pointer font-medium">
            Condiciones de las horas de espera
          </summary>
          <p className="text-muted-foreground mt-2 leading-6">{order.waitingConditions}</p>
        </details>
      ) : null}
    </div>
  )
}

function hasJourneyDetails(order: PickupOrder['journeys'][number]): boolean {
  return Boolean(
    order.pickupInstructions ||
    order.originInstructions ||
    order.destinationInstructions ||
    order.expectedWait,
  )
}

function PricingDetails({ order }: { order: PickupOrder }) {
  const amounts: [string, number | undefined][] = [
    ['Precio trayecto/s', order.journeyAmountCents],
    ['Precio extras', order.extrasAmountCents],
    ['Precio hora de espera', order.waitRateCents],
    ['Importe horas de espera', order.waitAmountCents],
  ]
  if (!order.waitHours && !amounts.some(([, amount]) => amount !== undefined)) return null
  return (
    <div className="border-t pt-3 text-sm">
      <p className="font-medium">Desglose del servicio</p>
      <dl className="text-muted-foreground mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {order.waitHours ? (
          <div className="flex justify-between gap-2">
            <dt>Horas de espera</dt>
            <dd>{order.waitHours}</dd>
          </div>
        ) : null}
        {amounts.map(([label, amount]) =>
          amount !== undefined ? (
            <div key={label} className="flex justify-between gap-2">
              <dt>{label}</dt>
              <dd>{formatMoney(amount)}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </div>
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
  type?: 'text' | 'number' | 'tel' | 'email'
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
