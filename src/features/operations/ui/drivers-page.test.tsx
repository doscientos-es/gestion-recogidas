// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DriversPage } from './drivers-page'

const addDriver = vi.fn()
const updateDriver = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/viajes">{children}</a>,
}))

vi.mock('../application/operations-context', () => ({
  useOperations: () => ({
    addDriver,
    updateDriver,
    deleteDriver: vi.fn(),
    state: {
      orders: [],
      activity: [],
      drivers: [
        {
          id: 'driver-marc',
          name: 'Marc Soler',
          phone: '34600000184',
          email: 'marc@example.test',
          initials: 'MS',
          isExternal: false,
        },
        {
          id: 'driver-laura',
          name: 'Laura Vidal',
          phone: '34600000172',
          email: 'laura@example.test',
          initials: 'LV',
          isExternal: true,
        },
        ...Array.from({ length: 11 }, (_, index) => ({
          id: `driver-${index + 1}`,
          name: `Conductor ${index + 1}`,
          phone: `34600000${String(index + 1).padStart(3, '0')}`,
          email: `conductor-${index + 1}@example.test`,
          initials: `C${index + 1}`,
          isExternal: false,
        })),
      ],
    },
  }),
}))

afterEach(() => {
  cleanup()
  addDriver.mockReset()
  updateDriver.mockReset()
})

describe('DriversPage', () => {
  it('shows whether each driver is internal or external', () => {
    render(<DriversPage />)

    expect(screen.getAllByText('De la casa').length).toBeGreaterThan(0)
    expect(screen.getByText('Externo')).toBeInTheDocument()
  })

  it('filters drivers by name', async () => {
    const user = userEvent.setup()
    render(<DriversPage />)

    await user.type(screen.getByLabelText('Buscar conductores'), 'marc')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(screen.getByText('Marc Soler')).toBeInTheDocument()
    expect(screen.queryByText('Laura Vidal')).not.toBeInTheDocument()
  })

  it('offers sorting next to the driver search', async () => {
    const user = userEvent.setup()
    render(<DriversPage />)

    const sort = screen.getByLabelText('Ordenar conductores')
    await user.selectOptions(sort, 'name_desc')

    expect(sort).toHaveValue('name_desc')
    expect(screen.getByRole('option', { name: 'De la casa primero' })).toBeInTheDocument()
  })

  it('makes pagination visible and lets users jump to a page', async () => {
    const user = userEvent.setup()
    render(<DriversPage />)

    expect(
      screen.getByRole('navigation', { name: 'Paginación de conductores' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mostrando 1–12 de 13 conductores')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ir a la página 2' }))
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 13–13 de 13 conductores')).toBeInTheDocument()
  })

  it('creates an external driver from the form', async () => {
    const user = userEvent.setup()
    render(<DriversPage />)

    await user.click(screen.getByRole('button', { name: 'Nuevo conductor' }))
    await user.type(screen.getByLabelText('Nombre'), 'Nuria García')
    await user.type(screen.getByLabelText('Teléfono'), '34600000000')
    await user.type(screen.getByLabelText('Email'), 'nuria@example.test')
    await user.selectOptions(screen.getByLabelText('Tipo de conductor'), 'external')
    await user.click(screen.getByRole('button', { name: 'Añadir conductor' }))

    expect(addDriver).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Nuria García',
        phone: '34600000000',
        initials: 'NG',
        isExternal: true,
      }),
    )
  })

  it('updates the driver type from the edit form', async () => {
    const user = userEvent.setup()
    render(<DriversPage />)

    await user.click(screen.getByRole('button', { name: 'Editar Laura Vidal' }))
    await user.selectOptions(screen.getByLabelText('Tipo de conductor'), 'internal')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(updateDriver).toHaveBeenCalledWith(
      'driver-laura',
      expect.objectContaining({ isExternal: false }),
    )
  })
})
