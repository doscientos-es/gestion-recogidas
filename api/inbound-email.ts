import type { IncomingMessage, ServerResponse } from 'node:http'

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

import { parseMontaxEmail } from '../src/features/operations/infrastructure/montax-parser'

const MAX_BODY_BYTES = 1_000_000

export const config = { api: { bodyParser: false } }

class PayloadTooLargeError extends Error {}

function requireServerEnvironment(
  name: 'INBOUND_WEBHOOK_SECRET' | 'RESEND_API_KEY' | 'SUPABASE_URL' | 'SUPABASE_SECRET_KEY',
): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta la variable de servidor ${name}.`)
  return value
}

function header(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name]
  return typeof value === 'string' ? value : undefined
}

async function readRawBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let length = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    length += buffer.length
    if (length > MAX_BODY_BYTES) throw new PayloadTooLargeError()
    chunks.push(buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function sendJson(response: ServerResponse, status: number, body: object) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(body))
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Método no permitido' })
    return
  }
  try {
    const payload = await readRawBody(request)
    const id = header(request, 'svix-id')
    const timestamp = header(request, 'svix-timestamp')
    const signature = header(request, 'svix-signature')
    if (!id || !timestamp || !signature) {
      sendJson(response, 400, { error: 'Cabeceras de firma incompletas' })
      return
    }
    const resend = new Resend(requireServerEnvironment('RESEND_API_KEY'))
    let event
    try {
      event = resend.webhooks.verify({
        payload,
        headers: { id, timestamp, signature },
        webhookSecret: requireServerEnvironment('INBOUND_WEBHOOK_SECRET'),
      })
    } catch {
      sendJson(response, 401, { error: 'Firma de webhook no válida' })
      return
    }
    if (event.type !== 'email.received' || !event.data?.email_id) {
      sendJson(response, 200, { ignored: true })
      return
    }
    const result = await resend.emails.receiving.get(event.data.email_id)
    if (result.error || !result.data)
      throw new Error(result.error?.message ?? 'No se pudo recuperar el email')
    const order = parseMontaxEmail({
      emailId: event.data.email_id,
      ...(event.data.created_at ? { receivedAt: event.data.created_at } : {}),
      ...(result.data.text !== null ? { text: result.data.text } : {}),
      ...(result.data.html !== null ? { html: result.data.html } : {}),
    })
    const db = createClient(
      requireServerEnvironment('SUPABASE_URL'),
      requireServerEnvironment('SUPABASE_SECRET_KEY'),
    )
    const saved = await db.from('inbound_emails').upsert(
      {
        resend_email_id: event.data.email_id,
        parsed_order: order,
        received_at: event.data.created_at ?? new Date().toISOString(),
        subject: result.data.subject ?? null,
      },
      { onConflict: 'resend_email_id' },
    )
    if (saved.error) throw saved.error
    sendJson(response, 200, { received: true })
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      sendJson(response, 413, { error: 'Carga demasiado grande' })
      return
    }
    sendJson(response, 500, { error: 'No se ha podido procesar el webhook' })
  }
}
