import { useQuery } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { dataMode, loadOperations, saveOperations } from '../infrastructure/operations-repository'
import { createSeedState } from '../infrastructure/seed-state'
import type { OperationsState, PickupOrder } from './types'
import { assignOrder, completeOrder, processInboundOrder, syncWithKabiku } from './workflow'

interface OperationsContextValue {
  state: OperationsState
  mode: 'demo' | 'supabase'
  loading: boolean
  saving: boolean
  error: string | undefined
  clearError: () => void
  processOrder: (orderId: string) => void
  assign: (orderId: string, driverId: string, vehicleId: string) => Promise<void>
  complete: (orderId: string) => void
  invoice: (orderId: string) => void
  addManual: (order: PickupOrder) => void
  reset: () => void
  refresh: () => Promise<void>
}

const OperationsContext = createContext<OperationsContextValue | null>(null)

export function OperationsProvider({ children }: { children: ReactNode }) {
  const seedState = useMemo(() => createSeedState(), [])
  const query = useQuery({
    queryKey: ['operations', dataMode()],
    queryFn: loadOperations,
    staleTime: Infinity,
  })
  const [localState, setLocalState] = useState<OperationsState>()
  const state = localState ?? query.data ?? seedState
  const stateRef = useRef(state)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const pendingSavesRef = useRef(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const commit = useCallback((change: (current: OperationsState) => OperationsState): boolean => {
    const next = change(stateRef.current)
    if (next === stateRef.current) return false
    stateRef.current = next
    setLocalState(next)
    setError(undefined)
    pendingSavesRef.current += 1
    setSaving(true)
    saveQueueRef.current = saveQueueRef.current
      .then(() => saveOperations(next))
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'No se han podido guardar los cambios.')
      })
      .finally(() => {
        pendingSavesRef.current -= 1
        if (pendingSavesRef.current === 0) setSaving(false)
      })
    return true
  }, [])

  const value = useMemo<OperationsContextValue>(
    () => ({
      state,
      mode: dataMode(),
      loading: dataMode() === 'supabase' && query.isPending,
      saving,
      error: error ?? (query.isError ? 'No se han podido cargar los datos.' : undefined),
      clearError: () => setError(undefined),
      refresh: async () => {
        await query.refetch()
      },
      processOrder: (orderId) => {
        commit((current) => processInboundOrder(current, orderId))
      },
      assign: async (orderId, driverId, vehicleId) => {
        const current = stateRef.current
        if (!commit((value) => assignOrder(value, orderId, driverId, vehicleId))) {
          setError('No se puede asignar: revisa que el viaje y el vehículo estén disponibles.')
          return
        }
      },
      complete: (orderId) => commit((current) => completeOrder(current, orderId)),
      invoice: (orderId) => commit((current) => syncWithKabiku(current, orderId)),
      addManual: (order) =>
        commit((current) => ({ ...current, orders: [order, ...current.orders] })),
      reset: () => commit(() => createSeedState()),
    }),
    [commit, error, query.isError, query.isPending, query.refetch, saving, state],
  )

  return <OperationsContext value={value}>{children}</OperationsContext>
}

export function useOperations(): OperationsContextValue {
  const value = useContext(OperationsContext)
  if (!value) throw new Error('useOperations debe usarse dentro de OperationsProvider.')
  return value
}
