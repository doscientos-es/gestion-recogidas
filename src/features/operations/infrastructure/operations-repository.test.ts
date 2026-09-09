import { describe, expect, it } from 'vitest'

import type { OperationsState, PickupOrder } from '../application/types'
import { mergeReceivedOrders } from './operations-repository'

function order(id: string, overrides: Partial<PickupOrder> = {}): PickupOrder {
  return {
    id,
    reference: `MONTAX-${id}`,
    customer: 'Pasajero de prueba',
    pickupAddress: 'Calle Uno',
    pickupCity: 'Barcelona',
    deliveryAddress: 'Calle Dos',
    deliveryCity: 'Sitges',
    scheduledAt: '2026-09-13T05:15:00.000Z',
    serviceType: 'Transfer privado',
    passengerCount: 2,
    luggage: '2 maletas',
    journeys: [{ origin: 'Calle Uno', destination: 'Calle Dos' }],
    amountCents: 10000,
    source: 'email',
    status: 'pending_assignment',
    calendarState: 'pending',
    emailState: 'pending',
    receivedAt: '2026-09-09T10:00:00.000Z',
    ...overrides,
  }
}

describe('mergeReceivedOrders', () => {
  it('adds newly received emails and registers their shared activity', () => {
    const state: OperationsState = { orders: [order('existing')], drivers: [], activity: [] }

    const result = mergeReceivedOrders(state, [order('new')])

    expect(result.orders.map((item) => item.id)).toEqual(['new', 'existing'])
    expect(result.orders[0]).toMatchObject({ isRead: false })
    expect(result.activity[0]).toMatchObject({
      title: 'Correo recibido y analizado',
      detail: 'MONTAX-new · 2 pasajeros',
    })
  })

  it('does not overwrite an email already edited in the shared operations state', () => {
    const assigned = order('email-1', { status: 'assigned', driverId: 'driver-1' })
    const received = order('email-1', { status: 'pending_assignment' })
    const state: OperationsState = { orders: [assigned], drivers: [], activity: [] }

    const result = mergeReceivedOrders(state, [received])

    expect(result).toBe(state)
    expect(result.orders[0]?.status).toBe('assigned')
  })
})
