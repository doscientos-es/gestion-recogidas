import { ArrowDown, ArrowRight, MapPin } from 'lucide-react'

import type { PickupOrder } from '../application/types'

export function RouteSummary({
  order,
  compact = false,
}: {
  order: PickupOrder
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? 'flex items-center gap-2 text-sm'
          : 'grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center'
      }
    >
      <Location
        label="Recogida"
        address={order.pickupAddress}
        city={order.pickupCity}
        compact={compact}
      />
      <ArrowDown aria-hidden className="text-muted-foreground size-4 shrink-0 sm:hidden" />
      <ArrowRight aria-hidden className="text-muted-foreground hidden size-4 shrink-0 sm:block" />
      <Location
        label="Entrega"
        address={order.deliveryAddress}
        city={order.deliveryCity}
        compact={compact}
      />
    </div>
  )
}

function Location({
  label,
  address,
  city,
  compact,
}: {
  label: string
  address: string
  city: string
  compact: boolean
}) {
  if (compact) return <span className="truncate">{city}</span>
  return (
    <div className="flex gap-3">
      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
        <MapPin aria-hidden className="size-4" />
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <p className="font-medium">{address}</p>
        <p className="text-muted-foreground text-sm">{city}</p>
      </div>
    </div>
  )
}
