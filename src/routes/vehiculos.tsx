import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/vehiculos')({
  component: lazyRouteComponent(() => import('@/features/operations/ui/vehicles-page'), 'VehiclesPage'),
})
