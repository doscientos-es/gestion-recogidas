// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PickupOrder } from '../application/types'
import { OrderDetailCard } from './order-detail-card'

afterEach(cleanup)

const { assign } = vi.hoisted(() => ({ assign: vi.fn(async () => {}) }))

vi.mock('../application/operations-context', () => ({
  useOperations: () => ({
    state: {
      orders: [],
      drivers: [
        {
          id: 'driver-marc',
          name: 'Marc Soler',
          phone: '34600000184',
          email: 'marc.soler@example.test',
          initials: 'MS',
          isExternal: false,
        },
        {
          id: 'driver-laura',
          name: 'Laura Vidal',
          phone: '34600000172',
          email: 'laura.vidal@example.test',
          initials: 'LV',
          isExternal: false,
        },
      ],
      activity: [],
    },
    assign,
    updateOrder: vi.fn(),
  }),
}))

const order: PickupOrder = {
  id: 'ord-1',
  reference: 'REC-1',
  customer: 'Cliente Uno',
  pickupAddress: 'Calle 1',
  pickupCity: 'Terrassa',
  deliveryAddress: 'Calle 2',
  deliveryCity: 'Barcelona',
  scheduledAt: '2026-09-10T09:00:00.000Z',
  serviceType: 'Transfer privado',
  passengerCount: 2,
  luggage: '2 maletas grandes',
  journeys: [{ origin: 'Calle 1', destination: 'Calle 2' }],
  amountCents: 10000,
  source: 'manual',
  status: 'assigned',
  driverId: 'driver-marc',
  calendarState: 'sent',
  emailState: 'sent',
  receivedAt: '2026-09-01T09:00:00.000Z',
}

describe('OrderDetailCard', () => {
  it('habilita guardar solo cuando cambia el conductor asignado', async () => {
    const user = userEvent.setup()
    const { container } = render(<OrderDetailCard order={order} />)

    const submit = screen.getByRole('button', { name: 'Guardar cambio' })
    expect(submit).toBeDisabled()

    expect(container.querySelector('[data-slot="card"]')).not.toBeInTheDocument()
    expect(container.querySelector('.lucide-arrow-down')).toHaveClass('sm:hidden')
    expect(container.querySelector('.lucide-arrow-right')).toHaveClass('sm:block')

    await user.selectOptions(screen.getByLabelText('Cambiar conductor'), 'driver-laura')
    expect(submit).toBeEnabled()
  })

  it('muestra instrucciones y desglose de un servicio con espera', () => {
    render(
      <OrderDetailCard
        order={{
          ...order,
          language: 'Catalán',
          waitHours: '2h',
          journeyAmountCents: 50000,
          waitAmountCents: 2400,
          journeys: [
            {
              origin: 'Calle 1',
              destination: 'Calle 2',
              destinationInstructions: 'Principal',
              expectedWait: '3h',
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('Idioma preferente:')).toBeInTheDocument()
    expect(screen.getByText('Destino: Principal')).toBeInTheDocument()
    expect(screen.getByText('Espera prevista: 3h')).toBeInTheDocument()
    expect(screen.getByText('Desglose del servicio')).toBeInTheDocument()
    expect(screen.getByText(/500,00/)).toBeInTheDocument()
  })
})
