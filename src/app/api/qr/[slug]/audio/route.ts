import { NextRequest, NextResponse } from 'next/server'
import { getBlob } from '@/lib/blob'
import { deactivateExpiredDemoQr, ensureQrSchema, QRCode, sql } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureQrSchema()

    const { slug } = await params
    const rows = (await sql`
      SELECT slug, is_demo, is_active, is_claimed, audio_url, demo_expires_at
      FROM qr_codes WHERE slug = ${slug}
    `) as unknown as QRCode[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
    }

    const qr = await deactivateExpiredDemoQr(rows[0])
    if (qr.is_demo && qr.is_active === false) {
      return NextResponse.json({ error: 'Demo QR süresi doldu' }, { status: 410 })
    }
    if (!qr.is_claimed || !qr.audio_url) {
      return NextResponse.json({ error: 'Ses dosyası bulunamadı' }, { status: 404 })
    }

    const blobResult = await getBlob(qr.audio_url, false)
    if (!blobResult || !blobResult.stream) {
      return NextResponse.json({ error: 'Ses dosyası bulunamadı' }, { status: 404 })
    }

    const headers = new Headers(Array.from(blobResult.headers.entries()))
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    headers.set('Surrogate-Control', 'no-store')

    return new NextResponse(blobResult.stream as BodyInit, { headers })
  } catch (err) {
    console.error('[qr/[slug]/audio GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}