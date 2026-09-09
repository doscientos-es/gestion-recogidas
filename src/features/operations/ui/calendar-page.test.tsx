// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CalendarPage } from './calendar-page'

vi.mock('../application/operations-context', () => ({
  useOperations: () => ({
    state: {
      activity: [],
      drivers: [],
      orders: [
        {
          amountCents: 52400,
          calendarState: 'pending',
          customer: 'Gerard Martinez Alcocer',
          deliveryAddress: 'Castellón',
          deliveryCity: '',
          emailState: 'pending',
          id: 'montax-12345',
          journeys: [{ destination: 'Castellón', origin: 'Can Pou 12' }],
          luggage: '2 maletas',
          passengerCount: 2,
          pickupAddress: 'Can Pou 12',
          pickupCity: '',
          receivedAt: '2026-09-09T09:00:00.000Z',
          reference: 'MONTAX-12345',
          scheduledAt: '2026-09-12T14:00:00+02:00',
          serviceType: 'Servicio con espera y vuelta',
          source: 'email',
          status: 'pending_assignment',
        },
      ],
    },
  }),
}))

afterEach(cleanup)

describe('CalendarPage', () => {
  it('shows a complete service week based on imported trips', () => {
    render(<CalendarPage />)

    expect(screen.getByText('7–13 septiembre')).toBeInTheDocument()
    expect(screen.getByText('MONTAX-12345')).toBeInTheDocument()
    expect(screen.getByText('Servicio con espera y vuelta')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Calendario' })).toBeInTheDocument()
  })
})
