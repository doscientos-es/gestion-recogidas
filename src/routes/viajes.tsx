import { createFileRoute } from '@tanstack/react-router'

import { parseTravelSearch, TripsPage, type TravelSearch } from '@/features/operations'

export const Route = createFileRoute('/viajes')({
  validateSearch: parseTravelSearch,
  component: TripsRoute,
})
function TripsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <TripsPage
      search={search}
      onSearchChange={(update: Partial<TravelSearch>) =>
        void navigate({ search: (previous) => ({ ...previous, ...update }) })
      }
    />
  )
}
