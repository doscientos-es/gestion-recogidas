import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@doscientos/ui'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { loadDriversPage } from '..'
import {
  DRIVER_PAGE_SIZE,
  paginateDrivers,
  type DriverPage,
  type DriverSort,
} from '../application/driver-queries'
import { useOperations } from '../application/operations-context'
import { defaultTravelSearch } from '../application/travel-search'
import type { Driver } from '../application/types'

function initialsFor(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '??'
  )
}

export function DriversPage() {
  const { state, saving, addDriver, updateDriver, deleteDriver } = useOperations()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<DriverSort>('name_asc')
  const [page, setPage] = useState(1)
  const [driversRevision, setDriversRevision] = useState(0)
  const [remotePage, setRemotePage] = useState<{ key: string; value: DriverPage }>()
  const [remoteError, setRemoteError] = useState<string>()
  const localPage = paginateDrivers(state.drivers, search, page, sort)
  const remoteKey = `${search}\u0000${sort}\u0000${page}\u0000${driversRevision}`

  useEffect(() => {
    if (saving) return
    let active = true
    setRemoteError(undefined)
    void loadDriversPage(search, page, sort)
      .then((result) => {
        if (active) setRemotePage({ key: remoteKey, value: result })
      })
      .catch((reason: unknown) => {
        if (active)
          setRemoteError(
            reason instanceof Error
              ? reason.message
              : 'No se han podido recuperar los conductores.',
          )
      })
    return () => {
      active = false
    }
  }, [page, remoteKey, saving, search, sort])

  const driversPage = remotePage?.key === remoteKey ? remotePage.value : localPage

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchDraft)
  }

  return (
    <div className="space-y-6">
      <Link to="/viajes" search={{ ...defaultTravelSearch }} className="action-link">
        <ArrowLeft aria-hidden className="size-4" />
        Volver a inicio
      </Link>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Conductores</PageHeaderTitle>
          <PageHeaderDescription>
            Gestiona los conductores. Solo necesitamos su teléfono para avisarles por WhatsApp.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <Button
          size="sm"
          onPress={() => {
            setEditingId(undefined)
            setCreating((value) => !value)
          }}
        >
          {creating ? <X aria-hidden /> : <Plus aria-hidden />}
          {creating ? 'Cerrar' : 'Nuevo conductor'}
        </Button>
      </PageHeader>
      {creating ? (
        <DriverForm
          onSubmit={(driver) => {
            addDriver(driver)
            setDriversRevision((value) => value + 1)
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      ) : null}
      <form className="driver-search-toolbar" onSubmit={submitSearch}>
        <div className="min-w-60 flex-1">
          <label className="field-label" htmlFor="driver-search">
            Buscar conductores
          </label>
          <input
            id="driver-search"
            className="field-control w-full"
            value={searchDraft}
            placeholder="Nombre, teléfono o email"
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </div>
        <div className="min-w-48">
          <label className="field-label" htmlFor="driver-sort">
            Ordenar conductores
          </label>
          <select
            id="driver-sort"
            className="field-control w-full"
            value={sort}
            onChange={(event) => {
              setPage(1)
              setSort(event.target.value as DriverSort)
            }}
          >
            <option value="name_asc">Nombre: A–Z</option>
            <option value="name_desc">Nombre: Z–A</option>
            <option value="internal_first">De la casa primero</option>
          </select>
        </div>
        <Button type="submit" variant="outline">
          <Search aria-hidden />
          Buscar
        </Button>
      </form>
      {remoteError ? <p className="text-destructive text-sm">{remoteError}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {driversPage.drivers.map((driver) =>
          editingId === driver.id ? (
            <DriverForm
              key={driver.id}
              driver={driver}
              onSubmit={(patch) => {
                updateDriver(driver.id, patch)
                setDriversRevision((value) => value + 1)
                setEditingId(undefined)
              }}
              onCancel={() => setEditingId(undefined)}
            />
          ) : (
            <Card key={driver.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{driver.name}</CardTitle>
                    <Badge className="mt-2" variant={driver.isExternal ? 'secondary' : 'success'}>
                      {driver.isExternal ? 'Externo' : 'De la casa'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Editar ${driver.name}`}
                      onPress={() => {
                        setCreating(false)
                        setEditingId(driver.id)
                      }}
                    >
                      <Pencil aria-hidden className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Eliminar ${driver.name}`}
                      onPress={() => {
                        if (window.confirm(`¿Eliminar a ${driver.name}?`)) {
                          deleteDriver(driver.id)
                          setDriversRevision((value) => value + 1)
                        }
                      }}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <a className="flex items-center gap-2 text-sm" href={`tel:${driver.phone}`}>
                  <Phone className="size-4" />
                  {driver.phone}
                </a>
                <p className="text-muted-foreground mt-1 text-sm">{driver.email}</p>
              </CardContent>
            </Card>
          ),
        )}
      </div>
      {driversPage.total === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No hay conductores que coincidan con la búsqueda.
        </p>
      ) : (
        <DriverPagination
          page={driversPage.page}
          pageCount={driversPage.pageCount}
          total={driversPage.total}
          onChange={setPage}
        />
      )}
    </div>
  )
}

function DriverPagination({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number
  pageCount: number
  total: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null
  const pages = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => Math.max(1, Math.min(page - 2, pageCount - 4)) + index,
  )
  const firstDriver = (page - 1) * DRIVER_PAGE_SIZE + 1
  const lastDriver = Math.min(page * DRIVER_PAGE_SIZE, total)
  return (
    <nav aria-label="Paginación de conductores" className="driver-pagination">
      <div className="driver-pagination-summary">
        <strong>
          Página {page} de {pageCount}
        </strong>
        <span>
          Mostrando {firstDriver}–{lastDriver} de {total} conductores
        </span>
      </div>
      <div className="driver-pagination-controls">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Página anterior"
          onPress={() => onChange(page - 1)}
          isDisabled={page === 1}
        >
          <ChevronLeft aria-hidden />
          <span className="driver-pagination-label">Anterior</span>
        </Button>
        <div className="driver-pagination-pages" aria-label="Páginas disponibles">
          {pages.map((item) => (
            <Button
              key={item}
              type="button"
              variant="outline"
              size="sm"
              className={item === page ? 'driver-pagination-page-active' : undefined}
              aria-label={`Ir a la página ${item}`}
              {...(item === page ? { 'aria-current': 'page' as const } : {})}
              onPress={() => onChange(item)}
            >
              {item}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Página siguiente"
          onPress={() => onChange(page + 1)}
          isDisabled={page === pageCount}
        >
          <span className="driver-pagination-label">Siguiente</span>
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  )
}

function DriverForm({
  driver,
  onSubmit,
  onCancel,
}: {
  driver?: Driver
  onSubmit: (driver: Driver) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState({
    name: driver?.name ?? '',
    phone: driver?.phone ?? '',
    email: driver?.email ?? '',
    isExternal: driver?.isExternal ?? false,
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    const name = values.name.trim()
    onSubmit({
      id: driver?.id ?? `driver-${Date.now()}`,
      name,
      phone: values.phone.trim(),
      email: values.email.trim(),
      initials: initialsFor(name),
      isExternal: values.isExternal,
    })
  }
  return (
    <form className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3" onSubmit={submit}>
      <div>
        <label className="field-label" htmlFor="driver-name">
          Nombre
        </label>
        <input
          id="driver-name"
          className="field-control w-full"
          required
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="driver-phone">
          Teléfono
        </label>
        <input
          id="driver-phone"
          className="field-control w-full"
          required
          value={values.phone}
          onChange={(event) => setValues({ ...values, phone: event.target.value })}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="driver-email">
          Email
        </label>
        <input
          id="driver-email"
          type="email"
          className="field-control w-full"
          required
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="driver-type">
          Tipo de conductor
        </label>
        <select
          id="driver-type"
          className="field-control w-full"
          value={values.isExternal ? 'external' : 'internal'}
          onChange={(event) =>
            setValues({ ...values, isExternal: event.target.value === 'external' })
          }
        >
          <option value="internal">De la casa</option>
          <option value="external">Externo</option>
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-3">
        <Button type="submit">{driver ? 'Guardar cambios' : 'Añadir conductor'}</Button>
        <Button type="button" variant="outline" onPress={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
