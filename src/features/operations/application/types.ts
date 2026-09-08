export type OrderStatus = 'pending_assignment' | 'assigned'

export type IntegrationState = 'pending' | 'prepared' | 'sent'

export interface Driver {
  id: string
  name: string
  phone: string
  email: string
  initials: string
  isExternal: boolean
}

export interface Vehicle {
  id: string
  plate: string
  model: string
  type: string
  status: 'available' | 'on_route' | 'maintenance'
  odometerKm: number
  nextServiceKm: number
}

export interface PickupOrder {
  id: string
  reference: string
  customer: string
  pickupAddress: string
  pickupCity: string
  deliveryAddress: string
  deliveryCity: string
  scheduledAt: string
  cargo: string
  weightKg: number
  amountCents: number
  source: 'email' | 'manual'
  status: OrderStatus
  attachmentName?: string
  driverId?: string
  vehicleId?: string
  calendarState: IntegrationState
  emailState: IntegrationState
  receivedAt: string
}

export interface ActivityItem {
  id: string
  title: string
  detail: string
  at: string
  tone: 'info' | 'success' | 'warning'
}

export interface OperationsState {
  orders: PickupOrder[]
  drivers: Driver[]
  vehicles: Vehicle[]
  activity: ActivityItem[]
}
