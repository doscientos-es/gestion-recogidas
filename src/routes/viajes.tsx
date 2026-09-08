import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

import { parseTravelSearch } from '@/features/operations/application/travel-search'

export const Route = createFileRoute('/viajes')({
  validateSearch: parseTravelSearch,
  component: lazyRouteComponent(() => import('@/features/operations/ui/trips-page'), 'TripsRoute'),
})
