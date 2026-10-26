import { notifyAdmin } from '@/lib/adminNotify'
import { trackPurchase } from '@/lib/analytics'
import { randomBytes } from 'crypto'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'
import { DEFAULT_GUESTBOOK_LIMIT } from '@/lib/guestbook'
import { createBlankQRCodes } from '@/lib/qr'
import { SITE_URL } from '@/lib/site'
import { formatMoney, type Currency, type PricedLine } from '@/lib/commerce/catalog'

export type OrderStatus = 'pending' | 'awaiting_transfer' | 'paid' | 'fulfilled' | 'shipped' | 'delivered' | 'failed' | 'cancelled' | 'refunded'

export type PaymentProvider = 'paytr' | 'transfer' | 'mock'
/** Eski siparişlerde kalan, artık kullanılmayan ödeme yöntemleri */
type LegacyProvider = 'iyzico' | 'stripe'

export interface OrderAddress {
  line: string
  district: string
  city: string
  postalCode: string
  country: string
}

export interface ShopOrder {
  id: string
  order_no: string
  access_key: string
  status: OrderStatus
  provider: PaymentProvider | LegacyProvider
  provider_ref: string | null
  currency: Currency
  subtotal: number
  shipping: number
  total: number
  lang: 'tr' | 'en'
  user_id: string | null
  email: string
  full_name: string
  phone: string
  address: OrderAddress | null
  items: PricedLine[]
  consents: Record<string, unknown> | null
  fulfillment: { credits?: number; guestbookSlugs?: string[]; premiumYears?: number; fulfilledAt?: string } | null
  customer_note: string
  admin_note: string
  tracking_no: string
  client_ip: string
  paid_at: string | null
  fulfilled_at: string | null
  created_at: string
  updated_at: string
}

function generateOrderNo() {
  const now = new Date()
  const ymd = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(5)
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  return `QN${ymd}${suffix}`
}

export async function createOrder(input: {
  provider: PaymentProvider
  currency: Currency
  subtotal: number
  shipping: number
  total: number
  lang: 'tr' | 'en'
  userId: string | null
  email: string
  fullName: string
  phone: string
  address: OrderAddress | null
  items: PricedLine[]
  consents: Record<string, unknown>
  customerNote: string
  clientIp: string
}) {
  await ensureGrowthSchema()
  const accessKey = randomBytes(18).toString('hex')
  const status: OrderStatus = input.provider === 'transfer' ? 'awaiting_transfer' : 'pending'

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNo = generateOrderNo()
    try {
      const rows = (await sql`
        INSERT INTO shop_orders (
          order_no, access_key, status, provider, currency, subtotal, shipping, total, lang, user_id,
          email, full_name, phone, address, items, consents, customer_note, client_ip
        ) VALUES (
          ${orderNo}, ${accessKey}, ${status}, ${input.provider}, ${input.currency}, ${input.subtotal}, ${input.shipping},
          ${input.total}, ${input.lang}, ${input.userId}, ${input.email}, ${input.fullName}, ${input.phone},
          ${input.address ? JSON.stringify(input.address) : null}::jsonb, ${JSON.stringify(input.items)}::jsonb,
          ${JSON.stringify(input.consents)}::jsonb, ${input.customerNote}, ${input.clientIp}
        )
        RETURNING *
      `) as unknown as ShopOrder[]
      return rows[0]
    } catch (error) {
      if (error instanceof Error && /duplicate key/i.test(error.message)) continue
      throw error
    }
  }
  throw new Error('Sipariş numarası üretilemedi')
}

export async function getOrder(orderNo: string) {
  await ensureGrowthSchema()
  const rows = (await sql`SELECT * FROM shop_orders WHERE order_no = ${orderNo} LIMIT 1`) as unknown as ShopOrder[]
  return rows[0] || null
}

export async function setOrderProviderRef(orderNo: string, providerRef: string) {
  await sql`UPDATE shop_orders SET provider_ref = ${providerRef}, updated_at = NOW() WHERE order_no = ${orderNo}`
}

export async function markOrderFailed(orderNo: string, reason: string) {
  await sql`
    UPDATE shop_orders
    SET status = 'failed', admin_note = CONCAT(admin_note, ${`\n[${new Date().toISOString()}] ${reason}`}), updated_at = NOW()
    WHERE order_no = ${orderNo} AND status = 'pending'
  `
}

/**
 * Siparişi ödendi olarak işaretler ve dijital ürünleri teslim eder.
 * Aynı sipariş için birden fazla çağrılsa da teslim yalnızca bir kez yapılır.
 */
