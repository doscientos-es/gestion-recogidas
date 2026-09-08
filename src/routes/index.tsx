import { createFileRoute } from '@tanstack/react-router'

import { DashboardPage } from '@/features/operations'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})
