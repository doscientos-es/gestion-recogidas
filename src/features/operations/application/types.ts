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

export interface JourneyLeg {
  origin: string
  destination: string
  pickupInstructions?: string
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
  serviceType: string
  passengerCount: number
  luggage: string
  passengerPhone?: string
  passengerEmail?: string
  preferences?: string
  childSeatCount?: number
  journeys: JourneyLeg[]
  amountCents: number
  source: 'email' | 'manual'
  status: OrderStatus
  attachmentName?: string
  driverId?: string
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
  activity: ActivityItem[]
}
