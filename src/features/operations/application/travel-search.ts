import { z } from 'zod'

const status = z.enum(['all', 'new', 'pending_assignment', 'assigned'])
const source = z.enum(['all', 'email', 'manual'])
const sort = z.enum([
  'scheduled_asc',
  'scheduled_desc',
  'amount_desc',
  'amount_asc',
  'reference_asc',
])

const date = z.string().trim().refine(isCalendarDate)

export type TravelSearch = {
  q: string
  status: z.infer<typeof status>
  source: z.infer<typeof source>
  city: string
  /** Fecha de recogida inicial, en formato AAAA-MM-DD. */
  from: string
  /** Fecha de recogida final, en formato AAAA-MM-DD. */
  to: string
  sort: z.infer<typeof sort>
  page: number
  /** Viaje abierto en el panel de detalle. Vacío significa «ningún viaje seleccionado». */
  selected: string
  /** Formulario de alta manual abierto desde la navbar. */
  compose: boolean
}

export const defaultTravelSearch: TravelSearch = {
  q: '',
  status: 'all',
  source: 'all',
  city: '',
  from: '',
  to: '',
  sort: 'scheduled_asc',
  page: 1,
  selected: '',
  compose: false,
}

/** Viajes mostrados por página en la lista de la ruta /viajes. */
export const TRIPS_PAGE_SIZE = 8

export function parseTravelSearch(value: unknown): TravelSearch {
  const result = z
    .object({
      q: z.string().trim().max(80).catch(''),
      status: status.catch('all'),
      source: source.catch('all'),
      city: z.string().trim().max(80).catch(''),
      from: date.catch(''),
      to: date.catch(''),
      sort: sort.catch('scheduled_asc'),
      page: z.coerce.number().int().min(1).catch(1),
      selected: z.string().trim().max(80).catch(''),
      compose: z.boolean().catch(false),
    })
    .safeParse(value)
  return result.success ? result.data : defaultTravelSearch
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}
