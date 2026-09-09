import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
  AppShellMobileHeader,
  AppShellSidebar,
  Button,
  Drawer,
  IconButton,
} from '@doscientos/ui'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  CalendarDays,
  Car,
  FileText,
  LayoutDashboard,
  Menu,
  Plane,
  Plus,
  RefreshCw,
  Users,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { useOperations } from '@/features/operations/application/operations-context'
import { defaultTravelSearch } from '@/features/operations/application/travel-search'

function BrandMark({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link to="/dashboard" className="brand-mark" onClick={onNavigate}>
      <span className="flex flex-col gap-0.5">
        <strong>Gestión</strong>
        <small>Automática</small>
      </span>
    </Link>
  )
}

function PrimaryNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <p className="app-navigation-section-label">Operativa</p>
      <Link
        to="/dashboard"
        activeOptions={{ exact: true }}
        activeProps={{ className: 'app-navigation-link app-navigation-link-active' }}
        className="app-navigation-link"
        onClick={onNavigate}
      >
        <LayoutDashboard aria-hidden />
        Resumen
      </Link>
      <Link
        to="/viajes"
        search={{ ...defaultTravelSearch }}
        activeOptions={{ exact: true }}
        activeProps={{ className: 'app-navigation-link app-navigation-link-active' }}
        className="app-navigation-link"
        onClick={onNavigate}
      >
        <Plane aria-hidden />
        Viajes
      </Link>
      <Link
        to="/calendario"
        activeOptions={{ exact: true }}
        activeProps={{ className: 'app-navigation-link app-navigation-link-active' }}
        className="app-navigation-link"
        onClick={onNavigate}
      >
        <CalendarDays aria-hidden />
        Calendario
      </Link>
      <Link
        to="/conductores"
        activeOptions={{ exact: true }}
        activeProps={{ className: 'app-navigation-link app-navigation-link-active' }}
        className="app-navigation-link"
        onClick={onNavigate}
      >
        <Users aria-hidden />
        Conductores
      </Link>
      <div className="app-navigation-divider" />
      <p className="app-navigation-section-label">Herramientas</p>
      <a
        href="https://kabiku.es"
        target="_blank"
        rel="noopener noreferrer"
        className="app-navigation-link"
        onClick={onNavigate}
      >
        <FileText aria-hidden />
        Facturación
      </a>
      <a
        href="https://movildata.com"
        target="_blank"
        rel="noopener noreferrer"
        className="app-navigation-link"
        onClick={onNavigate}
      >
        <Car aria-hidden />
        Vehículos
      </a>
    </>
  )
}

export function AppFrame({ children }: { children: ReactNode }) {
  const { clearError, error, loading, saving, refresh } = useOperations()
  const tripsSearch = useSearch({ from: '/viajes', shouldThrow: false })
  const navigate = useNavigate()
  const [navigationOpen, setNavigationOpen] = useState(false)
  const composing = tripsSearch?.compose ?? false
  const toggleCompose = () =>
    void navigate({
      to: '/viajes',
      search: { ...(tripsSearch ?? defaultTravelSearch), compose: !composing },
    })
  return (
    <AppShell sidebarBreakpoint="lg" className="bg-muted/35 h-svh overflow-hidden">
      <AppShellSidebar aria-label="Navegación de escritorio">
        <div className="app-sidebar-header">
          <BrandMark />
        </div>
        <nav aria-label="Navegación principal" className="app-sidebar-navigation">
          <PrimaryNavigation />
        </nav>
        <div className="app-sidebar-footer">
          <span className="text-muted-foreground px-2 text-xs">Gestión de servicios</span>
        </div>
      </AppShellSidebar>
      <AppShellMain>
        <AppShellMobileHeader className="justify-between">
          <button
            type="button"
            className="mobile-menu-trigger"
            aria-label="Abrir menú"
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen(true)}
          >
            <Menu aria-hidden />
          </button>
          <Drawer
            isOpen={navigationOpen}
            onOpenChange={setNavigationOpen}
            side="left"
            className="w-72! max-w-[85vw]!"
            showCloseButton={false}
            dialogProps={{ 'aria-label': 'Navegación principal' }}
          >
            <div className="flex h-full flex-col">
              <div className="border-border flex items-center justify-between border-b px-5 py-5">
                <BrandMark onNavigate={() => setNavigationOpen(false)} />
                <button
                  type="button"
                  className="mobile-menu-trigger"
                  aria-label="Cerrar menú"
                  onClick={() => setNavigationOpen(false)}
                >
                  <X aria-hidden />
                </button>
              </div>
              <nav
                aria-label="Navegación principal"
                className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
              >
                <PrimaryNavigation onNavigate={() => setNavigationOpen(false)} />
              </nav>
            </div>
          </Drawer>
          <BrandMark />
          <div className="flex items-center gap-1.5">
            <IconButton
              label={loading ? 'Actualizando viajes…' : 'Actualizar viajes'}
              variant="ghost"
              onPress={() => void refresh()}
              isDisabled={loading}
            >
              <RefreshCw aria-hidden />
            </IconButton>
            <IconButton
              label={composing ? 'Cerrar alta de viaje' : 'Nuevo viaje'}
              onPress={toggleCompose}
            >
              {composing ? <X aria-hidden /> : <Plus aria-hidden />}
            </IconButton>
          </div>
        </AppShellMobileHeader>
        <AppShellHeader className="desktop-app-header h-14 shrink-0 justify-between px-6 lg:px-8">
          <span className="text-muted-foreground text-sm font-medium">Operativa</span>
          <div className="flex items-center gap-2">
            {loading || saving ? (
              <output className="sr-only">{loading ? 'Cargando…' : 'Guardando…'}</output>
            ) : null}
            <Button variant="ghost" onPress={() => void refresh()} isDisabled={loading}>
              <RefreshCw aria-hidden />
              Actualizar
            </Button>
            <Button onPress={toggleCompose}>
              {composing ? <X aria-hidden /> : <Plus aria-hidden />}
              {composing ? 'Cerrar' : 'Nuevo viaje'}
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
