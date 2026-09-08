import { describe, expect, it } from 'vitest'

import { createSeedState } from '../infrastructure/seed-state'
import {
  assignOrder,
  buildCalendarContent,
  buildWhatsAppUrl,
  completeOrder,
  processInboundOrder,
  syncWithKabiku,
} from './workflow'

describe('pickup workflow', () => {
  it('moves an inbound email through assignment, completion and invoicing', () => {
    let state = processInboundOrder(createSeedState(), 'ord-260910-184')
    expect(state.orders[0]?.status).toBe('pending_assignment')
    state = assignOrder(state, 'ord-260910-184', 'driver-david', 'vehicle-sprinter')
    expect(state.orders[0]).toMatchObject({ status: 'scheduled', emailState: 'prepared' })
    expect(state.vehicles.find((vehicle) => vehicle.id === 'vehicle-sprinter')?.status).toBe(
      'on_route',
    )
    state = completeOrder(state, 'ord-260910-184')
    expect(state.vehicles.find((vehicle) => vehicle.id === 'vehicle-sprinter')?.status).toBe(
      'available',
    )
    state = syncWithKabiku(state, 'ord-260910-184')
    expect(state.orders[0]).toMatchObject({ status: 'invoiced', kabikuState: 'synced' })
  })

  it('rejects assignment with a busy vehicle or from an invalid status', () => {
    const received = createSeedState()
    const pending = processInboundOrder(received, 'ord-260910-184')
    expect(assignOrder(pending, 'ord-260910-184', 'driver-david', 'vehicle-ducato')).toBe(pending)
    const scheduled = assignOrder(pending, 'ord-260910-184', 'driver-david', 'vehicle-sprinter')
    expect(assignOrder(scheduled, 'ord-260910-184', 'driver-laura', 'vehicle-sprinter')).toBe(
      scheduled,
    )
  })

  it('builds an encoded WhatsApp Web message with both addresses', () => {
    const state = createSeedState()
    const [order] = state.orders
    const [driver] = state.drivers
    if (!order || !driver)
      throw new Error('Los datos de demo deben incluir una orden y un conductor.')
    const url = buildWhatsAppUrl(order, driver)
    expect(decodeURIComponent(url)).toContain('Carrer de la Metal·lúrgia, 38')
    expect(decodeURIComponent(url)).toContain('Avinguda de la Indústria, 17')
  })

  it('builds a valid calendar invitation for the assigned driver', () => {
    const state = createSeedState()
    const [order] = state.orders
    const [driver] = state.drivers
    if (!order || !driver)
      throw new Error('Los datos de demo deben incluir una orden y un conductor.')
    const invitation = buildCalendarContent(order, driver)
    expect(invitation).toContain('BEGIN:VCALENDAR')
    expect(invitation).toContain('DTSTART:20260910T073000Z')
    expect(invitation).toContain('Carrer de la Metal·lúrgia\\, 38')
  })
})
