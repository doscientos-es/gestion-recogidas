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
    expect(secondPage.drivers).toEqual([driver(9)])
    expect(filtered.drivers).toEqual([driver(13)])
  })

  it('orders drivers by name or prioritizes internal drivers', () => {
    const drivers = [
      { ...driver(1), name: 'Zoe Externa', isExternal: true },
      { ...driver(2), name: 'Ana Interna' },
      { ...driver(3), name: 'Mario Interno' },
    ]

    expect(paginateDrivers(drivers, '', 1, 'name_desc').drivers.map((item) => item.name)).toEqual([
      'Zoe Externa',
      'Mario Interno',
      'Ana Interna',
    ])
    expect(
      paginateDrivers(drivers, '', 1, 'internal_first').drivers.map((item) => item.name),
    ).toEqual(['Ana Interna', 'Mario Interno', 'Zoe Externa'])
  })
})
