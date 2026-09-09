// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AuthenticationGate } from './authentication-gate'

const { getSession, onAuthStateChange, signInWithPassword } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
}))

vi.mock('../../../shared/lib/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({
    auth: { getSession, onAuthStateChange, signInWithPassword },
  }),
}))

describe('AuthenticationGate', () => {
  it('muestra el contenido tras autenticar con email y contraseña', async () => {
    const user = userEvent.setup()
    getSession.mockResolvedValue({ data: { session: null }, error: null })
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'test' } },
      error: null,
    })

    render(
      <AuthenticationGate>
        <p>Bandeja de operaciones</p>
      </AuthenticationGate>,
    )

    await user.type(await screen.findByLabelText('Email'), 'operaciones@example.test')
    await user.type(screen.getByLabelText('Contraseña'), 'password-for-test')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() =>
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'operaciones@example.test',
        password: 'password-for-test',
      }),
    )
    expect(await screen.findByText('Bandeja de operaciones')).toBeInTheDocument()
  })
})
