import { createBrowserSupabaseClient } from '../../../shared/lib/supabase/client'
import { DRIVER_PAGE_SIZE, type DriverPage, type DriverSort } from '../application/driver-queries'
import type { Driver, OperationsState, PickupOrder } from '../application/types'
import { createSeedState } from './seed-state'

const sharedOperationsId = true

function isOperationsState(value: unknown): value is OperationsState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    Array.isArray(candidate.orders) &&
    Array.isArray(candidate.drivers) &&
    Array.isArray(candidate.activity)
  )
}

/** Adapta los datos guardados antes de simplificar el flujo de recogidas. */
function normalizeOperationsState(state: OperationsState): OperationsState {
  return {
    activity: state.activity,
    drivers: state.drivers.map((driver) => ({ ...driver, isExternal: driver.isExternal === true })),
    orders: state.orders.map((item) => {
      const {
        id,
        reference,
        customer,
        pickupAddress,
        pickupCity,
        deliveryAddress,
        deliveryCity,
        scheduledAt,
        serviceType,
        passengerCount,
        luggage,
        passengerPhone,
        passengerEmail,
        preferences,
        language,
        childSeatCount,
        driverObservations,
        waitHours,
        waitRateCents,
        waitAmountCents,
        journeyAmountCents,
        extrasAmountCents,
        waitingConditions,
        journeys,
        amountCents,
        source,
        status,
        attachmentName,
        driverId,
        calendarState,
        emailState,
        receivedAt,
        isRead,
      } = item as PickupOrder & { cargo?: string; status: string; weightKg?: number }
      const legacyOrder = item as PickupOrder & {
        cargo?: string
        status: string
        weightKg?: number
      }
      const rawStatus = (item as { status?: unknown }).status
      const legacyPassengers = legacyOrder.cargo?.match(/(\d+)\s*(?:pax|pasajeros?)/i)?.[1]
      const normalizedJourneys = Array.isArray(journeys)
        ? journeys.filter(
            (journey): journey is PickupOrder['journeys'][number] =>
              Boolean(journey) &&
              typeof journey.origin === 'string' &&
              typeof journey.destination === 'string',
          )
        : []
      return {
        id,
        reference,
        customer,
        pickupAddress,
        pickupCity,
        deliveryAddress,
        deliveryCity,
        scheduledAt,
        serviceType: serviceType || legacyOrder.cargo || 'Servicio de pasajeros',
        passengerCount:
          typeof passengerCount === 'number' && passengerCount >= 0
            ? passengerCount
            : Number(legacyPassengers ?? 0),
        luggage: luggage || 'No indicado',
        ...(passengerPhone ? { passengerPhone } : {}),
        ...(passengerEmail ? { passengerEmail } : {}),
        ...(preferences ? { preferences } : {}),
        ...(language ? { language } : {}),
        ...(typeof childSeatCount === 'number' && childSeatCount > 0 ? { childSeatCount } : {}),
        ...(driverObservations ? { driverObservations } : {}),
        ...(waitHours ? { waitHours } : {}),
        ...(typeof waitRateCents === 'number' ? { waitRateCents } : {}),
        ...(typeof waitAmountCents === 'number' ? { waitAmountCents } : {}),
        ...(typeof journeyAmountCents === 'number' ? { journeyAmountCents } : {}),
        ...(typeof extrasAmountCents === 'number' ? { extrasAmountCents } : {}),
        ...(waitingConditions ? { waitingConditions } : {}),
        journeys:
          normalizedJourneys.length > 0
            ? normalizedJourneys
            : [{ origin: pickupAddress, destination: deliveryAddress }],
        amountCents,
        source,
        ...(attachmentName !== undefined ? { attachmentName } : {}),
        ...(driverId !== undefined ? { driverId } : {}),
        calendarState,
        emailState,
        receivedAt,
        isRead: isRead === true,
        status:
          rawStatus === 'received' || status === 'pending_assignment'
            ? 'pending_assignment'
            : 'assigned',
      }
    }),
  }
}

