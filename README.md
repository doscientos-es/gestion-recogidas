# Gestión de recogidas

Demo comercial del flujo completo de transporte: entrada de una solicitud con adjunto,
creación de la orden, planificación, asignación de conductor y vehículo, aviso por email,
WhatsApp, calendario, cierre del viaje y preparación de la factura para Kabiku.

## Recorrido de demostración

1. En **Dashboard**, abrir la solicitud de Logística Ibérica recibida por correo.
2. En **Viajes recibidos**, crear la orden a partir del adjunto ya analizado.
3. Asignar a David Roca y la Mercedes Sprinter.
4. Abrir el WhatsApp precompletado y descargar la invitación `.ics`.
5. Marcar el viaje como completado y enviarlo a Kabiku desde **Facturación**.
6. Revisar disponibilidad y mantenimiento en **Vehículos** y abrir Movildata.

Los datos son sintéticos pero concretos. El modo inicial persiste interacciones en
`localStorage`, por lo que la demo funciona sin servicios externos ni credenciales.

## Arquitectura

| Área                                     | Propósito                                                         |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `src/features/operations/application`    | Tipos, estado y reglas del workflow.                              |
| `src/features/operations/infrastructure` | Persistencia local/Supabase y notificaciones.                     |
| `src/features/operations/ui`             | Dashboard, viajes, calendario, facturación y flota.               |
| `api/inbound-email.ts`                   | Función Vercel que verifica webhooks de Resend y persiste emails. |
| `src/routes`                             | Rutas tipadas de TanStack Router.                                 |

La URL pertenece a TanStack Router, la caché remota a TanStack Query y las primitivas
visuales a `@doscientos/ui`. Las rutas no conocen Supabase ni Resend.

## Variables de entorno

Copiar `.env.example` a `.env.local`. Para la presentación no hace falta modificar nada.

- Para enviar un correo real: configurar en Vercel `RESEND_API_KEY`,
  `RESEND_FROM_EMAIL` y `DEMO_NOTIFICATION_RECIPIENT`, y activar
  `VITE_ENABLE_EMAIL_SEND=true`. El remitente debe pertenecer a un dominio
  verificado en Resend y las variables públicas requieren un nuevo build.
- `DEMO_NOTIFICATION_RECIPIENT` fija el único buzón receptor y evita que el endpoint
  público pueda utilizarse para enviar a direcciones arbitrarias.
- Para correo entrante: configurar `RESEND_API_KEY`, `INBOUND_WEBHOOK_SECRET`,
  `SUPABASE_URL` y `SUPABASE_SECRET_KEY` sólo en Vercel. El endpoint
  `/api/inbound-email` valida la firma de Resend antes de leer o persistir el correo.
- Para persistencia remota: aplicar la migración incluida, habilitar los inicios de
  sesión anónimos y usar `VITE_DATA_MODE=supabase`, URL y publishable key. Nunca
  exponer una service role.

## Desarrollo y despliegue

- `pnpm dev`: servidor local.
- `pnpm quality`: formato, lint, arquitectura, TypeScript y tests.
- `pnpm build`: bundle de producción.
- En Vercel, seleccionar este directorio como root; el framework se detecta como Vite.
- `vercel.json` conserva las rutas de la SPA y deja `/api/inbound-email` como función.

Kabiku y Movildata se abren como integraciones externas. Sus escrituras permanecen en
modo demostración hasta disponer de documentación y credenciales API aprobadas.
