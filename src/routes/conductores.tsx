import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/conductores')({
  component: lazyRouteComponent(() => import('@/features/operations/ui/drivers-page'), 'DriversPage'),
})
