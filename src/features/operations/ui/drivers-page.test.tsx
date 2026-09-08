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

    expect(screen.getByText('De la casa')).toBeInTheDocument()
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
