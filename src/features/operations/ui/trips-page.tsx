import {
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@doscientos/ui'
import { Plus, RefreshCw, Search, X } from 'lucide-react'
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'

import { useOperations } from '../application/operations-context'
import type { TravelSearch } from '../application/travel-search'
import type { PickupOrder } from '../application/types'
import { formatScheduledAt } from '../application/workflow'
import { OrderDetailCard } from './order-detail-card'
import { RouteSummary } from './route-summary'
import { StatusBadge } from './status-badge'

export function TripsPage({
  search,
  onSearchChange,
}: {
  search: TravelSearch
  onSearchChange: (update: Partial<TravelSearch>) => void
}) {
  const { state, refresh, loading } = useOperations()
  const [selectedId, setSelectedId] = useState(state.orders[0]?.id)
  const [showForm, setShowForm] = useState(false)
  const orders = useMemo(
    () =>
      state.orders.filter((order) => {
        const query = search.q.toLocaleLowerCase('es')
        return (
          (search.status === 'all' || order.status === search.status) &&
          (!query ||
            `${order.reference} ${order.customer} ${order.pickupCity} ${order.deliveryCity}`
              .toLocaleLowerCase('es')
              .includes(query))
        )
      }),
    [search, state.orders],
  )
  const selected = orders.find((order) => order.id === selectedId) ?? orders[0]
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Viajes recibidos</PageHeaderTitle>
          <PageHeaderDescription>
            Órdenes importadas por correo y altas manuales.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <PageHeaderActions>
          <Button variant="outline" onPress={() => void refresh()} isDisabled={loading}><RefreshCw aria-hidden />Actualizar</Button>
          <Button onPress={() => setShowForm((value) => !value)}>
            {showForm ? <X aria-hidden /> : <Plus aria-hidden />}
            {showForm ? 'Cerrar formulario' : 'Nuevo viaje'}
          </Button>
        </PageHeaderActions>
      </PageHeader>
      {showForm ? (
        <ManualOrderForm
          onCreated={(orderId) => {
            setSelectedId(orderId)
            onSearchChange({ q: '', status: 'all' })
            setShowForm(false)
          }}
        />
      ) : null}
      <div className="filter-row">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 size-4"
          />
          <Input
            className="pl-9"
            value={search.q}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onSearchChange({ q: event.target.value })
            }
            placeholder="Buscar por referencia, cliente o ciudad"
          />
        </div>
        <select
          className="field-control sm:w-48"
          value={search.status}
          onChange={(event) =>
            onSearchChange({ status: event.target.value as TravelSearch['status'] })
          }
        >
          <option value="all">Todos los viajes</option>
          <option value="received">Correo recibido</option>
          <option value="pending_assignment">Por asignar</option>
          <option value="scheduled">Confirmados</option>
          <option value="in_progress">En curso</option>
        </select>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.3fr]">
        <div className="space-y-2">
          {orders.map((order) => (
            <button
              type="button"
              key={order.id}
              onClick={() => setSelectedId(order.id)}
              className={`order-row ${selected?.id === order.id ? 'order-row-active' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-left">
                  <p className="font-semibold">{order.reference}</p>
                  <p className="text-muted-foreground text-sm">{order.customer}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-4">
                <RouteSummary order={order} compact />
              </div>
              <p className="text-muted-foreground mt-3 text-left text-xs">
                {formatScheduledAt(order.scheduledAt)}
              </p>
            </button>
          ))}
        </div>
        {selected ? (
          <OrderDetailCard key={selected.id} order={selected} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">No hay viajes con estos filtros.</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ManualOrderForm({ onCreated }: { onCreated: (orderId: string) => void }) {
  const { addManual } = useOperations()
  const [values, setValues] = useState({
    customer: 'Servicios Delta',
    pickupAddress: 'Carrer de Colom, 451',
    pickupCity: 'Terrassa',
    deliveryAddress: 'Carrer de Mallorca, 214',
    deliveryCity: 'Barcelona',
    date: '2026-09-11T10:00',
    cargo: 'Material industrial embalado',
    weightKg: '240',
    amountEuros: '175',
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    const id = `manual-${Date.now()}`
    const order: PickupOrder = {
      id,
      reference: `REC-2026-${String(Date.now()).slice(-4)}`,
      customer: values.customer.trim(),
      pickupAddress: values.pickupAddress.trim(),
      pickupCity: values.pickupCity.trim(),
      deliveryAddress: values.deliveryAddress.trim(),
      deliveryCity: values.deliveryCity.trim(),
      scheduledAt: new Date(values.date).toISOString(),
      cargo: values.cargo.trim(),
      weightKg: Number(values.weightKg),
      amountCents: Math.round(Number(values.amountEuros) * 100),
      source: 'manual',
      status: 'pending_assignment',
      calendarState: 'prepared',
      emailState: 'pending',
      kabikuState: 'pending',
      receivedAt: new Date().toISOString(),
    }
    addManual(order)
    onCreated(id)
  }
  return (
    <Card>
      <CardContent className="pt-5">
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
          <Field
            label="Cliente"
            value={values.customer}
            onChange={(customer) => setValues({ ...values, customer })}
          />
          <Field
            label="Dirección de recogida"
            value={values.pickupAddress}
            onChange={(pickupAddress) => setValues({ ...values, pickupAddress })}
          />
          <Field
            label="Ciudad de recogida"
            value={values.pickupCity}
            onChange={(pickupCity) => setValues({ ...values, pickupCity })}
          />
          <Field
            label="Dirección de entrega"
            value={values.deliveryAddress}
            onChange={(deliveryAddress) => setValues({ ...values, deliveryAddress })}
          />
          <Field
            label="Ciudad de entrega"
            value={values.deliveryCity}
            onChange={(deliveryCity) => setValues({ ...values, deliveryCity })}
          />
          <Field
            label="Carga"
            value={values.cargo}
            onChange={(cargo) => setValues({ ...values, cargo })}
          />
          <Field
            label="Peso (kg)"
            type="number"
            min="1"
            value={values.weightKg}
            onChange={(weightKg) => setValues({ ...values, weightKg })}
          />
          <Field
            label="Importe (€)"
            type="number"
            min="0"
            step="0.01"
            value={values.amountEuros}
            onChange={(amountEuros) => setValues({ ...values, amountEuros })}
          />
          <div>
            <label className="field-label" htmlFor="manual-date">
              Fecha y hora
            </label>
            <input
              id="manual-date"
              className="field-control w-full"
              type="datetime-local"
              required
              value={values.date}
              onChange={(event) => setValues({ ...values, date: event.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit">Guardar y asignar recursos</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
function Field({
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
  const id = `field-${label}`
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
