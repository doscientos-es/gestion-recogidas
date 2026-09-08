import { describe, expect, it } from 'vitest'

import { createSeedState } from '../infrastructure/seed-state'
import type { Driver } from './types'
import {
  addDriver,
  assignOrder,
  buildCalendarContent,
  buildWhatsAppUrl,
  completeOrder,
  processInboundOrder,
  removeDriver,
  syncWithKabiku,
  updateDriver,
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

describe('driver management', () => {
  it('appends a new driver without touching the rest of the state', () => {
    const state = createSeedState()
    const newDriver: Driver = {
      id: 'driver-nuevo',
      name: 'Nuevo Conductor',
      phone: '34600000000',
      email: 'nuevo@example.test',
      initials: 'NC',
    }
    const next = addDriver(state, newDriver)
    expect(next.drivers).toHaveLength(state.drivers.length + 1)
    expect(next.drivers.at(-1)).toEqual(newDriver)
    expect(next.orders).toBe(state.orders)
  })

  it('patches only the matching driver', () => {
    const state = createSeedState()
    const next = updateDriver(state, 'driver-laura', { phone: '34600009999' })
    expect(next.drivers.find((driver) => driver.id === 'driver-laura')?.phone).toBe('34600009999')
    expect(next.drivers.find((driver) => driver.id === 'driver-marc')).toEqual(
      state.drivers.find((driver) => driver.id === 'driver-marc'),
    )
  })

  it('leaves the drivers unchanged when the id does not match', () => {
    const state = createSeedState()
    const next = updateDriver(state, 'driver-unknown', { name: 'Nadie' })
    expect(next.drivers).toEqual(state.drivers)
  })

  it('removes the driver and unassigns their orders', () => {
    const state = createSeedState()
    const next = removeDriver(state, 'driver-laura')
    expect(next.drivers.find((driver) => driver.id === 'driver-laura')).toBeUndefined()
    const previouslyAssigned = state.orders.filter((order) => order.driverId === 'driver-laura')
    expect(previouslyAssigned.length).toBeGreaterThan(0)
    for (const order of previouslyAssigned) {
      const updated = next.orders.find((item) => item.id === order.id)
      expect(updated?.driverId).toBeUndefined()
      expect(updated && 'driverId' in updated).toBe(false)
    }
  })

  it('is a no-op on orders when the driver was never assigned', () => {
    const state = createSeedState()
    const next = removeDriver(state, 'driver-marc')
    const untouched = state.orders.filter((order) => order.driverId !== 'driver-marc')
    for (const order of untouched) {
      expect(next.orders.find((item) => item.id === order.id)).toEqual(order)
    }
  })
})
