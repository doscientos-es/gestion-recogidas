import { createFileRoute } from '@tanstack/react-router'

import { VehiclesPage } from '@/features/operations'
export const Route = createFileRoute('/vehiculos')({ component: VehiclesPage })
