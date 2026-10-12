import { NextRequest, NextResponse } from 'next/server'
import { getBlob } from '@/lib/blob'
import { deactivateExpiredDemoQr, ensureQrSchema, QRCode, QRMedia, sql } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; mediaId: string }> }
) {
  try {
    await ensureQrSchema()

    const { slug, mediaId } = await params

    const qrRows = (await sql`
      SELECT id, slug, is_demo, is_active, is_claimed, demo_expires_at
      FROM qr_codes
      WHERE slug = ${slug}
    `) as Array<Pick<QRCode, 'id' | 'slug' | 'is_demo' | 'is_active' | 'is_claimed' | 'demo_expires_at'>>

    if (qrRows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadi' }, { status: 404 })
    }

    const qr = await deactivateExpiredDemoQr(qrRows[0])
    if (qr.is_demo && qr.is_active === false) {
      return NextResponse.json({ error: 'Demo QR suresi doldu' }, { status: 410 })
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

    const blobResult = await getBlob(media.blob_url, false)
    if (!blobResult || !blobResult.stream) {
      return NextResponse.json({ error: 'Medya bulunamadi' }, { status: 404 })
    }

    const headers = new Headers(Array.from(blobResult.headers.entries()))
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    headers.set('Surrogate-Control', 'no-store')

    return new NextResponse(blobResult.stream as BodyInit, { headers })
  } catch (err) {
    console.error('[qr/[slug]/media/[mediaId] GET]', err)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
