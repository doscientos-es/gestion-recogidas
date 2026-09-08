import { TRIPS_PAGE_SIZE, type TravelSearch } from './travel-search'
import type { PickupOrder } from './types'

export interface TripQueryResult {
  rows: PickupOrder[]
  total: number
  page: number
  pageCount: number
}

const collator = new Intl.Collator('es')

/**
 * Consulta con la misma forma que devolvería un endpoint paginado
 * (filas + total + página actual), de modo que mover los filtros a un
 * backend real sea un cambio de adaptador, no de interfaz.
 */
export function queryTrips(orders: PickupOrder[], search: TravelSearch): TripQueryResult {
  const query = search.q.toLocaleLowerCase('es')
  const filtered = orders.filter((order) => {
    if (search.status !== 'all' && order.status !== search.status) return false
    if (search.source !== 'all' && order.source !== search.source) return false
    if (search.city && order.pickupCity !== search.city) return false
    if (
      query &&
      !`${order.reference} ${order.customer} ${order.pickupCity} ${order.deliveryCity}`
        .toLocaleLowerCase('es')
        .includes(query)
    )
      return false
    return true
  })
  const sorted = [...filtered].sort(comparator(search.sort))
  const pageCount = Math.max(1, Math.ceil(sorted.length / TRIPS_PAGE_SIZE))
  const page = Math.min(Math.max(search.page, 1), pageCount)
  const start = (page - 1) * TRIPS_PAGE_SIZE
  return {
    rows: sorted.slice(start, start + TRIPS_PAGE_SIZE),
    total: sorted.length,
    page,
    pageCount,
  }
}

export function tripCities(orders: PickupOrder[]): string[] {
  return [...new Set(orders.map((order) => order.pickupCity).filter(Boolean))].sort(
    collator.compare,
  )
}

function comparator(sort: TravelSearch['sort']): (left: PickupOrder, right: PickupOrder) => number {
  switch (sort) {
    case 'scheduled_desc':
      return (left, right) => right.scheduledAt.localeCompare(left.scheduledAt)
    case 'amount_desc':
      return (left, right) => right.amountCents - left.amountCents
    case 'amount_asc':
      return (left, right) => left.amountCents - right.amountCents
    case 'reference_asc':
      return (left, right) => collator.compare(left.reference, right.reference)
    default:
      return (left, right) => left.scheduledAt.localeCompare(right.scheduledAt)
  }
}
