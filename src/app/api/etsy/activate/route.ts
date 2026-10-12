import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { clientIp, consumeRateLimit, ensureGrowthSchema } from '@/lib/growthSchema'
import { DEFAULT_GUESTBOOK_LIMIT } from '@/lib/guestbook'
import { createBlankQRCodes } from '@/lib/qr'
import { SITE_URL } from '@/lib/site'

// Etsy alıcısı sipariş numarası + e-posta ile kendine özel QR üretir.
// Kayıtlar admin panelinde "Etsy" sekmesinde doğrulanır; sahte siparişler iptal edilebilir.

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (process.env.ETSY_ACTIVATION_DISABLED === '1') {
      return NextResponse.json({ error: 'Activation is temporarily unavailable.' }, { status: 503 })
    }
    await ensureGrowthSchema()

    const ip = clientIp(req.headers)
    if (!(await consumeRateLimit(`etsy:${ip}`, 8, 3600))) {
      return NextResponse.json({ error: 'Too many attempts. Please try again in an hour.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const orderNumber = String(body.orderNumber || '').replace(/[\s#]/g, '')
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
      .slice(0, 255)
    const product = body.product === 'guestbook' ? 'guestbook' : 'standard'

    if (!/^\d{8,12}$/.test(orderNumber)) {
      return NextResponse.json({ error: 'Please enter the order number from your Etsy receipt (digits only).' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const maxPerOrder = Math.max(1, Number(process.env.ETSY_MAX_PER_ORDER) || 3)
    const existing = (await sql`
      SELECT a.email, q.slug, a.status
      FROM etsy_activations a JOIN qr_codes q ON q.id = a.qr_id
      WHERE a.order_number = ${orderNumber}
      ORDER BY a.created_at ASC
    `) as Array<{ email: string; slug: string; status: string }>

    if (existing.some((row) => row.status === 'revoked')) {
      return NextResponse.json({ error: 'This order could not be verified. Please contact us via Etsy messages.' }, { status: 403 })
    }
    if (existing.length > 0 && existing[0].email !== email) {
      return NextResponse.json({ error: 'This order number was activated with a different email. Please contact us via Etsy messages.' }, { status: 409 })
    }
    if (existing.length >= maxPerOrder) {
      return NextResponse.json(
        {
          error: `This order already has ${existing.length} activated QR codes. Need more? Message us on Etsy.`,
          existing: existing.map((row) => row.slug),
        },
        { status: 409 }
      )
    }

    const [created] = await createBlankQRCodes(1, SITE_URL, { orderType: 'individual' })
    const qrRows = (await sql`
      UPDATE qr_codes
      SET source_channel = 'etsy',
          qr_mode = ${product === 'guestbook' ? 'guestbook' : 'standard'},
          guestbook_settings = ${
            product === 'guestbook'
              ? JSON.stringify({
                  eventName: '',
                  welcome: '',
                  open: true,
                  moderation: true,
                  publicWall: false,
                  pinHash: null,
                  entryLimit: DEFAULT_GUESTBOOK_LIMIT,
                })
              : null
          }::jsonb
      WHERE slug = ${created.slug}
      RETURNING id
    `) as Array<{ id: string }>

    await sql`
      INSERT INTO etsy_activations (order_number, email, qr_id, product, client_ip)
      VALUES (${orderNumber}, ${email}, ${qrRows[0].id}, ${product}, ${ip})
    `

    return NextResponse.json({
      slug: created.slug,
      qrUrl: `${SITE_URL}/q/${created.slug}`,
      product,
      previous: existing.map((row) => row.slug),
    })
  } catch (err) {
    console.error('[etsy/activate]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
