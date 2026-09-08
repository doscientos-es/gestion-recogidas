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
import { ArrowLeft, Pencil, Phone, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { paginateDrivers, type DriverPage } from '../application/driver-queries'
import { useOperations } from '../application/operations-context'
import { defaultTravelSearch } from '../application/travel-search'
import type { Driver } from '../application/types'
import { loadDriversPage } from '../infrastructure/operations-repository'

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
  const { state, mode, saving, addDriver, updateDriver, deleteDriver } = useOperations()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [driversRevision, setDriversRevision] = useState(0)
  const [remotePage, setRemotePage] = useState<{ key: string; value: DriverPage }>()
  const [remoteError, setRemoteError] = useState<string>()
  const localPage = paginateDrivers(state.drivers, search, page)
  const remoteKey = `${search}\u0000${page}\u0000${driversRevision}`

  useEffect(() => {
    if (mode !== 'supabase') {
      setRemotePage(undefined)
      setRemoteError(undefined)
      return
    }
    if (saving) return
    let active = true
    setRemoteError(undefined)
    void loadDriversPage(search, page)
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
  }, [mode, page, remoteKey, saving, search])

  const driversPage =
    mode === 'supabase' && remotePage?.key === remoteKey ? remotePage.value : localPage

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
      <form className="flex flex-wrap items-end gap-2" onSubmit={submitSearch}>
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
          onChange={setPage}
        />
      )}
    </div>
  )
}

function DriverPagination({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null
  return (
    <nav aria-label="Paginación de conductores" className="flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        onPress={() => onChange(page - 1)}
        isDisabled={page === 1}
      >
        Anterior
      </Button>
      <span className="text-muted-foreground text-sm">
        Página {page} de {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        onPress={() => onChange(page + 1)}
        isDisabled={page === pageCount}
      >
        Siguiente
      </Button>
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
