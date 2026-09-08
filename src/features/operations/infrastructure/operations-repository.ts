import { createBrowserSupabaseClient } from '@/shared/lib/supabase/client'

import type { OperationsState } from '../application/types'
import { createSeedState } from './seed-state'

const storageKey = 'gestion-recogidas-demo-v1'

export function dataMode(): 'demo' | 'supabase' {
  return import.meta.env.VITE_DATA_MODE === 'supabase' ? 'supabase' : 'demo'
}

function isOperationsState(value: unknown): value is OperationsState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    Array.isArray(candidate.orders) &&
    Array.isArray(candidate.drivers) &&
    Array.isArray(candidate.vehicles) &&
    Array.isArray(candidate.activity)
  )
}

async function currentUserId(): Promise<string> {
  const client = createBrowserSupabaseClient()
  const current = await client.auth.getUser()
  if (current.data.user) return current.data.user.id
  const signed = await client.auth.signInAnonymously()
  if (signed.error || !signed.data.user)
    throw new Error('No se ha podido iniciar la sesión segura de demostración.')
  return signed.data.user.id
}

export async function loadOperations(): Promise<OperationsState> {
  if (dataMode() === 'demo') {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return createSeedState()
    try {
      const parsed: unknown = JSON.parse(stored)
      return isOperationsState(parsed) ? parsed : createSeedState()
    } catch {
      return createSeedState()
    }
  }
  const client = createBrowserSupabaseClient()
  const ownerId = await currentUserId()
  const result = await client
    .from('demo_workspaces')
    .select('state')
    .eq('owner_id', ownerId)
    .maybeSingle()
  if (result.error) throw new Error('No se han podido recuperar las operaciones de Supabase.')
  if (isOperationsState(result.data?.state)) return result.data.state
  const state = createSeedState()
  await saveOperations(state)
  return state
}

export async function saveOperations(state: OperationsState): Promise<void> {
  if (dataMode() === 'demo') {
    localStorage.setItem(storageKey, JSON.stringify(state))
    return
  }
  const client = createBrowserSupabaseClient()
  const ownerId = await currentUserId()
  const result = await client
    .from('demo_workspaces')
    .upsert({ owner_id: ownerId, state }, { onConflict: 'owner_id' })
  if (result.error) throw new Error('No se han podido guardar los cambios en Supabase.')
}
