// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CalendarPage } from './calendar-page'

vi.mock('../application/operations-context', () => ({
  useOperations: () => ({
    state: {
      activity: [],
      drivers: [
        {
          email: 'maria@example.com',
          id: 'driver-maria',
          initials: 'MG',
          isExternal: false,
          name: 'María García',
          phone: '600000000',
        },
      ],
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
        {
          amountCents: 30000,
          calendarState: 'sent',
          customer: 'Marta López',
          deliveryAddress: 'Barcelona',
          deliveryCity: 'Barcelona',
          driverId: 'driver-maria',
          emailState: 'prepared',
          id: 'assigned-1',
          journeys: [{ destination: 'Barcelona', origin: 'Girona' }],
          luggage: '1 maleta',
          passengerCount: 1,
          pickupAddress: 'Girona',
          pickupCity: 'Girona',
          receivedAt: '2026-09-09T09:00:00.000Z',
          reference: 'REC-ASSIGNED',
          scheduledAt: '2026-09-12T15:00:00+02:00',
          serviceType: 'Transfer privado',
          source: 'manual',
          status: 'assigned',
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
    expect(screen.getByText('Gerard Martinez Alcocer')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Calendario' })).toBeInTheDocument()
  })

  it('filters pickups by status and carrier', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await user.selectOptions(screen.getByLabelText('Estado'), 'assigned')
    expect(screen.getByText('REC-ASSIGNED')).toBeInTheDocument()
    expect(screen.queryByText('MONTAX-12345')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Transportista'), 'driver-maria')
    expect(screen.getByText('María García')).toBeInTheDocument()
    expect(screen.getByText('1 recogidas visibles')).toBeInTheDocument()
  })

  it('moves to the next service week', async () => {
    const user = userEvent.setup()
    render(<CalendarPage />)

    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }))
    expect(screen.getByText('14–20 septiembre')).toBeInTheDocument()
    expect(screen.queryByText('MONTAX-12345')).not.toBeInTheDocument()
  })
})