async function ensureAuthenticated(): Promise<void> {
  const client = createBrowserSupabaseClient()
  const current = await client.auth.getUser()
  if (current.data.user) return
  throw new Error('Inicia sesión para consultar las operaciones compartidas.')
}

function inboundOrders(value: unknown): PickupOrder[] {
  if (!Array.isArray(value)) return []
  return normalizeOperationsState({ orders: value as PickupOrder[], drivers: [], activity: [] })
    .orders
}

/** Combina mensajes nuevos sin sustituir las modificaciones operativas ya compartidas. */
export function mergeReceivedOrders(
  state: OperationsState,
  received: PickupOrder[],
): OperationsState {
  const existing = new Set(state.orders.map((order) => order.id))
  const newOrders = received.filter((order) => !existing.has(order.id))
  if (newOrders.length === 0) return state
  return {
    ...state,
    orders: [...newOrders.map((order) => ({ ...order, isRead: false })), ...state.orders],
    activity: [
      ...newOrders.map((order) => ({
        id: `email-${order.id}`,
        title: 'Correo recibido y analizado',
        detail: `${order.reference} · ${order.passengerCount || '—'} pasajeros`,
        at: 'Ahora',
        tone: 'info' as const,
      })),
      ...state.activity,
    ],
  }
}

export async function loadOperations(): Promise<OperationsState> {
  const client = createBrowserSupabaseClient()
  await ensureAuthenticated()
  const [stateResult, emailsResult] = await Promise.all([
    client.from('shared_operations').select('state').eq('id', sharedOperationsId).maybeSingle(),
    client.from('inbound_emails').select('parsed_order').order('received_at', { ascending: false }),
  ])
  if (stateResult.error || emailsResult.error)
    throw new Error('No se han podido recuperar las operaciones compartidas.')
  const state = isOperationsState(stateResult.data?.state)
    ? normalizeOperationsState(stateResult.data.state)
    : createSeedState()
  if (!stateResult.data) await saveOperations(state)
  return mergeReceivedOrders(
    state,
    inboundOrders(emailsResult.data?.map((item) => item.parsed_order)),
  )
}

export async function saveOperations(state: OperationsState): Promise<void> {
  const client = createBrowserSupabaseClient()
  await ensureAuthenticated()
  const result = await client
    .from('shared_operations')
    .upsert({ id: sharedOperationsId, state }, { onConflict: 'id' })
  if (result.error) throw new Error('No se han podido guardar los cambios en Supabase.')
}

export async function loadDriversPage(
  search: string,
  page: number,
  sort: DriverSort = 'name_asc',
): Promise<DriverPage> {
  const client = createBrowserSupabaseClient()
  await ensureAuthenticated()
  const result = await client.rpc('get_drivers_page', {
    requested_page: page,
    requested_page_size: DRIVER_PAGE_SIZE,
    search_text: search.trim(),
    sort_by: sort,
  })
  if (result.error) throw new Error('No se han podido recuperar los conductores.')

  const payload = result.data as Record<string, unknown> | null
  const drivers = Array.isArray(payload?.drivers)
    ? payload.drivers.map(asDriver).filter((driver): driver is Driver => driver !== undefined)
    : []
  const total = typeof payload?.total === 'number' ? payload.total : 0
  const pageCount = Math.max(1, Math.ceil(total / DRIVER_PAGE_SIZE))
  const responsePage = typeof payload?.page === 'number' ? payload.page : page

  return { drivers, page: Math.min(Math.max(1, responsePage), pageCount), pageCount, total }
}

function asDriver(value: unknown): Driver | undefined {
  if (!value || typeof value !== 'object') return undefined
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.phone !== 'string' ||
    typeof candidate.email !== 'string' ||
    typeof candidate.initials !== 'string'
  )
    return undefined
  return {
    id: candidate.id,
    name: candidate.name,
    phone: candidate.phone,
    email: candidate.email,
    initials: candidate.initials,
    isExternal: candidate.isExternal === true,
  }
}
