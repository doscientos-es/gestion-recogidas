import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
} from '@doscientos/ui'
import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Route, Users } from 'lucide-react'
import type { ReactNode } from 'react'

import { useOperations } from '@/features/operations'

export function AppFrame({ children }: { children: ReactNode }) {
  const { clearError, error, loading, mode, saving } = useOperations()
  const items = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/viajes', label: 'Viajes recibidos', icon: Route },
    { to: '/conductores', label: 'Conductores', icon: Users },
  ] as const
  return (
    <AppShell className="bg-muted/35 flex min-h-svh">
      <AppShellSidebar className="sidebar hidden p-4 md:block">
        <Link to="/" className="brand-mark">
          <span>GR</span>
          <span>
            <strong>Gestión</strong>
            <small>de recogidas</small>
          </span>
        </Link>
        <nav aria-label="Principal" className="mt-8">
          <div className="space-y-1">
            {items.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === '/' }}
                activeProps={{ className: 'nav-link-active' }}
                className="nav-link"
              >
                <Icon aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <span className="status-pulse" />
          <div>
            <strong>Automatizaciones activas</strong>
            <small>Última revisión: ahora</small>
          </div>
        </div>
      </AppShellSidebar>
      <AppShellMain className="min-w-0 flex-1">
        <AppShellHeader className="flex h-14 items-center justify-between">
          <span className="text-sm font-semibold md:hidden">Gestión de recogidas</span>
          <nav aria-label="Navegación móvil" className="mobile-nav md:hidden">
            {items.map(({ to, label }) => (
              <Link key={to} to={to} activeProps={{ className: 'mobile-nav-active' }}>
                {label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto hidden items-center gap-2 text-xs md:flex">
            <span className="status-pulse" />
            {loading
              ? 'Cargando operaciones…'
              : saving
                ? 'Guardando cambios…'
                : mode === 'supabase'
                  ? 'Supabase conectado'
                  : 'Demo segura'}
          </span>
        </AppShellHeader>
        {error ? (
          <div className="operation-alert" role="alert">
            <span>{error}</span>
            <button type="button" onClick={clearError}>
              Cerrar
            </button>
          </div>
        ) : null}
        <AppShellContent className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
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
