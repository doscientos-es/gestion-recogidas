import { Button, Label } from '@doscientos/ui'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { createBrowserSupabaseClient } from '../../../shared/lib/supabase/client'

export function AuthenticationGate({ children }: { children: ReactNode }) {
  if (import.meta.env.VITE_DATA_MODE !== 'supabase') return children
  return <SupabaseAuthenticationGate>{children}</SupabaseAuthenticationGate>
}

function SupabaseAuthenticationGate({ children }: { children: ReactNode }) {
  const client = useMemo(() => createBrowserSupabaseClient(), [])
  const [authenticated, setAuthenticated] = useState<boolean | undefined>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) setError('No se ha podido comprobar la sesión.')
      setAuthenticated(Boolean(data.session))
    })
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthenticated(Boolean(session))
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(undefined)
    const result = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (result.error) {
      setError('El email o la contraseña no son válidos.')
    } else {
      setAuthenticated(Boolean(result.data.session))
    }
    setSubmitting(false)
  }

  if (authenticated) return children
  return (
    <main className="bg-muted/35 flex min-h-svh items-center justify-center p-4">
      <form
        className="bg-background w-full max-w-sm space-y-5 rounded-xl border p-6 shadow-sm"
        onSubmit={(event) => void submit(event)}
      >
        <header>
          <p className="text-muted-foreground text-sm">Gestión Automática</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Acceso a operaciones</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Inicia sesión para consultar la bandeja compartida de servicios.
          </p>
        </header>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <input
            id="login-email"
            autoComplete="email"
            className="field-control w-full"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Contraseña</Label>
          <input
            id="login-password"
            autoComplete="current-password"
            className="field-control w-full"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <Button
          className="w-full"
          isDisabled={submitting || authenticated === undefined}
          type="submit"
        >
          {submitting ? 'Accediendo…' : 'Iniciar sesión'}
        </Button>
      </form>
    </main>
  )
}
