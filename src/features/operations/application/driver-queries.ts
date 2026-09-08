import type { Driver } from './types'

export const DRIVER_PAGE_SIZE = 12

export interface DriverPage {
  drivers: Driver[]
  page: number
  pageCount: number
  total: number
}

export function paginateDrivers(drivers: Driver[], search: string, requestedPage: number): DriverPage {
  const normalizedSearch = search.trim().toLocaleLowerCase('es-ES')
  const filtered = normalizedSearch
    ? drivers.filter((driver) =>
        [driver.name, driver.phone, driver.email].some((value) =>
          value.toLocaleLowerCase('es-ES').includes(normalizedSearch),
        ),
      )
    : drivers
  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / DRIVER_PAGE_SIZE))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const start = (page - 1) * DRIVER_PAGE_SIZE

  return { drivers: filtered.slice(start, start + DRIVER_PAGE_SIZE), page, pageCount, total }
}