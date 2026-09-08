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
import { ArrowLeft, Pencil, Phone, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'

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
  const { state, addDriver, updateDriver, deleteDriver } = useOperations()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string>()

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
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.drivers.map((driver) =>
          editingId === driver.id ? (
            <DriverForm
              key={driver.id}
              driver={driver}
              onSubmit={(patch) => {
                updateDriver(driver.id, patch)
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
                        if (window.confirm(`¿Eliminar a ${driver.name}?`)) deleteDriver(driver.id)
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
    </div>
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
