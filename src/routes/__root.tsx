import {
  Button,
  DataViewState,
  DataViewStateActions,
  DataViewStateDescription,
  DataViewStateTitle,
} from '@doscientos/ui'
import type { QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { AppFrame } from '@/app/app-frame'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  errorComponent: RootError,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <AppFrame>
      <Outlet />
    </AppFrame>
  )
}

function RootError({ reset }: { reset: () => void }) {
  return (
    <DataViewState aria-live="polite">
      <DataViewStateTitle>No se ha podido cargar esta pantalla</DataViewStateTitle>
      <DataViewStateDescription>
        Reintenta la operación o vuelve al listado.
      </DataViewStateDescription>
      <DataViewStateActions>
        <Button onPress={reset}>Reintentar</Button>
        <Link to="/" className="text-sm underline">
          Volver al inicio
        </Link>
      </DataViewStateActions>
    </DataViewState>
  )
}

function NotFound() {
  return (
    <DataViewState>
      <DataViewStateTitle>Página no encontrada</DataViewStateTitle>
      <DataViewStateDescription>
        La ruta solicitada no existe en esta aplicación.
      </DataViewStateDescription>
      <DataViewStateActions>
        <Link to="/" className="text-sm underline">
          Volver al inicio
        </Link>
      </DataViewStateActions>
    </DataViewState>
  )
}
