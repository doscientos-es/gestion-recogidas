import type { IncomingMessage, ServerResponse } from 'node:http'

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

import { parseMontaxEmail } from '../src/features/operations/infrastructure/montax-parser'

function requireServerEnvironment(name: 'SUPABASE_URL' | 'SUPABASE_SECRET_KEY'): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta la variable de servidor ${name}.`)
  return value
}

export default async function handler(
  request: IncomingMessage & { body?: unknown },
  response: ServerResponse,
) {
  if (request.method !== 'POST') {
    response.writeHead(405)
    response.end()
    return
  }
  try {
    const event = request.body as {
      type?: string
      data?: { email_id?: string; created_at?: string }
    }
    if (event.type !== 'email.received' || !event.data?.email_id) {
      response.writeHead(200)
      response.end(JSON.stringify({ ignored: true }))
      return
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
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
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ received: true, order }))
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'application/json' })
    response.end(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Webhook error' }),
    )
  }
}
