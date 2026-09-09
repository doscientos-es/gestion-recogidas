import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
  Button,
  IconButton,
} from '@doscientos/ui'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { CalendarDays, Car, FileText, Plus, RefreshCw, Users, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { useOperations } from '@/features/operations/application/operations-context'
import { defaultTravelSearch } from '@/features/operations/application/travel-search'

export function AppFrame({ children }: { children: ReactNode }) {
  const { clearError, error, loading, saving, refresh } = useOperations()
  const tripsSearch = useSearch({ from: '/viajes', shouldThrow: false })
  const navigate = useNavigate()
  const composing = tripsSearch?.compose ?? false
  return (
    <AppShell className="bg-muted/35 flex h-svh flex-col overflow-hidden">
      <AppShellMain className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppShellHeader className="mx-auto flex h-14 w-full max-w-[100rem] shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/viajes" search={{ ...defaultTravelSearch }} className="brand-mark">
            <span className="flex flex-col gap-0.5">
              <strong>Gestión</strong>
              <small>Automática</small>
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {loading || saving ? (
              <output className="sr-only">{loading ? 'Cargando…' : 'Guardando…'}</output>
            ) : null}
            <IconButton
              className="navbar-compact-action"
              label={loading ? 'Actualizando viajes…' : 'Actualizar viajes'}
              variant="ghost"
              onPress={() => void refresh()}
              isDisabled={loading}
            >
              <RefreshCw aria-hidden />
            </IconButton>
            <Button
              className="navbar-wide-action"
              variant="ghost"
              onPress={() => void refresh()}
              isDisabled={loading}
            >
              <RefreshCw aria-hidden />
              Actualizar
            </Button>
            <IconButton
              className="navbar-compact-action"
              label={composing ? 'Cerrar alta de viaje' : 'Nuevo viaje'}
              onPress={() =>
                void navigate({
                  to: '/viajes',
                  search: { ...(tripsSearch ?? defaultTravelSearch), compose: !composing },
                })
              }
            >
              {composing ? <X aria-hidden /> : <Plus aria-hidden />}
            </IconButton>
            <Button
              className="navbar-wide-action"
              onPress={() =>
                void navigate({
                  to: '/viajes',
                  search: { ...(tripsSearch ?? defaultTravelSearch), compose: !composing },
                })
              }
            >
              {composing ? <X aria-hidden /> : <Plus aria-hidden />}
              {composing ? 'Cerrar' : 'Nuevo viaje'}
            </Button>
            <IconButton
              className="navbar-compact-action"
              label="Calendario"
              variant="outline"
              onPress={() => void navigate({ to: '/calendario' })}
            >
              <CalendarDays aria-hidden />
            </IconButton>
            <Button
              className="navbar-wide-action"
              variant="outline"
              onPress={() => void navigate({ to: '/calendario' })}
            >
              <CalendarDays aria-hidden />
              Calendario
            </Button>
            <a
              href="https://kabiku.es"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-compact-action icon-link"
              aria-label="Abrir Facturación en Kabiku"
            >
              <FileText aria-hidden />
            </a>
            <a
              href="https://kabiku.es"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-wide-action action-link"
            >
              <FileText aria-hidden />
              Facturación
            </a>
            <a
              href="https://movildata.com"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-compact-action icon-link"
              aria-label="Abrir Vehículos en Movildata"
            >
              <Car aria-hidden />
            </a>
            <a
              href="https://movildata.com"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-wide-action action-link"
            >
              <Car aria-hidden />
              Vehículos
            </a>
            <IconButton
              className="navbar-compact-action"
              label="Gestionar conductores"
              variant="outline"
              onPress={() => void navigate({ to: '/conductores' })}
            >
              <Users aria-hidden />
            </IconButton>
            <Button
              className="navbar-wide-action"
              variant="outline"
              onPress={() => void navigate({ to: '/conductores' })}
            >
              <Users aria-hidden />
              Conductores
            </Button>
          </div>
        </AppShellHeader>
        {error ? (
          <div className="operation-alert shrink-0" role="alert">
            <span>{error}</span>
            <button type="button" onClick={clearError}>
              Cerrar
            </button>
          </div>
        ) : null}
        <AppShellContent className="mx-auto flex min-h-0 w-full max-w-[100rem] flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div
            aria-busy={loading}
            className={`flex min-h-full flex-col ${loading ? 'pointer-events-none opacity-60' : ''}`}
          >
            {children}
          </div>
        </AppShellContent>
      </AppShellMain>
    </AppShell>
  )
}