export async function markOrderPaid(orderNo: string, providerRef: string | null, extra?: { address?: OrderAddress | null; phone?: string }) {
  await ensureGrowthSchema()
  const rows = (await sql`
    UPDATE shop_orders
    SET status = 'paid',
        provider_ref = COALESCE(${providerRef}, provider_ref),
        address = COALESCE(address, ${extra?.address ? JSON.stringify(extra.address) : null}::jsonb),
        phone = CASE WHEN phone = '' THEN ${extra?.phone || ''} ELSE phone END,
        paid_at = NOW(),
        updated_at = NOW()
    WHERE order_no = ${orderNo} AND status IN ('pending', 'awaiting_transfer', 'failed')
    RETURNING *
  `) as unknown as ShopOrder[]

  const order = rows[0]
  if (!order) return { order: await getOrder(orderNo), transitioned: false }

  const fulfilled = await fulfillDigital(order)
  await notifyNewOrder(fulfilled).catch((error) => console.error('[order notify]', error))
  if (order.provider !== 'mock') await trackPurchase(order.order_no, Number(order.total), String(order.currency))
  return { order: fulfilled, transitioned: true }
}

async function fulfillDigital(order: ShopOrder): Promise<ShopOrder> {
  const credits = order.items.filter((line) => line.productId === 'dijital-qr').reduce((sum, line) => sum + line.quantity, 0)
  const guestbooks = order.items.filter((line) => line.productId === 'ani-defteri').reduce((sum, line) => sum + line.quantity, 0)
  const premiumYears = order.items.filter((line) => line.productId === 'premium').reduce((sum, line) => sum + line.quantity, 0)
  const hasPhysical = order.items.some((line) => line.physical)

  const fulfillment: NonNullable<ShopOrder['fulfillment']> = { ...(order.fulfillment || {}) }

  if (order.user_id && credits > 0) {
    await sql`UPDATE users SET paid_slots = paid_slots + ${credits}, updated_at = NOW() WHERE id = ${order.user_id}`
    fulfillment.credits = credits
  }

  if (order.user_id && guestbooks > 0) {
    const created = await createBlankQRCodes(guestbooks, SITE_URL, { orderType: 'individual', creatorUserId: order.user_id })
    const settings = JSON.stringify({
      eventName: '',
      welcome: '',
      open: true,
      moderation: true,
      publicWall: false,
      pinHash: null,
      entryLimit: DEFAULT_GUESTBOOK_LIMIT,
    })
    for (const item of created) {
      await sql`
        UPDATE qr_codes
        SET qr_mode = 'guestbook', guestbook_settings = ${settings}::jsonb, source_channel = 'shop'
        WHERE slug = ${item.slug}
      `
    }
    fulfillment.guestbookSlugs = created.map((item) => item.slug)
  }

  if (order.user_id && premiumYears > 0) {
    // Süre bitmemişse üstüne eklenir; bittiyse bugünden başlar
    await sql`
      UPDATE users
      SET premium_until = GREATEST(COALESCE(premium_until, NOW()), NOW()) + make_interval(years => ${premiumYears}),
          updated_at = NOW()
      WHERE id = ${order.user_id}
    `
    fulfillment.premiumYears = premiumYears
  }

  fulfillment.fulfilledAt = new Date().toISOString()
  const nextStatus: OrderStatus = hasPhysical ? 'paid' : 'fulfilled'

  const rows = (await sql`
    UPDATE shop_orders
    SET fulfillment = ${JSON.stringify(fulfillment)}::jsonb,
        status = ${nextStatus},
        fulfilled_at = CASE WHEN ${nextStatus} = 'fulfilled' THEN NOW() ELSE fulfilled_at END,
        updated_at = NOW()
    WHERE id = ${order.id}
    RETURNING *
  `) as unknown as ShopOrder[]
  return rows[0] || order
}

async function notifyNewOrder(order: ShopOrder) {
  const target = String(process.env.SHOP_NOTIFY_WHATSAPP || process.env.WHATSAPP_TO_NUMBER || '').trim()
  const lines = order.items.map((line) => `• ${line.quantity}× ${line.name}${line.variantLabel ? ` (${line.variantLabel})` : ''}`).join('\n')
  const text = [
    `🛒 Yeni ödeme alındı — ${order.order_no}`,
    `Tutar: ${formatMoney(order.total, order.currency)} (${order.provider})`,
    `Müşteri: ${order.full_name} · ${order.email} · ${order.phone}`,
    lines,
    order.address ? `Adres: ${order.address.line}, ${order.address.district} ${order.address.city} ${order.address.country}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  await notifyAdmin({
    title: `🛒 Yeni ödeme: ${formatMoney(order.total, order.currency)}`,
    body: `${order.order_no} · ${order.full_name}
${order.items.map((line) => `${line.quantity}× ${line.name}`).join(', ')}`,
    url: `/admin?tab=orders`,
    whatsappText: text,
    whatsappTo: target || undefined,
  })
}
