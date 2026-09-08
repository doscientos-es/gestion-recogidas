import { AppShell, AppShellContent, AppShellHeader, AppShellMain } from '@doscientos/ui'
import { Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import type { ReactNode } from 'react'

import { defaultTravelSearch, useOperations } from '@/features/operations'

export function AppFrame({ children }: { children: ReactNode }) {
  const { clearError, error, loading, saving } = useOperations()
  return (
    <AppShell className="bg-muted/35 min-h-svh">
      <AppShellMain className="min-w-0 flex-1">
        <AppShellHeader className="mx-auto flex h-14 w-full max-w-[100rem] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/viajes" search={{ ...defaultTravelSearch }} className="brand-mark">
            <span>GR</span>
            <span>
              <strong>Gestión</strong>
              <small>de recogidas</small>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {loading || saving ? (
              <span className="text-muted-foreground text-xs">
                {loading ? 'Cargando…' : 'Guardando…'}
              </span>
            ) : null}
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
          <div className="operation-alert" role="alert">
            <span>{error}</span>
            <button type="button" onClick={clearError}>
              Cerrar
            </button>
          </div>
        ) : null}
        <AppShellContent className="mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">
          <div
            aria-busy={loading}
            className={loading ? 'pointer-events-none opacity-60' : undefined}
          >
            {children}
          </div>
        </AppShellContent>
      </AppShellMain>
    </AppShell>
  )
}
