import { createFileRoute } from '@tanstack/react-router'

import { BillingPage } from '@/features/operations'
export const Route = createFileRoute('/facturacion')({ component: BillingPage })
