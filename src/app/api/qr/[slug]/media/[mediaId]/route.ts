import { NextRequest, NextResponse } from 'next/server'
import { streamPrivateBlob } from '@/lib/blob'
import { deactivateExpiredDemoQr, ensureQrSchema, QRCode, QRMedia, sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; mediaId: string }> }
) {
  try {
    await ensureQrSchema()
    await ensureGrowthSchema()

    const { slug, mediaId } = await params

    const qrRows = (await sql`
      SELECT id, slug, is_demo, is_active, is_claimed, demo_expires_at, unlock_at, admin_token
      FROM qr_codes
      WHERE slug = ${slug}
    `) as Array<Pick<QRCode, 'id' | 'slug' | 'is_demo' | 'is_active' | 'is_claimed' | 'demo_expires_at' | 'admin_token'> & { unlock_at: string | null }>

    if (qrRows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadi' }, { status: 404 })
    }

    const qr = await deactivateExpiredDemoQr(qrRows[0])
    if (!qr.is_demo && qr.is_active === false) {
      return NextResponse.json({ error: 'QR kodu devre dışı' }, { status: 404 })
    }
    if (qr.is_demo && qr.is_active === false) {
      return NextResponse.json({ error: 'Demo QR suresi doldu' }, { status: 410 })
    }

    // Zaman kapsülü: açılış tarihinden önce medya sadece sahibe (token ile) açılır
    if (qr.unlock_at && new Date(qr.unlock_at).getTime() > Date.now() && req.nextUrl.searchParams.get('token') !== qr.admin_token) {
      return NextResponse.json({ error: 'Bu içerik henüz açılmadı' }, { status: 423 })
    }

    const mediaRows = (await sql`
      SELECT id, qr_id, media_type, source_type, blob_url, external_url, title, sort_order, is_primary, created_at, updated_at
      FROM qr_media
      WHERE id = ${mediaId}
        AND qr_id = ${qr.id}
      LIMIT 1
    `) as unknown as QRMedia[]

    const media = mediaRows[0]
    if (!media || media.source_type !== 'blob' || !media.blob_url) {
      return NextResponse.json({ error: 'Medya bulunamadi' }, { status: 404 })
    }

    const response = await streamPrivateBlob(media.blob_url, req.headers.get('range'))
    if (!response) {
      return NextResponse.json({ error: 'Medya bulunamadi' }, { status: 404 })
    }

    return response
  } catch (err) {
    console.error('[qr/[slug]/media/[mediaId] GET]', err)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
