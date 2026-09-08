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
  it('mantiene la lista como contenido principal cuando no hay viaje seleccionado', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Listado de viajes')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Detalle del viaje' })).not.toBeInTheDocument()
  })

  it('abre el detalle seleccionado en un drawer', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Cliente Uno/ }))
    const detail = within(screen.getByRole('dialog', { name: 'Detalle del viaje' }))
    expect(detail.getByText('REC-1')).toBeInTheDocument()
  })

  it('cierra el drawer y deselecciona el viaje', async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ selected: 'ord-1' }} />)

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(screen.queryByRole('dialog', { name: 'Detalle del viaje' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cliente Uno/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('ArrowDown selecciona la siguiente fila y abre su drawer de detalle', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    screen.getByRole('button', { name: /Cliente Uno/ }).focus()
    await user.keyboard('{ArrowDown}')
    const detail = within(screen.getByRole('dialog', { name: 'Detalle del viaje' }))
    expect(detail.getByText('REC-2')).toBeInTheDocument()
  })

  it('End selecciona la última fila y abre su drawer de detalle', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    screen.getByRole('button', { name: /Cliente Uno/ }).focus()
    await user.keyboard('{End}')
    const detail = within(screen.getByRole('dialog', { name: 'Detalle del viaje' }))
    expect(detail.getByText('REC-3')).toBeInTheDocument()
  })

  it('Escape cierra el drawer y deselecciona el viaje', async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ selected: 'ord-1' }} />)
    screen.getByRole('dialog', { name: 'Detalle del viaje' }).focus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Detalle del viaje' })).not.toBeInTheDocument()
  })

  it('ArrowDown en el buscador entra en la lista sin cambiar la selección', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    screen.getByRole('textbox', { name: 'Buscar viajes' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: /Cliente Uno/ })).toHaveFocus()
    expect(screen.queryByRole('dialog', { name: 'Detalle del viaje' })).not.toBeInTheDocument()
  })

  it('abre los filtros desde el icono del buscador y aplica la procedencia', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByLabelText('Procedencia')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mostrar filtros' }))
    const source = screen.getByLabelText('Procedencia')
    await user.selectOptions(source, 'manual')

    expect(source).toHaveValue('manual')
  })

  it('las flechas recorren los tabs de estado y activan la pestaña enfocada', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    screen.getByRole('tab', { name: /Todos/ }).focus()
    await user.keyboard('{ArrowRight}')
    const pendingAssignmentTab = screen.getByRole('tab', { name: /Por asignar/ })
    expect(pendingAssignmentTab).toHaveFocus()
    expect(pendingAssignmentTab).toHaveAttribute('aria-selected', 'true')
  })
})
