import { NextRequest, NextResponse } from 'next/server'
import { getBlob } from '@/lib/blob'
import { deactivateExpiredDemoQr, ensureQrSchema, QRCode, sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureQrSchema()
    await ensureGrowthSchema()

    const { slug } = await params
    const rows = (await sql`
      SELECT slug, is_demo, is_active, is_claimed, audio_url, demo_expires_at, unlock_at, admin_token
      FROM qr_codes WHERE slug = ${slug}
    `) as unknown as Array<QRCode & { unlock_at: string | null }>

    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
    }

    const qr = await deactivateExpiredDemoQr(rows[0])
    if (!qr.is_demo && qr.is_active === false) {
      return NextResponse.json({ error: 'QR kodu devre dışı' }, { status: 404 })
    }
    if (qr.is_demo && qr.is_active === false) {
      return NextResponse.json({ error: 'Demo QR süresi doldu' }, { status: 410 })
    }

    // Zaman kapsülü: açılış tarihinden önce medya sadece sahibe (token ile) açılır
    if (qr.unlock_at && new Date(qr.unlock_at).getTime() > Date.now() && req.nextUrl.searchParams.get('token') !== qr.admin_token) {
      return NextResponse.json({ error: 'Bu içerik henüz açılmadı' }, { status: 423 })
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