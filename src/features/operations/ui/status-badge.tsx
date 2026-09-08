import { Badge } from '@doscientos/ui'
import { CircleCheck, Clock3, FileDown, Inbox, Route, UserRoundPlus } from 'lucide-react'

import type { OrderStatus } from '../application/types'

const labels: Record<OrderStatus, string> = {
  received: 'Correo recibido',
  pending_assignment: 'Por asignar',
  scheduled: 'Confirmado',
  in_progress: 'En ruta',
  completed: 'Completado',
  invoiced: 'Facturado',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const Icon =
    status === 'received'
      ? Inbox
      : status === 'pending_assignment'
        ? UserRoundPlus
        : status === 'scheduled'
          ? Clock3
          : status === 'in_progress'
            ? Route
            : status === 'invoiced' ? FileDown : CircleCheck
  const variant =
    status === 'received' || status === 'pending_assignment'
      ? 'warning'
      : status === 'completed' || status === 'invoiced'
        ? 'success'
        : 'secondary'
  return (
    <Badge variant={variant}>
      <Icon aria-hidden className="size-3" />
      {labels[status]}
    </Badge>
  )
}
