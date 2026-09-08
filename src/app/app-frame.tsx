import { AppShell, AppShellContent, AppShellHeader, AppShellMain, Button } from '@doscientos/ui'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Plus, RefreshCw, Users, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { defaultTravelSearch, useOperations } from '@/features/operations'

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
          <div className="flex items-center gap-3">
            {loading || saving ? (
              <span className="text-muted-foreground text-xs">
                {loading ? 'Cargando…' : 'Guardando…'}
              </span>
            ) : null}
            <Button variant="ghost" size="sm" onPress={() => void refresh()} isDisabled={loading}>
              <RefreshCw aria-hidden />
              Actualizar
            </Button>
            <Button
              size="sm"
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
            <Link
              to="/conductores"
              activeProps={{ className: 'nav-link-active' }}
              className="nav-link"
            >
              <Users aria-hidden />
              Conductores
            </Link>
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
