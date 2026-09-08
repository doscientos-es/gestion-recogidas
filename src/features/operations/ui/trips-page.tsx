import {
  Button,
  Card,
  CardContent,
  DetailDrawer,
  DetailDrawerBody,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Popover,
} from '@doscientos/ui'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'

import { useOperations } from '../application/operations-context'
import { defaultTravelSearch, type TravelSearch } from '../application/travel-search'
import { queryTrips, tripCities } from '../application/trip-queries'
import type { PickupOrder } from '../application/types'
import { formatScheduledAt } from '../application/workflow'
import { OrderDetailCard } from './order-detail-card'
import { StatusBadge } from './status-badge'

const statusTabs = [
  { value: 'all', label: 'Todos' },
  { value: 'pending_assignment', label: 'Por asignar' },
  { value: 'assigned', label: 'Asignados' },
] as const satisfies readonly { value: TravelSearch['status']; label: string }[]

export function TripsRoute() {
  const search = useSearch({ from: '/viajes' })
  const navigate = useNavigate()
  return (
    <TripsPage
      search={search}
      onSearchChange={(update: Partial<TravelSearch>) =>
        void navigate({
          to: '/viajes',
          search: (previous) => ({ ...defaultTravelSearch, ...previous, ...update }),
        })
      }
    />
  )
}

