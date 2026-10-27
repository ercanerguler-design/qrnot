import { createHash } from 'crypto'

// Meta Dönüşümler API'si (Conversions API): ödeme sağlayıcısı onayı geldiğinde satın almayı sunucudan Meta'ya bildirir.
// Yalnızca müşteri ödeme anında çerez onayı vermişse (consents.meta) gönderilir. META_CAPI_TOKEN yoksa hiçbir şey yapmaz.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1296303192108755'
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0'

const sha = (value: string) => createHash('sha256').update(value).digest('hex')

/** Meta'nın beklediği biçim: e-posta küçük harf; telefon sadece rakam, ülke koduyla (TR için 90…) */
function normalizePhone(phone: string) {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `90${digits.slice(1)}`
  else if (digits.length === 10 && digits.startsWith('5')) digits = `90${digits}`
  return digits
}

export type MetaConsent = { fbp?: string; fbc?: string }

/** Ödeme başlatılırken çağrılır: ziyaretçi Meta çerezlerine onay verdiyse eşleştirme bilgilerini döndürür. */
export function readMetaConsent(cookies: { get(name: string): { value: string } | undefined }): MetaConsent | null {
  if (cookies.get('qrnot_consent')?.value !== 'all') return null
  const clean = (v?: string) => (v && /^fb\.\d\.\d+\.[\w.-]{1,200}$/.test(v) ? v : undefined)
  return { fbp: clean(cookies.get('_fbp')?.value), fbc: clean(cookies.get('_fbc')?.value) }
}

export async function sendMetaPurchase(order: {
  order_no: string
  total: number
  currency: string
  email: string
  phone: string
  items: Array<{ productId: string; quantity: number }>
  consents: Record<string, unknown> | null
}) {
  const token = String(process.env.META_CAPI_TOKEN || '').trim()
  const meta = order.consents?.meta as MetaConsent | undefined
  if (!token || !meta) return

  const userData: Record<string, unknown> = {}
  if (order.email) userData.em = [sha(order.email.trim().toLowerCase())]
  const phone = normalizePhone(order.phone || '')
  if (phone.length >= 10) userData.ph = [sha(phone)]
  if (meta.fbp) userData.fbp = meta.fbp
  if (meta.fbc) userData.fbc = meta.fbc
  const ua = typeof order.consents?.userAgent === 'string' ? order.consents.userAgent : ''
  if (ua) userData.client_user_agent = ua

  const body = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: `purchase-${order.order_no}`,
        action_source: 'website',
        event_source_url: 'https://www.qrnot.com/cart',
        user_data: userData,
        custom_data: {
          value: Number(order.total) / 100,
          currency: order.currency,
          order_id: order.order_no,
          content_type: 'product',
          content_ids: order.items.map((line) => line.productId),
          num_items: order.items.reduce((sum, line) => sum + line.quantity, 0),
        },
      },
    ],
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) console.error('[meta capi]', res.status, (await res.text()).slice(0, 300))
  } catch (error) {
    console.error('[meta capi]', error)
  }
}
