import type { OperationsState, PickupOrder } from '../application/types'

const seedState: OperationsState = {
  orders: [
    {
      id: 'ord-260910-184',
      reference: 'REC-2026-0184',
      customer: 'Logística Ibérica',
      pickupAddress: 'Carrer de la Metal·lúrgia, 38',
      pickupCity: 'Barcelona',
      deliveryAddress: 'Avinguda de la Indústria, 17',
      deliveryCity: 'Sabadell',
      scheduledAt: '2026-09-10T09:30:00+02:00',
      cargo: '4 palés de material técnico',
      weightKg: 860,
      amountCents: 28500,
      source: 'email',
      status: 'pending_assignment',
      attachmentName: 'orden-recogida-184.pdf',
      calendarState: 'pending',
      emailState: 'pending',
      receivedAt: '2026-09-08T09:12:00+02:00',
    },
    {
      id: 'ord-260909-179',
      reference: 'REC-2026-0179',
      customer: 'Distribuciones Maresme',
      pickupAddress: 'Carrer Montserrat, 112',
      pickupCity: 'Mataró',
      deliveryAddress: 'Carrer Energia, 6',
      deliveryCity: 'Granollers',
      scheduledAt: '2026-09-09T08:00:00+02:00',
      cargo: 'Equipo de climatización',
      weightKg: 420,
      amountCents: 19800,
      source: 'email',
      status: 'assigned',
      driverId: 'driver-marc',
      vehicleId: 'vehicle-ducato',
      calendarState: 'sent',
      emailState: 'sent',
      receivedAt: '2026-09-07T16:40:00+02:00',
    },
    {
      id: 'ord-260908-172',
      reference: 'REC-2026-0172',
      customer: 'Talleres Vallès',
      pickupAddress: 'Passeig del Rengle, 21',
      pickupCity: 'Mataró',
      deliveryAddress: 'Carrer del Progrés, 44',
      deliveryCity: 'Badalona',
      scheduledAt: '2026-09-08T11:00:00+02:00',
      cargo: 'Recambios industriales',
      weightKg: 310,
      amountCents: 16400,
      source: 'manual',
      status: 'assigned',
      driverId: 'driver-laura',
      vehicleId: 'vehicle-sprinter',
      calendarState: 'sent',
      emailState: 'sent',
      receivedAt: '2026-09-06T10:05:00+02:00',
    },
    ...Array.from({ length: 20 }, (_, index): PickupOrder => {
      const day = String(9 + (index % 5)).padStart(2, '0')
      const hour = String(7 + (index % 10)).padStart(2, '0')
      const number = 185 + index
      return {
        id: `ord-2609${day}-${number}`,
        reference: `REC-2026-0${number}`,
        customer: `Cliente Lote ${index + 1} SL`,
        pickupAddress: `Polígon Indústrial, nau ${index + 3}`,
        pickupCity: ['Barcelona', 'Mataró', 'Sabadell', 'Terrassa', 'Badalona'][index % 5] ?? '',
        deliveryAddress: `Carrer del Progrés, ${10 + index}`,
        deliveryCity: ['Girona', 'Granollers', 'Martorell', 'Mataró', 'Barcelona'][index % 5] ?? '',
        scheduledAt: `2026-09-${day}T${hour}:00:00+02:00`,
        cargo: index % 2 === 0 ? 'Material paletizado' : 'Carga fraccionada',
        weightKg: 120 + index * 25,
        amountCents: 12000 + index * 1350,
        source: index % 3 === 0 ? 'manual' : 'email',
        status: statusFor(index),
        calendarState: 'pending',
        emailState: 'pending',
        receivedAt: `2026-09-0${(index % 8) + 1}T08:00:00+02:00`,
      }
    }),
  ],
  drivers: [
    {
      id: 'driver-marc',
      name: 'Marc Soler',
      phone: '34600000184',
      email: 'marc.soler@example.test',
      initials: 'MS',
      isExternal: false,
    },
    {
      id: 'driver-laura',
      name: 'Laura Vidal',
      phone: '34600000172',
      email: 'laura.vidal@example.test',
      initials: 'LV',
      isExternal: true,
    },
    {
      id: 'driver-david',
      name: 'David Roca',
      phone: '34600000191',
      email: 'david.roca@example.test',
      initials: 'DR',
      isExternal: false,
    },
  ],
  vehicles: [
    {
      id: 'vehicle-ducato',
      plate: '4821 MZT',
      model: 'Fiat Ducato',
      type: 'Furgón L3H2',
      status: 'on_route',
      odometerKm: 87420,
      nextServiceKm: 90000,
    },
    {
      id: 'vehicle-sprinter',
      plate: '7394 LWN',
      model: 'Mercedes Sprinter',
      type: 'Furgón L2H2',
      status: 'available',
      odometerKm: 64210,
      nextServiceKm: 70000,
    },
    {
      id: 'vehicle-daily',
      plate: '2158 NBG',
      model: 'Iveco Daily',
      type: 'Caja con plataforma',
      status: 'maintenance',
      odometerKm: 112860,
      nextServiceKm: 113000,
    },
  ],
  activity: [
    {
      id: 'act-email',
      title: 'Correo recibido y analizado',
      detail: 'REC-2026-0184 · 11 campos extraídos del adjunto',
      at: '09:12',
      tone: 'info',
    },
    {
      id: 'act-route',
      title: 'Ruta confirmada',
      detail: 'REC-2026-0179 · Marc Soler',
      at: '08:46',
      tone: 'success',
    },
    {
      id: 'act-maintenance',
      title: 'Revisión próxima',
      detail: 'Iveco Daily · faltan 140 km',
      at: '08:30',
      tone: 'warning',
    },
  ],
}

export function createSeedState(): OperationsState {
  return structuredClone(seedState)
}

function statusFor(index: number): PickupOrder['status'] {
  const statuses = ['pending_assignment', 'assigned'] as const
  return statuses[index % statuses.length] ?? 'pending_assignment'
}
