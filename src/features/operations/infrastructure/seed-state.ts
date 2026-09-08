import type {
  ActivityItem,
  Driver,
  OperationsState,
  PickupOrder,
  Vehicle,
} from '../application/types'

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
      vehicleId: 'vehicle-transit',
      calendarState: 'sent',
      emailState: 'sent',
      receivedAt: '2026-09-06T10:05:00+02:00',
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
    ...createDemoVehicles(),
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
  const cargoes = [
    'Material paletizado',
    'Carga fraccionada',
    'Equipos de refrigeración',
    'Repuestos industriales',
    'Mobiliario comercial',
    'Suministro de embalaje',
  ]
  const driverIds = [
    'driver-marc',
    'driver-laura',
    'driver-david',
    ...createDemoDrivers().map((driver) => driver.id),
  ]
  const vehicleIds = [
    'vehicle-ducato',
    ...createDemoVehicles()
      .filter((vehicle) => vehicle.status === 'on_route')
      .map((vehicle) => vehicle.id),
  ]

  return Array.from({ length: 117 }, (_, index) => {
    const number = 185 + index
    const day = String(7 + (index % 19)).padStart(2, '0')
    const hour = String(6 + (index % 13)).padStart(2, '0')
    const assigned = index % 3 === 0 || index % 7 === 0
    const driverId = driverIds[index % driverIds.length] ?? 'driver-marc'
    const vehicleId = vehicleIds[index % vehicleIds.length] ?? 'vehicle-ducato'
    return {
      id: `ord-2609${day}-${number}`,
      reference: `REC-2026-${String(number).padStart(4, '0')}`,
      customer: customers[index % customers.length] ?? 'Cliente de demostración',
      pickupAddress: `Avinguda del Transport, ${12 + index}`,
      pickupCity: pickups[index % pickups.length] ?? 'Barcelona',
      deliveryAddress: `Carrer de la Indústria, ${28 + index}`,
      deliveryCity: deliveries[index % deliveries.length] ?? 'Girona',
      scheduledAt: `2026-09-${day}T${hour}:${index % 2 === 0 ? '00' : '30'}:00+02:00`,
      cargo: cargoes[index % cargoes.length] ?? 'Mercancía general',
      weightKg: 100 + ((index * 85) % 2200),
      amountCents: 9500 + ((index * 2375) % 85000),
      source: index % 4 === 0 ? 'manual' : 'email',
      status: assigned ? 'assigned' : 'pending_assignment',
      ...(assigned ? { driverId, vehicleId } : {}),
      ...(index % 4 === 0 ? { attachmentName: `orden-recogida-${number}.pdf` } : {}),
      calendarState: assigned ? 'sent' : index % 2 === 0 ? 'prepared' : 'pending',
      emailState: assigned ? 'sent' : index % 3 === 0 ? 'prepared' : 'pending',
      receivedAt: `2026-09-${String(1 + (index % 8)).padStart(2, '0')}T${String(7 + (index % 9)).padStart(2, '0')}:15:00+02:00`,
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

function createDemoVehicles(): Vehicle[] {
  const fleet: [string, string, string, string, Vehicle['status'], number, number][] = [
    ['transit', 'Ford Transit', 'Furgón L3H3', '6182 MKS', 'on_route', 78540, 85000],
    ['crafter', 'Volkswagen Crafter', 'Furgón L4', '1946 NPF', 'on_route', 92310, 100000],
    ['boxer', 'Peugeot Boxer', 'Furgón L2H2', '3275 MTH', 'available', 48120, 55000],
    ['master', 'Renault Master', 'Furgón L3H2', '8654 LXR', 'available', 53600, 60000],
    ['atego', 'Mercedes Atego', 'Camión rígido 7,5 t', '5128 MZL', 'on_route', 136800, 145000],
    ['canter', 'Fuso Canter', 'Caja abierta', '7239 MJD', 'maintenance', 104950, 105000],
    ['movano', 'Opel Movano', 'Furgón L3H2', '3184 MLV', 'available', 69240, 75000],
    ['jumper', 'Citroën Jumper', 'Furgón frigorífico', '6921 NCM', 'on_route', 81780, 90000],
    ['volvo', 'Volvo FL', 'Camión rígido 12 t', '4570 KTZ', 'available', 156400, 170000],
    ['e-transit', 'Ford E-Transit', 'Furgón eléctrico', '8842 NNW', 'available', 32400, 40000],
  ]
  return fleet.map(([id, model, type, plate, status, odometerKm, nextServiceKm]) => ({
    id: `vehicle-${id}`,
    model,
    type,
    plate,
    status,
    odometerKm,
    nextServiceKm,
  }))
}

function createDemoActivity(): ActivityItem[] {
  const events: [string, string, ActivityItem['tone']][] = [
    ['Asignación confirmada', 'REC-2026-0201 · Anna Pujol', 'success'],
    ['Nuevo correo procesado', 'REC-2026-0214 · Datos extraídos automáticamente', 'info'],
    ['Revisión programada', 'Fuso Canter · entrada en taller mañana', 'warning'],
    ['Calendario actualizado', 'REC-2026-0196 · Evento enviado al conductor', 'success'],
    ['Adjunto validado', 'REC-2026-0225 · Albarán y orden de recogida', 'info'],
    ['Capacidad limitada', 'Mercedes Atego · ruta completa', 'warning'],
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
