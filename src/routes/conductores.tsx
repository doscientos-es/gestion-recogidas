import { createFileRoute } from '@tanstack/react-router'

import { DriversPage } from '@/features/operations'
export const Route = createFileRoute('/conductores')({ component: DriversPage })
