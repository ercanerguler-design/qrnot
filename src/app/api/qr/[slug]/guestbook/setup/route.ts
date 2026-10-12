import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { sql } from '@/lib/db'
import { readGuestbookSettings } from '@/lib/guestbook'
import { hashPin, loadGuestbookQr } from '@/lib/guestbookServer'

// Anı defteri olarak üretilmiş (qr_mode=guestbook) boş bir QR'ı sahiplenir ve ayarlarını kaydeder.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const qr = await loadGuestbookQr(slug)
    if (!qr) return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
    if (qr.is_demo && qr.is_active === false) return NextResponse.json({ error: 'Demo QR süresi doldu' }, { status: 410 })
    if (qr.qr_mode !== 'guestbook') return NextResponse.json({ error: 'Bu QR bir anı defteri değil' }, { status: 400 })
    if (qr.is_claimed) return NextResponse.json({ error: 'Bu anı defteri zaten kurulmuş' }, { status: 409 })

    const body = await req.json().catch(() => ({}))
    const eventName = String(body.eventName || '').trim().slice(0, 120)
    const welcome = String(body.welcome || '').trim().slice(0, 400)
    const pin = String(body.pin || '').trim()

    if (!eventName) return NextResponse.json({ error: 'Etkinlik adı gerekli' }, { status: 400 })
    if (pin && !/^\d{4,8}$/.test(pin)) return NextResponse.json({ error: 'PIN 4-8 haneli rakam olmalı' }, { status: 400 })

    const settings = readGuestbookSettings({
      ...qr.settings,
      eventName,
      welcome,
      open: true,
      moderation: body.moderation !== false,
      publicWall: body.publicWall === true,
      pinHash: pin ? hashPin(pin) : null,
    })

    const ownerToken = randomBytes(32).toString('hex')
    const recoveryCode = randomBytes(4).toString('hex').toUpperCase()
    const recoveryCodeHash = createHash('sha256').update(recoveryCode).digest('hex')

    const updated = await sql`
      UPDATE qr_codes
      SET is_claimed = TRUE,
          admin_token = ${ownerToken},
          recovery_code_hash = ${recoveryCodeHash},
          title = ${eventName.slice(0, 100)},
          guestbook_settings = ${JSON.stringify(settings)}::jsonb,
          updated_at = NOW()
      WHERE id = ${qr.id} AND is_claimed = FALSE
      RETURNING id
    `
    if (updated.length === 0) return NextResponse.json({ error: 'Bu anı defteri zaten kurulmuş' }, { status: 409 })

    const baseUrl = req.nextUrl.origin
    return NextResponse.json({
      ownerToken,
      recoveryCode,
      manageUrl: `${baseUrl}/manage/${slug}?token=${ownerToken}`,
    })
  } catch (err) {
    console.error('[guestbook/setup]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
