import { describe, expect, it } from 'vitest'

import { defaultTravelSearch, parseTravelSearch } from './travel-search'

describe('parseTravelSearch', () => {
  it('normalizes valid filters', () =>
    expect(
      parseTravelSearch({
        q: '  Mataró ',
        status: 'scheduled',
        source: 'email',
        city: ' Mataró ',
        sort: 'amount_desc',
        page: '2',
        selected: ' ord-1 ',
        compose: true,
      }),
    ).toEqual({
      q: 'Mataró',
      status: 'scheduled',
      source: 'email',
      city: 'Mataró',
      sort: 'amount_desc',
      page: 2,
      selected: 'ord-1',
      compose: true,
    }))
  it('uses safe defaults', () =>
    expect(parseTravelSearch({ q: [], status: 'unknown' })).toEqual(defaultTravelSearch))
  it('keeps the in-progress filter used by the trips page', () =>
    expect(parseTravelSearch({ status: 'in_progress' }).status).toBe('in_progress'))
  it('clamps invalid page values to the first page', () =>
    expect(parseTravelSearch({ page: 0 }).page).toBe(1))
  it('ignores an invalid selected trip', () =>
    expect(parseTravelSearch({ selected: 42 }).selected).toBe(''))
  it('defaults an invalid compose flag to closed', () =>
    expect(parseTravelSearch({ compose: 'yes' }).compose).toBe(false))
})