function buttonsOf(container: HTMLElement | null): HTMLButtonElement[] {
  return [...(container?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
}

/**
 * Grupos con tabindex móvil: el Tab entra y sale del grupo de una vez y las flechas
 * (más Inicio y Fin) recorren sus botones. Devuelve el botón al que hay que ir.
 */
function nextButton(
  container: HTMLElement | null,
  key: string,
  axis: 'vertical' | 'horizontal',
): HTMLButtonElement | undefined {
  const buttons = buttonsOf(container)
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
  if (current < 0) return undefined
  const back = axis === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
  const forward = axis === 'vertical' ? 'ArrowDown' : 'ArrowRight'
  if (key === back) return buttons[Math.max(current - 1, 0)]
  if (key === forward) return buttons[Math.min(current + 1, buttons.length - 1)]
  if (key === 'Home') return buttons[0]
  if (key === 'End') return buttons.at(-1)
  return undefined
}

export function TripsPage({
  search,
  onSearchChange,
}: {
  search: TravelSearch
  onSearchChange: (update: Partial<TravelSearch>) => void
}) {
  const { state } = useOperations()
  // El texto escrito se mantiene en un estado local y viaja a la URL con retardo:
  // así no se dispara una consulta por pulsación de tecla.
  const [queryDraft, setQueryDraft] = useState(search.q)
  useEffect(() => setQueryDraft(search.q), [search.q])
  useEffect(() => {
    if (queryDraft === search.q) return
    const timer = setTimeout(() => onSearchChange({ q: queryDraft, page: 1 }), 300)
    return () => clearTimeout(timer)
  }, [queryDraft, search.q, onSearchChange])
  const cities = useMemo(() => tripCities(state.orders), [state.orders])
  const result = useMemo(() => queryTrips(state.orders, search), [state.orders, search])
  // Los contadores por estado sustituyen a la franja de métricas: misma información, sin ocupar espacio.
  const counts = useMemo(
    () =>
      statusTabs.map((tab) => ({
        ...tab,
        count:
          tab.value === 'all'
            ? state.orders.length
            : state.orders.filter((order) => order.status === tab.value).length,
      })),
    [state.orders],
  )
  const orders = result.rows
  const selected = search.selected
    ? orders.find((order) => order.id === search.selected)
    : undefined
  const listRef = useRef<HTMLUListElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  // La fila enfocable con Tab es la seleccionada; si no hay ninguna, la primera de la página.
  const focusableRowId = selected?.id ?? orders[0]?.id
  // Al llegar una selección desde la URL (atrás/adelante) la fila puede quedar fuera de vista.
  useEffect(() => {
    if (!search.selected) return
    listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [search.selected])
  function handleRowKeys(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') {
      if (!search.selected) return
      event.preventDefault()
      onSearchChange({ selected: '' })
      return
    }
    const target = nextButton(listRef.current, event.key, 'vertical')
    if (!target) return
    event.preventDefault()
    target.focus()
    target.click()
  }
  function handleTabKeys(event: KeyboardEvent<HTMLButtonElement>) {
    const target = nextButton(tabsRef.current, event.key, 'horizontal')
    if (!target) return
    event.preventDefault()
    target.focus()
    target.click()
  }
  // Desde el buscador la flecha abajo entra en la lista sin cambiar todavía la selección.
  function handleSearchKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowDown') return
    const rows = buttonsOf(listRef.current)
    const target = rows.find((row) => row.tabIndex === 0) ?? rows[0]
    if (!target) return
    event.preventDefault()
    target.focus()
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {search.compose ? (
        <div className="shrink-0">
          <ManualOrderForm
            onCreated={(orderId) =>
              onSearchChange({ ...defaultTravelSearch, selected: orderId, compose: false })
            }
          />
        </div>
      ) : null}
      <div className="inbox-grid">
        <section className="inbox-list" aria-label="Listado de viajes">
          <div className="inbox-toolbar">
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Search aria-hidden className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Buscar viajes"
                value={queryDraft}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setQueryDraft(event.target.value)
                }
                onKeyDown={handleSearchKeys}
                placeholder="Buscar por referencia, cliente o ciudad"
              />
              <InputGroupAddon align="inline-end">
                <Popover
                  placement="bottom end"
                  trigger={
                    <Button
                      aria-label="Mostrar filtros"
                      className="inbox-filter-trigger"
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <SlidersHorizontal aria-hidden />
                    </Button>
                  }
                >
                  <div className="inbox-filters" aria-label="Filtros avanzados">
                    <div>
                      <label className="field-label" htmlFor="trip-source">
                        Procedencia
                      </label>
                      <select
                        id="trip-source"
                        className="field-control"
                        value={search.source}
                        onChange={(event) =>
                          onSearchChange({
                            source: event.target.value as TravelSearch['source'],
                            page: 1,
                            selected: '',
                          })
                        }
                      >
                        <option value="all">Toda procedencia</option>
                        <option value="email">Importados por correo</option>
                        <option value="manual">Alta manual</option>
                      </select>
                    </div>
                    {cities.length > 1 ? (
                      <div>
                        <label className="field-label" htmlFor="trip-city">
                          Recogida
                        </label>
                        <select
                          id="trip-city"
                          className="field-control"
                          value={search.city}
                          onChange={(event) =>
                            onSearchChange({ city: event.target.value, page: 1, selected: '' })
                          }
                        >
                          <option value="">Todas las recogidas</option>
                          {cities.map((city) => (
                            <option key={city} value={city}>
                              Recogida en {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div>
                      <label className="field-label" htmlFor="trip-sort">
                        Ordenar por
                      </label>
                      <select
                        id="trip-sort"
                        className="field-control"
                        value={search.sort}
                        onChange={(event) =>
                          onSearchChange({ sort: event.target.value as TravelSearch['sort'] })
                        }
                      >
                        <option value="scheduled_asc">Recogida próxima</option>
                        <option value="scheduled_desc">Recogida tardía</option>
                        <option value="amount_desc">Importe mayor</option>
                        <option value="amount_asc">Importe menor</option>
                        <option value="reference_asc">Referencia</option>
                      </select>
                    </div>
                  </div>
                </Popover>
              </InputGroupAddon>
            </InputGroup>
            <div ref={tabsRef} className="inbox-tabs" role="tablist" aria-label="Estado del viaje">
              {counts.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  tabIndex={search.status === tab.value ? 0 : -1}
                  aria-selected={search.status === tab.value}
                  className={`inbox-tab ${search.status === tab.value ? 'inbox-tab-active' : ''}`}
                  onClick={() => onSearchChange({ status: tab.value, page: 1, selected: '' })}
                  onKeyDown={handleTabKeys}
                >
                  {tab.label}
                  <span className="inbox-tab-count">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>
          {result.total === 0 ? (
            <p className="text-muted-foreground flex-1 py-8 text-center text-sm">
              No hay viajes con estos filtros.
            </p>
          ) : (
            <ul ref={listRef} className="inbox-rows">
              {orders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    tabIndex={focusableRowId === order.id ? 0 : -1}
                    onClick={() => onSearchChange({ selected: order.id })}
                    onKeyDown={handleRowKeys}
                    aria-current={selected?.id === order.id}
                    aria-haspopup="dialog"
                    aria-expanded={selected?.id === order.id}
                    className={`inbox-row ${selected?.id === order.id ? 'inbox-row-active' : ''}`}
                  >
                    <span className="inbox-row-top">
                      <strong>{order.customer}</strong>
                      <StatusBadge status={order.status} />
                    </span>
                    <span className="inbox-row-meta">
                      <span className="inbox-row-route">
                        {order.pickupCity} → {order.deliveryCity}
                      </span>
                      <small>{formatScheduledAt(order.scheduledAt)}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            onPageChange={(page) => onSearchChange({ page, selected: '' })}
          />
        </section>
      </div>
      {selected ? (
        <DetailDrawer
          isOpen
          side="bottom"
          className="trip-detail-drawer"
          dialogProps={{ 'aria-label': 'Detalle del viaje' }}
          onOpenChange={(isOpen) => {
            if (!isOpen) onSearchChange({ selected: '' })
          }}
        >
          <DetailDrawerBody className="py-4">
            <OrderDetailCard key={selected.id} order={selected} />
          </DetailDrawerBody>
        </DetailDrawer>
      ) : null}
    </div>
  )
}

function Pagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
}) {
  // Ventana deslizante: muestra siempre hasta 5 páginas con la actual centrada.
  const pages = useMemo(() => {
    const window = 2
    const start = Math.max(1, Math.min(page - window, pageCount - window * 2))
    const end = Math.min(pageCount, start + window * 2)
    const items: (number | 'ellipsis')[] = []
    for (let index = start; index <= end; index += 1) {
      items.push(index)
      if (index === start && start > 1) items.unshift('ellipsis')
      if (index === end && end < pageCount) items.push('ellipsis')
    }
    if (!items.includes(1) && pageCount > 0) items.unshift(1, 'ellipsis')
    if (!items.includes(pageCount) && pageCount > 0) items.push('ellipsis', pageCount)
    return [...new Set(items)].filter(
      (item, index, list) => !(item === 'ellipsis' && list[index - 1] === 'ellipsis'),
    )
  }, [page, pageCount])
  return (
    <nav className="pagination-bar" aria-label="Paginación de viajes">
      <p className="text-muted-foreground text-sm">
        {total} {total === 1 ? 'viaje' : 'viajes'} · página {page} de {pageCount}
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        {pages.map((item) =>
          item === 'ellipsis' ? (
            <span key="ellipsis" className="pagination-ellipsis" aria-hidden>
              …
            </span>
          ) : (
            <button
              type="button"
              key={item}
              className={`pagination-button ${item === page ? 'pagination-active' : ''}`}
              onClick={() => onPageChange(item)}
              disabled={item === page}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          className="pagination-button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Página siguiente"
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
    </nav>
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
