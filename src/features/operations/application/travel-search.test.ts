import { describe, expect, it } from 'vitest'

import { defaultTravelSearch, parseTravelSearch } from './travel-search'

describe('parseTravelSearch', () => {
  it('normalizes valid filters', () =>
    expect(parseTravelSearch({ q: '  Mataró ', status: 'scheduled' })).toEqual({
      q: 'Mataró',
      status: 'scheduled',
    }))
  it('uses safe defaults', () =>
    expect(parseTravelSearch({ q: [], status: 'unknown' })).toEqual(defaultTravelSearch))
  it('keeps the in-progress filter used by the trips page', () =>
    expect(parseTravelSearch({ status: 'in_progress' }).status).toBe('in_progress'))
})
