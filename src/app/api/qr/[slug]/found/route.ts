import { NextRequest, NextResponse } from 'next/server'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { isTimeLocked, loadFeatureQr, recordQrEvent } from '@/lib/qrFeatures'

// Kayıp modu: bulan kişi, KENDİ İZNİYLE tarayıcının verdiği konumu (ve isteğe bağlı notunu) sahibine gönderir.
// Sürekli takip yoktur; her gönderim tek seferlik bir konumdur.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const qr = await loadFeatureQr(slug)
    if (!qr || !qr.is_claimed || qr.is_active === false || qr.qr_mode === 'guestbook') {
      return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    }

    const ip = clientIp(req.headers)
    if (!(await consumeRateLimit(`found:${slug}:${ip}`, 5, 3600))) {
      return NextResponse.json({ error: 'Çok fazla deneme. Lütfen biraz sonra tekrar dene.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const lat = Number(body.lat)
    const lng = Number(body.lng)
    const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    const accuracy = Number.isFinite(Number(body.accuracy)) ? Math.round(Number(body.accuracy)) : null
    const message = String(body.message || '').trim().slice(0, 500)
    const contact = String(body.contact || '').trim().slice(0, 80)
    if (!hasLocation && !message) return NextResponse.json({ error: 'Konum ya da not gerekli' }, { status: 400 })

    await recordQrEvent(qr, 'found', {
      lat: hasLocation ? Number(lat.toFixed(6)) : null,
      lng: hasLocation ? Number(lng.toFixed(6)) : null,
      accuracy,
      message,
      contact,
      locked: isTimeLocked(qr),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[qr/found]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
