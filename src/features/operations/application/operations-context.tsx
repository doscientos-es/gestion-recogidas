import { useQuery, useQueryClient } from '@tanstack/react-query'
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

import { loadOperations, saveOperations } from '../infrastructure/operations-repository'
import { createSeedState } from '../infrastructure/seed-state'
import type { Driver, OperationsState, PickupOrder } from './types'
import { addDriver, assignOrder, removeDriver, updateDriver } from './workflow'

interface OperationsContextValue {
  state: OperationsState
  loading: boolean
  saving: boolean
  error: string | undefined
  clearError: () => void
  assign: (orderId: string, driverId: string) => Promise<void>
  addManual: (order: PickupOrder) => void
  updateOrder: (orderId: string, patch: Partial<PickupOrder>) => void
  markRead: (orderId: string) => void
  addDriver: (driver: Driver) => void
  updateDriver: (driverId: string, patch: Partial<Driver>) => void
  deleteDriver: (driverId: string) => void
  reset: () => void
  refresh: () => Promise<void>
}

const OperationsContext = createContext<OperationsContextValue | null>(null)

export function OperationsProvider({ children }: { children: ReactNode }) {
  const seedState = useMemo(() => createSeedState(), [])
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['operations'] as const, [])
  const { data, isError, isPending, refetch } = useQuery({
    queryKey,
    queryFn: loadOperations,
    staleTime: Infinity,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })
  const state = data ?? seedState
  const stateRef = useRef(state)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const pendingSavesRef = useRef(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const commit = useCallback(
    (change: (current: OperationsState) => OperationsState): boolean => {
      const next = change(stateRef.current)
      if (next === stateRef.current) return false
      stateRef.current = next
      queryClient.setQueryData(queryKey, next)
      setError(undefined)
      pendingSavesRef.current += 1
      setSaving(true)
      saveQueueRef.current = saveQueueRef.current
        .then(() => saveOperations(next))
        .catch((reason: unknown) => {
          setError(
            reason instanceof Error ? reason.message : 'No se han podido guardar los cambios.',
          )
        })
        .finally(() => {
          pendingSavesRef.current -= 1
          if (pendingSavesRef.current === 0) setSaving(false)
        })
      return true
    },
    [queryClient, queryKey],
  )

  const value = useMemo<OperationsContextValue>(
    () => ({
      state,
      loading: isPending,
      saving,
      error: error ?? (isError ? 'No se han podido cargar los datos.' : undefined),
      clearError: () => setError(undefined),
      refresh: async () => {
        await refetch()
      },
      assign: async (orderId, driverId) => {
        if (!commit((value) => assignOrder(value, orderId, driverId))) {
          setError('No se puede asignar: revisa el viaje y el conductor seleccionados.')
          return
        }
      },
      addManual: (order) =>
        commit((current) => ({ ...current, orders: [order, ...current.orders] })),
      updateOrder: (orderId, patch) =>
        commit((current) => ({
          ...current,
          orders: current.orders.map((order) =>
            order.id === orderId ? { ...order, ...patch } : order,
          ),
        })),
      markRead: (orderId) =>
        commit((current) => {
          const order = current.orders.find((item) => item.id === orderId)
          if (!order || order.isRead) return current
          return {
            ...current,
            orders: current.orders.map((item) =>
              item.id === orderId ? { ...item, isRead: true } : item,
            ),
          }
        }),
      addDriver: (driver) => commit((current) => addDriver(current, driver)),
      updateDriver: (driverId, patch) =>
        commit((current) => updateDriver(current, driverId, patch)),
      deleteDriver: (driverId) => commit((current) => removeDriver(current, driverId)),
      reset: () => commit(() => createSeedState()),
    }),
    [commit, error, isError, isPending, refetch, saving, state],
  )

  return <OperationsContext value={value}>{children}</OperationsContext>
}

export function useOperations(): OperationsContextValue {
  const value = useContext(OperationsContext)
  if (!value) throw new Error('useOperations debe usarse dentro de OperationsProvider.')
  return value
}
