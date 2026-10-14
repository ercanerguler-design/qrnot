import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'
import { sql } from '@/lib/db'
import { getOrder, markOrderPaid, type OrderStatus } from '@/lib/commerce/orders'
import { clientIp, consumeRateLimit, ensureGrowthSchema } from '@/lib/growthSchema'
import { DEFAULT_GUESTBOOK_LIMIT } from '@/lib/guestbook'
import { createBlankQRCodes } from '@/lib/qr'
import { SITE_URL } from '@/lib/site'
import { deleteQrWithMedia } from '@/lib/qrDelete'
import { resolveRevenueRange, revenueSummary } from '@/lib/revenue'

// Mağaza / Etsy / NFC üretim yönetimi — tek uç nokta, ADMIN_PASSWORD ile korunur.

export const dynamic = 'force-dynamic'


const ORDER_STATUSES: OrderStatus[] = ['pending', 'awaiting_transfer', 'paid', 'fulfilled', 'shipped', 'delivered', 'failed', 'cancelled', 'refunded']

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers)
    if (!(await consumeRateLimit(`admin-shop:${ip}`, 300, 3600))) {
      return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
    }
    const body = await req.json().catch(() => ({}))
    if (!(await checkAdminPassword(req, body.password))) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
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

    if (action === 'orders.delete') {
      // İptal / iade / ödenmemiş sipariş: siparişin ürettiği dijital ürünlerle birlikte kalıcı olarak silinir.
      const order = await getOrder(String(body.orderNo || ''))
      if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
      const deletable: OrderStatus[] = ['cancelled', 'refunded', 'failed', 'pending', 'awaiting_transfer']
      if (!deletable.includes(order.status)) {
        return NextResponse.json({ error: 'Ödenmiş siparişi silmeden önce İptal ya da İade olarak işaretle.' }, { status: 400 })
      }
      // Müşteri hâlâ ödeme sayfasında olabilir: ödenmemiş sipariş ancak 24 saat sonra silinebilir.
      const unpaid = order.status === 'pending' || order.status === 'awaiting_transfer'
      if (unpaid && Date.now() - new Date(order.created_at).getTime() < 24 * 60 * 60 * 1000) {
        return NextResponse.json({ error: 'Ödeme bekleyen sipariş 24 saat dolmadan silinemez. Önce İptal olarak işaretle.' }, { status: 400 })
      }

      const fulfillment = order.fulfillment || {}

      // 1) Siparişle oluşturulan anı defteri QR'ları (medya ve misafir anılarıyla)
      let deletedQrs = 0
      for (const slug of fulfillment.guestbookSlugs || []) {
        const rows = (await sql`SELECT id FROM qr_codes WHERE slug = ${slug}`) as Array<{ id: string }>
        if (rows.length === 0) continue
        const result = await deleteQrWithMedia(rows[0].id)
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
        deletedQrs += 1
      }

      // 2) Hesaba eklenen dijital QR hakları: sadece kullanılmamış olanlar geri alınabilir
      let creditsRemoved = 0
      const credits = Number(fulfillment.credits || 0)
      if (order.user_id && credits > 0) {
        const before = (await sql`SELECT paid_slots FROM users WHERE id = ${order.user_id}`) as Array<{ paid_slots: number }>
        const after = (await sql`
          UPDATE users
          SET paid_slots = GREATEST(paid_slots - ${credits}, used_slots - LEAST(free_slots, 1), 0),
              updated_at = NOW()
          WHERE id = ${order.user_id}
          RETURNING paid_slots
        `) as Array<{ paid_slots: number }>
        if (before.length && after.length) creditsRemoved = Number(before[0].paid_slots) - Number(after[0].paid_slots)
      }

      // 3) Sipariş kaydı
      await sql`DELETE FROM shop_orders WHERE order_no = ${order.order_no}`

      return NextResponse.json({ ok: true, deletedQrs, credits, creditsRemoved, creditsAlreadyUsed: Math.max(0, credits - creditsRemoved) })
    }

    // --- Gelir tablosu ---------------------------------------------------------------------
    // Sadece gerçekleşen satışlar sayılır: site siparişleri ödendiği andaki tutarla, diğer kanallar elle girilen kayıtlarla.
    // "Sayım başlangıcı" öncesindeki her şey (testler, denemeler) tabloya girmez.
    if (action === 'revenue.summary') {
      const { startDate, from, to } = await resolveRevenueRange(body.from, body.to)
      const rows = await revenueSummary(from, to)
      return NextResponse.json({ startDate, from, to: to === '9999-12-31' ? null : to, rows })
    }

    if (action === 'revenue.setStart') {
      const value = String(body.startDate || '')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NextResponse.json({ error: 'Geçerli bir tarih seç' }, { status: 400 })
      await sql`
        INSERT INTO app_settings (key, value, updated_at) VALUES ('revenue_start_date', ${value}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `
      return NextResponse.json({ ok: true, startDate: value })
    }

    if (action === 'revenue.manual.list') {
      const rows = await sql`
        SELECT id, sale_date::text AS sale_date, channel, kind, amount, currency, quantity, note, created_at
        FROM manual_sales ORDER BY sale_date DESC, created_at DESC LIMIT 300
      `
      return NextResponse.json({ items: rows })
    }

    if (action === 'revenue.manual.add') {
      const channels = ['etsy', 'trendyol', 'hepsiburada', 'kurumsal', 'diger']
      const channel = channels.includes(body.channel) ? String(body.channel) : null
      const kind = body.kind === 'refund' ? 'refund' : 'sale'
      const currency = body.currency === 'USD' ? 'USD' : 'TRY'
      const saleDate = String(body.saleDate || '')
      const amount = Math.round(Number(body.amount) * 100)
      const quantity = Math.min(Math.max(1, Math.floor(Number(body.quantity) || 1)), 100000)
      if (!channel) return NextResponse.json({ error: 'Kanal seç' }, { status: 400 })
      if (!/^\d{4}-\d{2}-\d{2}$/.test(saleDate)) return NextResponse.json({ error: 'Tarih seç' }, { status: 400 })
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Tutar 0\'dan büyük olmalı' }, { status: 400 })
      await sql`
        INSERT INTO manual_sales (sale_date, channel, kind, amount, currency, quantity, note)
        VALUES (${saleDate}::date, ${channel}, ${kind}, ${amount}, ${currency}, ${quantity}, ${String(body.note || '').slice(0, 300)})
      `
      return NextResponse.json({ ok: true })
    }

    if (action === 'revenue.manual.delete') {
      const id = String(body.id || '')
      if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
      await sql`DELETE FROM manual_sales WHERE id = ${id}`
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

    if (action === 'etsy.orders.list') {
      const rows = await sql`
        SELECT o.order_number, o.quantity, o.buyer_name, o.sale_date, o.created_at,
               (SELECT COUNT(*)::int FROM etsy_activations a WHERE a.order_number = o.order_number AND a.status <> 'revoked') AS used
        FROM etsy_orders o
        ORDER BY o.created_at DESC
        LIMIT 500
      `
      return NextResponse.json({ orders: rows })
    }

    if (action === 'etsy.orders.import') {
      const input = Array.isArray(body.orders) ? body.orders.slice(0, 2000) : []
      let imported = 0
      for (const item of input) {
        const orderNumber = String(item?.orderNumber || '').replace(/[\s#]/g, '')
        if (!/^\d{8,12}$/.test(orderNumber)) continue
        const quantity = Math.min(Math.max(1, Math.floor(Number(item?.quantity) || 1)), 100)
        const buyerName = String(item?.buyerName || '').slice(0, 160)
        const saleDate = String(item?.saleDate || '').slice(0, 32)
        await sql`
          INSERT INTO etsy_orders (order_number, quantity, buyer_name, sale_date)
          VALUES (${orderNumber}, ${quantity}, ${buyerName}, ${saleDate})
          ON CONFLICT (order_number) DO UPDATE
            SET quantity = EXCLUDED.quantity,
                buyer_name = CASE WHEN EXCLUDED.buyer_name <> '' THEN EXCLUDED.buyer_name ELSE etsy_orders.buyer_name END,
                sale_date = CASE WHEN EXCLUDED.sale_date <> '' THEN EXCLUDED.sale_date ELSE etsy_orders.sale_date END
        `
        imported += 1
      }
      return NextResponse.json({ ok: true, imported, skipped: input.length - imported })
    }

    if (action === 'etsy.orders.delete') {
      await sql`DELETE FROM etsy_orders WHERE order_number = ${String(body.orderNumber || '')}`
      return NextResponse.json({ ok: true })
    }

    if (action === 'etsy.update') {
      const status = body.status === 'verified' || body.status === 'revoked' || body.status === 'pending' ? body.status : null
      if (!status) return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })
      const id = String(body.id || '')
      // İptal = QR'ı tüm içeriğiyle sil (aktivasyon kaydı CASCADE ile gider).
      if (status === 'revoked') {
        const found = (await sql`SELECT qr_id FROM etsy_activations WHERE id = ${id}`) as Array<{ qr_id: string }>
        if (found.length === 0) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
        const result = await deleteQrWithMedia(found[0].qr_id)
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
        return NextResponse.json({ ok: true, deleted: true })
      }
      const rows = (await sql`
        UPDATE etsy_activations SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING qr_id
      `) as Array<{ qr_id: string }>
      if (rows.length === 0) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
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
