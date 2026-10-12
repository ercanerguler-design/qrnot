import { NextRequest, NextResponse } from 'next/server'
import { publicGuestbookSettings, readGuestbookSettings } from '@/lib/guestbook'
import { hashPin, isGuestbookOwner, loadGuestbookQr, saveGuestbookSettings } from '@/lib/guestbookServer'
import { sql } from '@/lib/db'

// Sahip: anı defteri ayarlarını okur / günceller.

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const qr = await loadGuestbookQr(slug)
  if (!qr || qr.qr_mode !== 'guestbook') return NextResponse.json({ error: 'Anı defteri bulunamadı' }, { status: 404 })
  if (!isGuestbookOwner(qr, req.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }
  const countRows = (await sql`
    SELECT status, COUNT(*)::int AS count FROM guestbook_entries WHERE qr_id = ${qr.id} GROUP BY status
  `) as Array<{ status: string; count: number }>
  const counts = Object.fromEntries(countRows.map((row) => [row.status, Number(row.count)]))
  return NextResponse.json({ settings: publicGuestbookSettings(qr.settings), counts })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const body = await req.json().catch(() => ({}))
    const qr = await loadGuestbookQr(slug)
    if (!qr || qr.qr_mode !== 'guestbook') return NextResponse.json({ error: 'Anı defteri bulunamadı' }, { status: 404 })
    if (!isGuestbookOwner(qr, body.token)) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })

    const next = { ...qr.settings }
    if (typeof body.eventName === 'string') {
      const eventName = body.eventName.trim().slice(0, 120)
      if (!eventName) return NextResponse.json({ error: 'Etkinlik adı gerekli' }, { status: 400 })
      next.eventName = eventName
    }
    if (typeof body.welcome === 'string') next.welcome = body.welcome.trim().slice(0, 400)
    if (typeof body.open === 'boolean') next.open = body.open
    if (typeof body.moderation === 'boolean') next.moderation = body.moderation
    if (typeof body.publicWall === 'boolean') next.publicWall = body.publicWall
    if (typeof body.pin === 'string') {
      const pin = body.pin.trim()
      if (pin && !/^\d{4,8}$/.test(pin)) return NextResponse.json({ error: 'PIN 4-8 haneli rakam olmalı' }, { status: 400 })
      next.pinHash = pin ? hashPin(pin) : null
    }

    const settings = readGuestbookSettings(next)
    await saveGuestbookSettings(qr.id, settings)
    await sql`UPDATE qr_codes SET title = ${settings.eventName.slice(0, 100)} WHERE id = ${qr.id}`

    return NextResponse.json({ settings: publicGuestbookSettings(settings) })
  } catch (err) {
    console.error('[guestbook/settings]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
