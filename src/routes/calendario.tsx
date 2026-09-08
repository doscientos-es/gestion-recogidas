import { createFileRoute } from '@tanstack/react-router'

import { CalendarPage } from '@/features/operations'
export const Route = createFileRoute('/calendario')({ component: CalendarPage })
