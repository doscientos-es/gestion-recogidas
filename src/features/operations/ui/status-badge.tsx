import { Badge } from '@doscientos/ui'
import { CircleCheck, UserRoundPlus } from 'lucide-react'

import type { OrderStatus } from '../application/types'

const labels: Record<OrderStatus, string> = {
  pending_assignment: 'Por asignar',
  assigned: 'Asignado',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const Icon = status === 'pending_assignment' ? UserRoundPlus : CircleCheck
  const variant = status === 'pending_assignment' ? 'warning' : 'success'
  return (
    <Badge variant={variant}>
      <Icon aria-hidden className="size-3" />
      {labels[status]}
    </Badge>
  )
}
