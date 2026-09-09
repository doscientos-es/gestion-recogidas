import type { ActivityItem, Driver, OperationsState, PickupOrder } from '../application/types'

const seedState: OperationsState = {
  orders: [
    {
      id: 'ord-260910-184',
      reference: 'REC-2026-0184',
      customer: 'Iker Bericat Pladevall',
      pickupAddress: "Carrer de la Mare de Déu de l'Esperança, 10",
      pickupCity: 'Barcelona',
      deliveryAddress: 'El Prat Airport (BCN)',
      deliveryCity: 'El Prat de Llobregat',
      scheduledAt: '2026-09-13T05:15:00+02:00',
      serviceType: 'Transfer privado',
      passengerCount: 1,
      luggage: '1 maleta grande y 1 equipaje de mano',
      passengerPhone: '687681421',
      passengerEmail: 'iker@example.test',
      preferences: 'Silla infantil Grupo 0 (0–13 kg)',
      childSeatCount: 1,
      journeys: [
        {
          origin: "Carrer de la Mare de Déu de l'Esperança, 10",
          destination: 'El Prat Airport (BCN)',
          pickupInstructions: 'A la salida del terminal, chófer con cartel',
        },
        {
          origin: "Carrer de la Mare de Déu de l'Esperança, 10",
          destination: 'Carrer Doctor Vidal i Ribas, 26, Sitges',
        },
      ],
      amountCents: 52400,
      source: 'email',
      status: 'pending_assignment',
      attachmentName: 'orden-recogida-184.pdf',
      calendarState: 'pending',
      emailState: 'pending',
      receivedAt: '2026-09-08T09:12:00+02:00',
      isRead: false,
    },
    {
      id: 'ord-260909-179',
      reference: 'REC-2026-0179',
      customer: 'Marta Costa',
      pickupAddress: 'Carrer Montserrat, 112',
      pickupCity: 'Mataró',
      deliveryAddress: 'Terminal 1, Aeropuerto de Barcelona',
      deliveryCity: 'El Prat de Llobregat',
      scheduledAt: '2026-09-09T08:00:00+02:00',
      serviceType: 'Traslado al aeropuerto',
      passengerCount: 3,
      luggage: '3 maletas de cabina',
      passengerPhone: '34600000179',
      journeys: [
        { origin: 'Carrer Montserrat, 112', destination: 'Terminal 1, Aeropuerto de Barcelona' },
      ],
      amountCents: 19800,
      source: 'email',
      status: 'assigned',
      driverId: 'driver-marc',
      calendarState: 'sent',
      emailState: 'sent',
      receivedAt: '2026-09-07T16:40:00+02:00',
      isRead: true,
    },
    {
      id: 'ord-260908-172',
      reference: 'REC-2026-0172',
      customer: 'Júlia Sánchez',
      pickupAddress: 'Passeig del Rengle, 21',
      pickupCity: 'Mataró',
      deliveryAddress: 'Carrer del Progrés, 44',
      deliveryCity: 'Badalona',
      scheduledAt: '2026-09-08T11:00:00+02:00',
      serviceType: 'Transfer privado',
      passengerCount: 2,
      luggage: '2 maletas grandes',
      journeys: [{ origin: 'Passeig del Rengle, 21', destination: 'Carrer del Progrés, 44' }],
      amountCents: 16400,
      source: 'manual',
      status: 'assigned',
      driverId: 'driver-laura',
      calendarState: 'sent',
      emailState: 'sent',
      receivedAt: '2026-09-06T10:05:00+02:00',
      isRead: true,
    },
    ...createBulkOrders(),
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
    ...createDemoDrivers(),
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
      title: 'Datos pendientes',
      detail: 'REC-2026-0184 · Falta confirmar la franja horaria',
      at: '08:30',
      tone: 'warning',
    },
    ...createDemoActivity(),
  ],
}

export function createSeedState(): OperationsState {
  return structuredClone(seedState)
}

