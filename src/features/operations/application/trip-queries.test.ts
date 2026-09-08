import { describe, expect, it } from 'vitest'

import { TRIPS_PAGE_SIZE, defaultTravelSearch, type TravelSearch } from './travel-search'
import { queryTrips, tripCities } from './trip-queries'
import type { PickupOrder } from './types'

function build(
  overrides: Partial<PickupOrder> & Pick<PickupOrder, 'id' | 'reference' | 'scheduledAt'>,
): PickupOrder {
  return {
    customer: 'Cliente',
    pickupCity: 'Barcelona',
    deliveryCity: 'Girona',
    pickupAddress: 'a',
    deliveryAddress: 'b',
    cargo: 'c',
    weightKg: 1,
    amountCents: 1000,
    source: 'email',
    status: 'pending_assignment',
    calendarState: 'pending',
    emailState: 'pending',
    receivedAt: '2026-09-01T08:00:00+02:00',
    ...overrides,
  }
}

describe('trip queries', () => {
  const orders = [
    build({
      id: '1',
      reference: 'REC-2026-0003',
      scheduledAt: '2026-09-10T09:00:00+02:00',
      amountCents: 3000,
      status: 'assigned',
      source: 'manual',
      pickupCity: 'Mataró',
    }),
    build({
      id: '2',
      reference: 'REC-2026-0001',
      scheduledAt: '2026-09-08T09:00:00+02:00',
      amountCents: 1000,
    }),
    build({
      id: '3',
      reference: 'REC-2026-0002',
      scheduledAt: '2026-09-09T09:00:00+02:00',
      amountCents: 2000,
      status: 'assigned',
      pickupCity: 'Sabadell',
      customer: 'Mareas',
    }),
  ]

  it('combines status, origin, city and text filters', () => {
    const search: TravelSearch = {
      ...defaultTravelSearch,
      status: 'assigned',
      source: 'email',
      city: 'Sabadell',
      q: 'mareas',
    }
    const result = queryTrips(orders, search)
    expect(result.rows.map((order) => order.id)).toEqual(['3'])
    expect(result.total).toBe(1)
  })

  it('sorts by schedule, amount and reference', () => {
    expect(queryTrips(orders, defaultTravelSearch).rows.map((order) => order.id)).toEqual([
      '2',
      '3',
      '1',
    ])
    expect(
      queryTrips(orders, { ...defaultTravelSearch, sort: 'amount_desc' }).rows.map(
        (order) => order.id,
      ),
    ).toEqual(['1', '3', '2'])
    expect(
      queryTrips(orders, { ...defaultTravelSearch, sort: 'reference_asc' }).rows.map(
        (order) => order.id,
      ),
    ).toEqual(['2', '3', '1'])
  })

  it('paginates and clamps out-of-range pages', () => {
    const many = Array.from({ length: TRIPS_PAGE_SIZE * 2 + 4 }, (_, index) =>
      build({
        id: `ord-${index}`,
        reference: `REC-2026-${String(index).padStart(4, '0')}`,
        scheduledAt: `2026-09-10T${String(index % 24).padStart(2, '0')}:00:00+02:00`,
      }),
    )
    const first = queryTrips(many, defaultTravelSearch)
    expect(first.pageCount).toBe(3)
    expect(first.rows).toHaveLength(TRIPS_PAGE_SIZE)
    expect(queryTrips(many, { ...defaultTravelSearch, page: 3 }).rows).toHaveLength(4)
    expect(queryTrips(many, { ...defaultTravelSearch, page: 9 }).page).toBe(3)
  })

  it('lists pickup cities sorted and without duplicates', () => {
    expect(tripCities(orders)).toEqual(['Barcelona', 'Mataró', 'Sabadell'])
  })
})
