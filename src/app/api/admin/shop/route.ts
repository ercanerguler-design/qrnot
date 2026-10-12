import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { sql } from '@/lib/db'
import { getOrder, markOrderPaid, type OrderStatus } from '@/lib/commerce/orders'
import { clientIp, consumeRateLimit, ensureGrowthSchema } from '@/lib/growthSchema'
import { DEFAULT_GUESTBOOK_LIMIT } from '@/lib/guestbook'
import { createBlankQRCodes } from '@/lib/qr'
import { SITE_URL } from '@/lib/site'

// Mağaza / Etsy / NFC üretim yönetimi — tek uç nokta, ADMIN_PASSWORD ile korunur.

export const dynamic = 'force-dynamic'

function passwordOk(provided: unknown) {
  const configured = String(process.env.ADMIN_PASSWORD || '').trim()
  const given = String(provided || '').trim()
  if (!configured || !given) return false
  const a = createHash('sha256').update(configured).digest()
  const b = createHash('sha256').update(given).digest()
  return timingSafeEqual(a, b)
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'awaiting_transfer', 'paid', 'fulfilled', 'shipped', 'delivered', 'failed', 'cancelled', 'refunded']

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers)
    if (!(await consumeRateLimit(`admin-shop:${ip}`, 300, 3600))) {
      return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
    }
    const body = await req.json().catch(() => ({}))
    if (!passwordOk(body.password)) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    await ensureGrowthSchema()

    const action = String(body.action || '')

    if (action === 'orders.list') {
      const status = ORDER_STATUSES.includes(body.status) ? body.status : null
      const q = String(body.q || '').trim()
      const like = `%${q}%`
      const orders = await sql`
        SELECT order_no, access_key, status, provider, provider_ref, currency, subtotal, shipping, total, lang, email, full_name, phone,
               address, items, fulfillment, customer_note, admin_note, tracking_no, paid_at, created_at
        FROM shop_orders
        WHERE (${status}::text IS NULL OR status = ${status})
          AND (${q} = '' OR order_no ILIKE ${like} OR email ILIKE ${like} OR full_name ILIKE ${like})
        ORDER BY created_at DESC
        LIMIT 200
      `
      const summary = await sql`
        SELECT status, currency, COUNT(*)::int AS count, COALESCE(SUM(total), 0)::bigint AS total
        FROM shop_orders GROUP BY status, currency
      `
      return NextResponse.json({ orders, summary })
    }

    if (action === 'orders.update') {
      const orderNo = String(body.orderNo || '')
      const status = ORDER_STATUSES.includes(body.status) ? (body.status as OrderStatus) : null
      const rows = await sql`
        UPDATE shop_orders
        SET status = COALESCE(${status}, status),
            tracking_no = COALESCE(${typeof body.trackingNo === 'string' ? body.trackingNo.trim().slice(0, 80) : null}, tracking_no),
            admin_note = COALESCE(${typeof body.adminNote === 'string' ? body.adminNote.slice(0, 2000) : null}, admin_note),
            updated_at = NOW()
        WHERE order_no = ${orderNo}
        RETURNING order_no
      `
      if (rows.length === 0) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'orders.markPaid') {
      const order = await getOrder(String(body.orderNo || ''))
      if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
      const result = await markOrderPaid(order.order_no, `manual-${new Date().toISOString()}`)
      return NextResponse.json({ ok: true, transitioned: result.transitioned })
    }

    if (action === 'etsy.list') {
      const rows = await sql`
        SELECT a.id, a.order_number, a.email, a.product, a.status, a.client_ip, a.admin_note, a.created_at,
               q.slug, q.is_claimed, q.is_active, q.play_count
        FROM etsy_activations a JOIN qr_codes q ON q.id = a.qr_id
        ORDER BY a.created_at DESC
        LIMIT 300
      `
      return NextResponse.json({ activations: rows })
    }

    if (action === 'etsy.update') {
      const status = body.status === 'verified' || body.status === 'revoked' || body.status === 'pending' ? body.status : null
      if (!status) return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })
      const rows = (await sql`
        UPDATE etsy_activations SET status = ${status}, updated_at = NOW() WHERE id = ${String(body.id || '')} RETURNING qr_id
      `) as Array<{ qr_id: string }>
      if (rows.length === 0) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
      await sql`UPDATE qr_codes SET is_active = ${status !== 'revoked'}, updated_at = NOW() WHERE id = ${rows[0].qr_id}`
      return NextResponse.json({ ok: true })
    }

    if (action === 'qr.batch') {
      // Fiziksel ürün üretimi için toplu boş QR (kolye / anahtarlık / anı defteri)
      const count = Math.min(Math.max(1, Number(body.count) || 1), 500)
      const mode = body.mode === 'guestbook' ? 'guestbook' : 'standard'
      const channel =
        String(body.channel || 'production')
          .replace(/[^a-z0-9-]/gi, '')
          .slice(0, 24) || 'production'
      const created = await createBlankQRCodes(count, SITE_URL, { orderType: 'individual' })
      const settings =
        mode === 'guestbook'
          ? JSON.stringify({ eventName: '', welcome: '', open: true, moderation: true, publicWall: false, pinHash: null, entryLimit: DEFAULT_GUESTBOOK_LIMIT })
          : null
      for (const item of created) {
        await sql`
          UPDATE qr_codes SET qr_mode = ${mode}, guestbook_settings = ${settings}::jsonb, source_channel = ${channel}
          WHERE slug = ${item.slug}
        `
      }
      return NextResponse.json({
        created: created.map((item) => ({ slug: item.slug, qrUrl: `${SITE_URL}/q/${item.slug}`, nfcUrl: `${SITE_URL}/n/${item.slug}` })),
      })
    }

    if (action === 'nfc.list') {
      const onlyPending = body.onlyPending !== false
      const channel = String(body.channel || '').trim()
      const rows = await sql`
        SELECT slug, is_claimed, qr_mode, source_channel, nfc_encoded_at, nfc_locked, nfc_scan_count, created_at
        FROM qr_codes
        WHERE is_demo = FALSE
          AND (${onlyPending} = FALSE OR nfc_encoded_at IS NULL)
          AND (${channel} = '' OR source_channel = ${channel})
        ORDER BY created_at DESC
        LIMIT 500
      `
      return NextResponse.json({ items: rows })
    }

    if (action === 'nfc.mark') {
      const rows = await sql`
        UPDATE qr_codes SET nfc_encoded_at = NOW(), nfc_locked = nfc_locked OR ${body.locked === true}, updated_at = NOW()
        WHERE slug = ${String(body.slug || '')}
        RETURNING slug
      `
      if (rows.length === 0) return NextResponse.json({ error: 'QR bulunamadı' }, { status: 404 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'qr.setMode') {
      // Mevcut bir QR'ı anı defterine çevirir (ör. müşteri talebiyle).
      const mode = body.mode === 'guestbook' ? 'guestbook' : 'standard'
      const settings =
        mode === 'guestbook'
          ? JSON.stringify({ eventName: '', welcome: '', open: true, moderation: true, publicWall: false, pinHash: null, entryLimit: DEFAULT_GUESTBOOK_LIMIT })
          : null
      const rows = await sql`
        UPDATE qr_codes
        SET qr_mode = ${mode},
            guestbook_settings = CASE WHEN ${mode} = 'guestbook' THEN COALESCE(guestbook_settings, ${settings}::jsonb) ELSE guestbook_settings END,
            updated_at = NOW()
        WHERE slug = ${String(body.slug || '')}
        RETURNING slug
      `
      if (rows.length === 0) return NextResponse.json({ error: 'QR bulunamadı' }, { status: 404 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Bilinmeyen işlem' }, { status: 400 })
  } catch (err) {
    console.error('[admin/shop]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
