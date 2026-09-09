import { describe, expect, it } from 'vitest'

import { dashboardMetrics } from './dashboard-metrics'
import type { OperationsState } from './types'

const state: OperationsState = {
  activity: [],
  drivers: [],
  orders: [
    {
      amountCents: 12000,
      calendarState: 'pending',
      customer: 'Cliente uno',
      deliveryAddress: 'Destino',
      deliveryCity: 'Barcelona',
      emailState: 'pending',
      id: 'one',
      isRead: false,
      journeys: [],
      luggage: '1 maleta',
      passengerCount: 1,
      pickupAddress: 'Origen',
      pickupCity: 'Mataró',
      receivedAt: '2026-09-08T10:00:00+02:00',
      reference: 'REC-1',
      scheduledAt: '2026-09-10T10:00:00+02:00',
      serviceType: 'Transfer privado',
      source: 'email',
      status: 'pending_assignment',
    },
    {
      amountCents: 18000,
      calendarState: 'sent',
      customer: 'Cliente dos',
      deliveryAddress: 'Destino',
      deliveryCity: 'Barcelona',
      emailState: 'sent',
      id: 'two',
      isRead: true,
      journeys: [],
      luggage: '2 maletas',
      passengerCount: 2,
      pickupAddress: 'Origen',
      pickupCity: 'Mataró',
      receivedAt: '2026-09-08T11:00:00+02:00',
      reference: 'REC-2',
      scheduledAt: '2026-09-11T10:00:00+02:00',
      serviceType: 'Traslado al aeropuerto',
      source: 'manual',
      status: 'assigned',
    },
  ],
}

describe('dashboardMetrics', () => {
  it('summarizes shared orders and groups the next service days', () => {
    const metrics = dashboardMetrics(state, new Date('2026-09-09T12:00:00'))

    expect(metrics).toMatchObject({
      assignedOrders: 1,
      estimatedAmountCents: 30000,
      newOrders: 1,
      pendingOrders: 1,
      totalOrders: 2,
    })
    expect(metrics.days.map((day) => [day.day, day.total, day.pending])).toEqual([
      ['2026-09-10', 1, 1],
      ['2026-09-11', 1, 0],
    ])
    expect(metrics.serviceBreakdown).toEqual([
      { name: 'Transfer privado', value: 1 },
      { name: 'Traslado al aeropuerto', value: 1 },
    ])
    expect(metrics.upcomingOrders.map((order) => order.id)).toEqual(['one', 'two'])
  })
})
