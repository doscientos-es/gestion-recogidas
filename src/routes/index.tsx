import { createFileRoute, redirect } from '@tanstack/react-router'

import { defaultTravelSearch } from '@/features/operations/application/travel-search'

// La bandeja de viajes es la única pantalla de trabajo: la portada entra directa.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/viajes', search: { ...defaultTravelSearch } })
  },
})
