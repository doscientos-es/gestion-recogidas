// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { defaultTravelSearch, type TravelSearch } from '../application/travel-search'
import { TripsPage } from './trips-page'

// Vitest no expone `globals`, así que el auto-cleanup de testing-library nunca se
// registra: sin esto cada test apila su render sobre el DOM de los anteriores.
afterEach(cleanup)
// jsdom no implementa scrollIntoView; el efecto de la página lo llama al enfocar una fila.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const { orders } = vi.hoisted(() => {
  function order(overrides: Record<string, unknown>) {
    return {
      id: 'x',
      reference: 'REC-1',
      customer: 'Cliente',
      pickupAddress: 'Calle 1',
      pickupCity: 'Terrassa',
      deliveryAddress: 'Calle 2',
      deliveryCity: 'Barcelona',
      scheduledAt: '2026-09-10T09:00:00.000Z',
      cargo: 'Material',
      weightKg: 100,
      amountCents: 10000,
      source: 'manual',
      status: 'pending_assignment',
      calendarState: 'prepared',
      emailState: 'pending',
      kabikuState: 'pending',
      receivedAt: '2026-09-01T09:00:00.000Z',
      ...overrides,
    }
  }
  return {
    orders: [
      order({ id: 'ord-1', reference: 'REC-1', customer: 'Cliente Uno' }),
      order({
        id: 'ord-2',
        reference: 'REC-2',
        customer: 'Cliente Dos',
        scheduledAt: '2026-09-11T09:00:00.000Z',
      }),
      order({
        id: 'ord-3',
        reference: 'REC-3',
        customer: 'Cliente Tres',
        scheduledAt: '2026-09-12T09:00:00.000Z',
      }),
    ],
  }
})

vi.mock('../application/operations-context', () => ({
  useOperations: () => ({
    state: { orders, drivers: [], vehicles: [], activity: [] },
    processOrder: vi.fn(),
    assign: vi.fn(async () => {}),
    updateOrder: vi.fn(),
  }),
}))

/** Reproduce el uso real: el estado de búsqueda vive fuera y se actualiza vía onSearchChange. */
function Harness({ initial }: { initial?: Partial<TravelSearch> }) {
  const [search, setSearch] = useState<TravelSearch>({ ...defaultTravelSearch, ...initial })
  return (
    <TripsPage
      search={search}
      onSearchChange={(update) => setSearch((current) => ({ ...current, ...update }))}
    />
  )
}

describe('TripsPage - navegación por teclado', () => {
  it('muestra el mensaje de bienvenida cuando no hay viaje seleccionado', () => {
    render(<Harness />)
    expect(screen.getByText('Ningún viaje seleccionado')).toBeInTheDocument()
  })

  it('selecciona un viaje al pulsar su fila y sustituye la bienvenida', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Cliente Uno/ }))
    expect(screen.queryByText('Ningún viaje seleccionado')).not.toBeInTheDocument()
    const detail = within(screen.getByLabelText('Detalle del viaje'))
    expect(detail.getByText('REC-1')).toBeInTheDocument()
  })

  it('ArrowDown mueve el foco y la selección a la fila siguiente', async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ selected: 'ord-1' }} />)
    screen.getByRole('button', { name: /Cliente Uno/ }).focus()
    await user.keyboard('{ArrowDown}')
    const rowTwo = screen.getByRole('button', { name: /Cliente Dos/ })
    expect(rowTwo).toHaveFocus()
    expect(rowTwo).toHaveAttribute('aria-current', 'true')
  })

  it('End mueve el foco a la última fila sin dar la vuelta', async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ selected: 'ord-1' }} />)
    screen.getByRole('button', { name: /Cliente Uno/ }).focus()
    await user.keyboard('{End}')
    expect(screen.getByRole('button', { name: /Cliente Tres/ })).toHaveFocus()
  })

  it('Escape deselecciona el viaje y vuelve a mostrar la bienvenida', async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ selected: 'ord-1' }} />)
    screen.getByRole('button', { name: /Cliente Uno/ }).focus()
    await user.keyboard('{Escape}')
    expect(screen.getByText('Ningún viaje seleccionado')).toBeInTheDocument()
  })

  it('ArrowDown en el buscador entra en la lista sin cambiar la selección', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    screen.getByRole('textbox', { name: 'Buscar viajes' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: /Cliente Uno/ })).toHaveFocus()
    expect(screen.getByText('Ningún viaje seleccionado')).toBeInTheDocument()
  })

  it('las flechas recorren los tabs de estado y activan la pestaña enfocada', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    screen.getByRole('tab', { name: /Todos/ }).focus()
    await user.keyboard('{ArrowRight}')
    const receivedTab = screen.getByRole('tab', { name: /Por procesar/ })
    expect(receivedTab).toHaveFocus()
    expect(receivedTab).toHaveAttribute('aria-selected', 'true')
  })
})
