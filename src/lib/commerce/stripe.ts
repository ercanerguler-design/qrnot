import { createHmac, timingSafeEqual } from 'crypto'

// Stripe Checkout — resmi REST API (SDK gerektirmez).
// Ortam değişkenleri: STRIPE_SECRET_KEY (sk_test_… / sk_live_…), STRIPE_WEBHOOK_SECRET (whsec_…)

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

async function stripeRequest<T>(method: 'GET' | 'POST', path: string, params?: URLSearchParams): Promise<T> {
  const key = String(process.env.STRIPE_SECRET_KEY || '').trim()
  if (!key) throw new Error('Stripe yapılandırılmamış')
  const res = await fetch(`https://api.stripe.com/v1${path}${method === 'GET' && params ? `?${params}` : ''}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20',
    },
    body: method === 'POST' ? params?.toString() : undefined,
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
  if (!res.ok) throw new Error(data.error?.message || `Stripe hatası (${res.status})`)
  return data
}

export interface StripeLine {
  name: string
  unitAmount: number
  quantity: number
}

export async function createStripeCheckout(input: {
  orderNo: string
  email: string
  lines: StripeLine[]
  shipping: number
  successUrl: string
  cancelUrl: string
  collectShipping: boolean
  locale: 'tr' | 'en'
}) {
  const params = new URLSearchParams()
  params.set('mode', 'payment')
  params.set('success_url', input.successUrl)
  params.set('cancel_url', input.cancelUrl)
  params.set('customer_email', input.email)
  params.set('client_reference_id', input.orderNo)
  params.set('metadata[order_no]', input.orderNo)
  params.set('payment_intent_data[metadata][order_no]', input.orderNo)
  params.set('locale', input.locale === 'tr' ? 'tr' : 'en')

  const lines = [...input.lines]
  if (input.shipping > 0) lines.push({ name: 'Shipping', unitAmount: input.shipping, quantity: 1 })
  lines.forEach((line, index) => {
    params.set(`line_items[${index}][quantity]`, String(line.quantity))
    params.set(`line_items[${index}][price_data][currency]`, 'usd')
    params.set(`line_items[${index}][price_data][unit_amount]`, String(line.unitAmount))
    params.set(`line_items[${index}][price_data][product_data][name]`, line.name)
  })

  if (input.collectShipping) {
    const countries = String(process.env.STRIPE_SHIPPING_COUNTRIES || 'US,GB,DE,FR,NL,BE,IT,ES,AT,CH,SE,NO,DK,IE,CA,AU,TR')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
    countries.forEach((country, index) => params.set(`shipping_address_collection[allowed_countries][${index}]`, country))
    params.set('phone_number_collection[enabled]', 'true')
  }

  const session = await stripeRequest<{ id: string; url: string }>('POST', '/checkout/sessions', params)
  return session
}

export interface StripeSession {
  id: string
  payment_status: 'paid' | 'unpaid' | 'no_payment_required'
  status: string
  client_reference_id: string | null
  amount_total: number | null
  currency: string | null
  payment_intent: string | null
  metadata?: Record<string, string>
  customer_details?: { name?: string; phone?: string; address?: Record<string, string | null> } | null
  shipping_details?: { name?: string; address?: Record<string, string | null> } | null
  collected_information?: { shipping_details?: { name?: string; address?: Record<string, string | null> } | null } | null
}

export function retrieveStripeSession(id: string) {
  return stripeRequest<StripeSession>('GET', `/checkout/sessions/${encodeURIComponent(id)}`)
}

/** Stripe-Signature başlığını doğrular (5 dk tolerans). */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string) {
  if (!header || !secret) return false
  const parts = Object.fromEntries(
    header.split(',').map((part) => {
      const [k, ...rest] = part.split('=')
      return [k.trim(), rest.join('=')]
    })
  ) as Record<string, string>
  const timestamp = Number(parts.t)
  const provided = header
    .split(',')
    .filter((part) => part.trim().startsWith('v1='))
    .map((part) => part.trim().slice(3))
  if (!timestamp || provided.length === 0) return false
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  return provided.some((sig) => {
    const buf = Buffer.from(sig, 'hex')
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf)
  })
}
