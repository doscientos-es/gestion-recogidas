// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppFrame } from './app-frame'

type MockLinkProps = {
  activeOptions?: unknown
  activeProps?: unknown
  children: ReactNode
  className?: string
  onClick?: () => void
  search?: unknown
  to: string
}

vi.mock('@tanstack/react-router', () => ({
  Link: ({ activeOptions, activeProps, children, search, to, ...props }: MockLinkProps) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useSearch: () => ({ compose: false }),
}))

vi.mock('@/features/operations/application/operations-context', () => ({
  useOperations: () => ({
    clearError: vi.fn(),
    error: null,
    loading: false,
    refresh: vi.fn(),
    saving: false,
  }),
}))

afterEach(cleanup)

describe('AppFrame', () => {
  it('provides desktop sidebar navigation and safe external tool links', () => {
    const { container } = render(
      <AppFrame>
        <p>Contenido</p>
      </AppFrame>,
    )

    expect(container.querySelector('[data-slot="app-shell-sidebar"]')).toHaveAttribute(
      'aria-label',
      'Navegación de escritorio',
    )
    expect(screen.getByRole('link', { name: 'Facturación' })).toHaveAttribute(
      'href',
      'https://kabiku.es',
    )
    expect(screen.getByRole('link', { name: 'Vehículos' })).toHaveAttribute(
      'href',
      'https://movildata.com',
    )
  })

  it('opens and closes the mobile navigation drawer', async () => {
    const user = userEvent.setup()
    render(
      <AppFrame>
        <p>Contenido</p>
      </AppFrame>,
    )

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.getByRole('dialog', { name: 'Navegación principal' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }))
    expect(screen.queryByRole('dialog', { name: 'Navegación principal' })).not.toBeInTheDocument()
  })
})