function createBulkOrders(): PickupOrder[] {
  const customers = [
    'Almacenes Costa Norte',
    'Electromecánica Delta',
    'Grupo Hostelería Central',
    'Distribuciones Penedès',
    'Industriales Montcada',
    'Comercial Litoral',
    'Servicios Técnicos Vallès',
    'Fábrica Mediterránea',
  ]
  const pickups = ['Barcelona', 'Mataró', 'Sabadell', 'Terrassa', 'Badalona', 'Rubí', 'Sant Boi']
  const deliveries = ['Girona', 'Granollers', 'Martorell', 'Vic', 'Manresa', 'Tarragona', 'Lleida']
  const services = [
    'Transfer privado',
    'Traslado al aeropuerto',
    'Servicio por horas',
    'Traslado interurbano',
  ]
  const driverIds = [
    'driver-marc',
    'driver-laura',
    'driver-david',
    ...createDemoDrivers().map((driver) => driver.id),
  ]
  return Array.from({ length: 117 }, (_, index) => {
    const number = 185 + index
    const day = String(7 + (index % 19)).padStart(2, '0')
    const hour = String(6 + (index % 13)).padStart(2, '0')
    const assigned = index % 3 === 0 || index % 7 === 0
    const driverId = driverIds[index % driverIds.length] ?? 'driver-marc'
    return {
      id: `ord-2609${day}-${number}`,
      reference: `REC-2026-${String(number).padStart(4, '0')}`,
      customer: customers[index % customers.length] ?? 'Cliente de demostración',
      pickupAddress: `Avinguda del Transport, ${12 + index}`,
      pickupCity: pickups[index % pickups.length] ?? 'Barcelona',
      deliveryAddress: `Carrer de la Indústria, ${28 + index}`,
      deliveryCity: deliveries[index % deliveries.length] ?? 'Girona',
      scheduledAt: `2026-09-${day}T${hour}:${index % 2 === 0 ? '00' : '30'}:00+02:00`,
      serviceType: services[index % services.length] ?? 'Transfer privado',
      passengerCount: 1 + (index % 5),
      luggage: `${1 + (index % 4)} ${index % 2 === 0 ? 'maleta grande' : 'equipajes de mano'}`,
      journeys: [
        {
          origin: `Avinguda del Transport, ${12 + index}`,
          destination: `Carrer de la Indústria, ${28 + index}`,
        },
      ],
      amountCents: 9500 + ((index * 2375) % 85000),
      source: index % 4 === 0 ? 'manual' : 'email',
      status: assigned ? 'assigned' : 'pending_assignment',
      ...(assigned ? { driverId } : {}),
      ...(index % 4 === 0 ? { attachmentName: `orden-recogida-${number}.pdf` } : {}),
      calendarState: assigned ? 'sent' : index % 2 === 0 ? 'prepared' : 'pending',
      emailState: assigned ? 'sent' : index % 3 === 0 ? 'prepared' : 'pending',
      receivedAt: `2026-09-${String(1 + (index % 8)).padStart(2, '0')}T${String(7 + (index % 9)).padStart(2, '0')}:15:00+02:00`,
      isRead: true,
    }
  })
}

function createDemoDrivers(): Driver[] {
  const drivers: [string, string, boolean][] = [
    ['anna', 'Anna Pujol', false],
    ['sergio', 'Sergio Navarro', false],
    ['nuria', 'Núria Ferrer', true],
    ['joan', 'Joan Prat', false],
    ['mireia', 'Mireia Casas', false],
    ['oscar', 'Óscar Molina', true],
    ['carla', 'Carla Benet', false],
    ['ivan', 'Iván Torres', false],
    ['helena', 'Helena Grau', true],
    ['pol', 'Pol Esteve', false],
    ['raquel', 'Raquel Martín', true],
    ['eric', 'Eric Sánchez', false],
  ]
  return drivers.map(([id, name, isExternal], index) => ({
    id: `driver-${id}`,
    name,
    phone: `34600000${String(200 + index).padStart(3, '0')}`,
    email: `${id}@example.test`,
    initials: name
      .split(' ')
      .map((part) => part[0])
      .join(''),
    isExternal,
  }))
}

function createDemoActivity(): ActivityItem[] {
  const events: [string, string, ActivityItem['tone']][] = [
    ['Asignación confirmada', 'REC-2026-0201 · Anna Pujol', 'success'],
    ['Nuevo correo procesado', 'REC-2026-0214 · Datos extraídos automáticamente', 'info'],
    ['Revisión de datos', 'REC-2026-0218 · Falta validar el peso declarado', 'warning'],
    ['Calendario actualizado', 'REC-2026-0196 · Evento enviado al conductor', 'success'],
    ['Adjunto validado', 'REC-2026-0225 · Albarán y orden de recogida', 'info'],
    ['Capacidad limitada', 'Zona norte · franjas horarias completas', 'warning'],
    ['Conductor disponible', 'Raquel Martín · turno de tarde', 'success'],
    ['Nueva recogida manual', 'REC-2026-0233 · Creada por operaciones', 'info'],
  ]
  return events.map(([title, detail, tone], index) => ({
    id: `act-demo-${index + 1}`,
    title,
    detail,
    at: `${String(8 + Math.floor(index / 2)).padStart(2, '0')}:${index % 2 === 0 ? '20' : '48'}`,
    tone,
  }))
}
