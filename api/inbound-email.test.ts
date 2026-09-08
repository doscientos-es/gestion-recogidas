import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getEmail, upsert, verify } = vi.hoisted(() => ({
  getEmail: vi.fn(),
  upsert: vi.fn(),
  verify: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { receiving: { get: getEmail } },
    webhooks: { verify },
  })),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn(() => ({ upsert })) })),
}))

import handler from './inbound-email'

function request(body: string, headers: Record<string, string> = {}) {
  return Object.assign(Readable.from([body]), {
    headers,
    method: 'POST',
  }) as unknown as IncomingMessage
}

function response() {
  const result = {
    body: '',
    headers: {} as Record<string, string>,
    status: 0,
    end(body?: string) {
      this.body = body ?? ''
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value
    },
    writeHead(status: number) {
      this.status = status
      return this
    },
  }
  return result as unknown as ServerResponse & typeof result
}

beforeEach(() => {
  process.env.INBOUND_WEBHOOK_SECRET = 'test-webhook-secret'
  process.env.RESEND_API_KEY = 'test-api-key'
  process.env.SUPABASE_SECRET_KEY = 'test-service-key'
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  getEmail.mockReset()
  upsert.mockReset()
  verify.mockReset()
})

describe('inbound email webhook', () => {
  it('rejects a request without the required signature headers', async () => {
    const result = response()

    await handler(request('{"type":"email.received"}'), result)

    expect(result.status).toBe(400)
    expect(verify).not.toHaveBeenCalled()
  })

  it('rejects a webhook whose signature cannot be verified', async () => {
    verify.mockImplementation(() => {
      throw new Error('invalid signature')
    })
    const result = response()

    await handler(request('{"type":"email.received"}', signedHeaders()), result)

    expect(result.status).toBe(401)
    expect(getEmail).not.toHaveBeenCalled()
  })

  it('verifies the raw payload and persists a received email', async () => {
    const payload = '{"raw":"payload"}'
    verify.mockReturnValue({
      type: 'email.received',
      data: { created_at: '2026-09-08T10:00:00.000Z', email_id: 'email-1' },
    })
    getEmail.mockResolvedValue({
      data: { html: null, subject: 'Servicio', text: 'ID SERVICIO: 99' },
      error: null,
    })
    upsert.mockResolvedValue({ error: null })
    const result = response()

    await handler(request(payload, signedHeaders()), result)

    expect(verify).toHaveBeenCalledWith(
      expect.objectContaining({ payload, webhookSecret: 'test-webhook-secret' }),
    )
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ resend_email_id: 'email-1' }),
      { onConflict: 'resend_email_id' },
    )
    expect(result.status).toBe(200)
    expect(result.body).toBe('{"received":true}')
  })
})

function signedHeaders() {
  return {
    'svix-id': 'message-id',
    'svix-signature': 'signature',
    'svix-timestamp': '1736323200',
  }
}