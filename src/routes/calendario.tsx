import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/calendario')({
  component: lazyRouteComponent(() => import('@/features/operations/ui/calendar-page'), 'CalendarPage'),
})
