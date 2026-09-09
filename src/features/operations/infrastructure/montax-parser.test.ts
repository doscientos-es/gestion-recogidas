import { describe, expect, it } from 'vitest'

import { parseMontaxEmail } from './montax-parser'

const emailText = `Enviado desde mi iPhone
Comienzo del mensaje reenviado:
De: Reservas <reservas@montax.cat>
Fecha: 9 de septiembre de 2026, 9:00:27 CEST
Para: Recogidas <recogidas@doscientos.es>
Asunto: Fwd: Confirmación de Servicio con ID 160524
Confirmación de Servicio con ID 160524
MONTAX CHAUFFEURS
CONFIRMACIÓN DE SERVICIO
Estimado cliente, su servicio ha sido confirmado con los siguientes datos:
DATOS DEL SERVICIO
ID SERVICIO: 160524
TIPO SERVICIO: Transfer-As Directed
FECHA DEL SERVICIO: 13/09/2026
HORA DEL SERVICIO: 05:15
PASAJERO PRINCIPAL
NOMBRE Y APELLIDOS: Iker Bericat Pladevall
TELÉFONO: 687681421
EMAIL: cjorda@damoclex.com
Nº PAX: 1
TRAYECTO 1:
ORIGEN: Carrer de la Mare de Déu de l'Esperança 10,
DESTINO: El Prat Airport (BCN)
LUGAR DE RECOGIDA: A la salida del terminal (chófer con cartel)
TRAYECTO 2:
ORIGEN: Carrer de la Mare de Déu de l'Esperança 10,
DESTINO: Carrer Doctor Vidal i Ribas 26, Sitges
EXTRAS Y PREFERENCIAS
ASIENTO INFANTIL: 1
PREFERENCIAS: Asiento infantil Grupo 0 (0-13 kg)
PRECIO
IMPORTE TOTAL DEL SERVICIO: 524
NO RESPONDA A ESTE CORREO.
Para cualquier duda, contacte con info@montax.cat
`

describe('parseMontaxEmail', () => {
  it('extrae datos básicos del servicio', () => {
    const result = parseMontaxEmail({
      emailId: 'test-email-123',
      text: emailText,
      receivedAt: '2026-09-09T08:00:27.000Z',
    })

    expect(result.id).toBe('montax-test-email-123')
    expect(result.reference).toBe('MONTAX-160524')
    expect(result.customer).toBe('Iker Bericat Pladevall')
    expect(result.source).toBe('email')
    expect(result.status).toBe('pending_assignment')
  })

  it('extrae origen y destino del primer trayecto', () => {
    const result = parseMontaxEmail({
      emailId: 'test-1',
      text: emailText,
    })

    expect(result.pickupAddress).toBe("Carrer de la Mare de Déu de l'Esperança 10,")
    expect(result.deliveryAddress).toBe('El Prat Airport (BCN)')
  })

  it('extrae fecha y hora correctamente', () => {
    const result = parseMontaxEmail({
      emailId: 'test-2',
      text: emailText,
    })

    expect(result.scheduledAt).toBe('2026-09-13T03:15:00.000Z')
  })

  it('extrae el importe total en céntimos', () => {
    const result = parseMontaxEmail({
      emailId: 'test-3',
      text: emailText,
    })

    expect(result.amountCents).toBe(52400)
  })

  it('incluye información de trayectos y teléfono en el cargo', () => {
    const result = parseMontaxEmail({
      emailId: 'test-4',
      text: emailText,
    })

    expect(result.cargo).toContain('Transfer-As Directed')
    expect(result.cargo).toContain('1 pax')
    expect(result.cargo).toContain('2 trayectos')
    expect(result.cargo).toContain('Tel 687681421')
  })

  it('maneja email simple sin trayectos múltiples', () => {
    const simpleEmail = `ID SERVICIO: 12345
FECHA DEL SERVICIO: 15/09/2026
HORA DEL SERVICIO: 10:00
ORIGEN: Calle Falsa 123
DESTINO: Avenida Siempre Viva 742
TIPO SERVICIO: Transfer
Nº PAX: 2`

    const result = parseMontaxEmail({
      emailId: 'test-5',
      text: simpleEmail,
    })

    expect(result.reference).toBe('MONTAX-12345')
    expect(result.pickupAddress).toBe('Calle Falsa 123')
    expect(result.deliveryAddress).toBe('Avenida Siempre Viva 742')
    expect(result.cargo).toBe('Transfer · 2 pax')
    expect(result.amountCents).toBe(0)
  })

  it('usa fecha actual cuando fecha/hora no son válidas', () => {
    const result = parseMontaxEmail({
      emailId: 'test-6',
      text: 'ID SERVICIO: 999',
    })

    expect(result.reference).toBe('MONTAX-999')
    expect(result.pickupAddress).toBe('Origen pendiente')
    expect(result.deliveryAddress).toBe('Destino pendiente')
    // La fecha debe ser válida (no NaN)
    expect(Number.isNaN(new Date(result.scheduledAt).getTime())).toBe(false)
  })
})
