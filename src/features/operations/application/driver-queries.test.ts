import { describe, expect, it } from 'vitest'

import { DRIVER_PAGE_SIZE, paginateDrivers } from './driver-queries'
import type { Driver } from './types'

function driver(index: number): Driver {
  return {
    id: `driver-${index}`,
    name: `Conductor ${index}`,
    phone: `34600000${String(index).padStart(3, '0')}`,
    email: `driver-${index}@example.test`,
    initials: `C${index}`,
    isExternal: false,
  }
}

describe('paginateDrivers', () => {
  it('filters drivers and returns the requested page', () => {
    const drivers = Array.from({ length: DRIVER_PAGE_SIZE + 1 }, (_, index) => driver(index + 1))

    const secondPage = paginateDrivers(drivers, '', 2)
    const filtered = paginateDrivers(drivers, 'conductor 13', 1)

    expect(secondPage).toMatchObject({ page: 2, pageCount: 2, total: DRIVER_PAGE_SIZE + 1 })
    expect(secondPage.drivers).toEqual([driver(DRIVER_PAGE_SIZE + 1)])
    expect(filtered.drivers).toEqual([driver(13)])
  })
})
