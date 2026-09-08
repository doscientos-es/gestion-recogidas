import { z } from 'zod'

const status = z.enum([
  'all',
  'received',
  'pending_assignment',
  'scheduled',
  'in_progress',
])
export type TravelSearch = { q: string; status: z.infer<typeof status> }
export const defaultTravelSearch: TravelSearch = { q: '', status: 'all' }

export function parseTravelSearch(value: unknown): TravelSearch {
  const result = z
    .object({ q: z.string().trim().max(80).catch(''), status: status.catch('all') })
    .safeParse(value)
  return result.success ? result.data : defaultTravelSearch
}
