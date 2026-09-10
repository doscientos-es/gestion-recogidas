import { describe, expect, it } from 'vitest'

import { defaultTravelSearch, parseTravelSearch } from './travel-search'

describe('parseTravelSearch', () => {
  it('normalizes valid filters', () =>
    expect(
      parseTravelSearch({
        q: '  Mataró ',
        status: 'assigned',
        source: 'email',
        city: ' Mataró ',
        from: '2026-09-01',
        to: '2026-09-30',
        sort: 'amount_desc',
        page: '2',
        selected: ' ord-1 ',
        compose: true,
      }),
    ).toEqual({
      q: 'Mataró',
      status: 'assigned',
      source: 'email',
      city: 'Mataró',
      from: '2026-09-01',
      to: '2026-09-30',
      sort: 'amount_desc',
      page: 2,
      selected: 'ord-1',
      compose: true,
    }))
  it('uses safe defaults', () =>
    expect(parseTravelSearch({ q: [], status: 'unknown' })).toEqual(defaultTravelSearch))
  it('keeps the assigned filter used by the trips page', () =>
    expect(parseTravelSearch({ status: 'assigned' }).status).toBe('assigned'))
  it('clamps invalid page values to the first page', () =>
    expect(parseTravelSearch({ page: 0 }).page).toBe(1))
  it('ignores an invalid selected trip', () =>
    expect(parseTravelSearch({ selected: 42 }).selected).toBe(''))
  it('defaults an invalid compose flag to closed', () =>
    expect(parseTravelSearch({ compose: 'yes' }).compose).toBe(false))
  it('ignores malformed calendar dates', () =>
    expect(parseTravelSearch({ from: '2026-02-30', to: '09/30/2026' })).toMatchObject({
      from: '',
      to: '',
    }))
})
