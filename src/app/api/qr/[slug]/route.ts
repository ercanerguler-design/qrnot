import { NextRequest, NextResponse } from 'next/server'
import { deactivateExpiredDemoQr, ensureQrSchema, sql, QRCode, QRMedia } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureQrSchema()

    const { slug } = await params
    const rows = (await sql`
      SELECT id, slug, is_demo, order_type, is_active, is_claimed, audio_url, recording_count, recording_limit, video_recording_count, video_recording_limit, title, play_count, demo_expires_at, created_at, updated_at
      FROM qr_codes WHERE slug = ${slug}
    `) as unknown as QRCode[]
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    }
    // admin_token hiçbir zaman dışarı çıkmasın
    const qr = await deactivateExpiredDemoQr(rows[0]) as QRCode
    const mediaRows = (await sql`
      SELECT id, qr_id, media_type, source_type, blob_url, external_url, title, sort_order, is_primary, created_at, updated_at
      FROM qr_media
      WHERE qr_id = ${qr.id}
      ORDER BY sort_order ASC, created_at ASC
    `) as unknown as QRMedia[]
    qr.media_items = mediaRows
    return NextResponse.json(qr)
  } catch (err) {
    console.error('[qr/[slug] GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
