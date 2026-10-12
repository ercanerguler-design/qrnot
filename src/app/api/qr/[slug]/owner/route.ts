import { NextRequest, NextResponse } from 'next/server'
import { deactivateExpiredDemoQr, sql, type QRCode, type QRMedia } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'
import { publicGuestbookSettings, readGuestbookSettings } from '@/lib/guestbook'

// Sahip token'ını doğrular ve yönetim ekranı için QR bilgilerini döner.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await ensureGrowthSchema()
    const { slug } = await params
    const token = req.nextUrl.searchParams.get('token') || ''

    const rows = (await sql`
      SELECT id, slug, is_demo, order_type, is_active, is_claimed, admin_token, title, play_count,
             recording_count, recording_limit, video_recording_count, video_recording_limit,
             demo_expires_at, created_at, updated_at, qr_mode, guestbook_settings,
             nfc_scan_count, nfc_encoded_at, nfc_locked
      FROM qr_codes WHERE slug = ${slug}
    `) as unknown as Array<
      QRCode & { qr_mode: string; guestbook_settings: unknown; nfc_scan_count: number; nfc_encoded_at: string | null; nfc_locked: boolean }
    >

    const row = rows[0]
    if (!row || !row.is_claimed || !token || token !== row.admin_token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const qr = await deactivateExpiredDemoQr(row)
    const media = (await sql`
      SELECT id, qr_id, media_type, source_type, blob_url, external_url, title, sort_order, is_primary, created_at, updated_at
      FROM qr_media WHERE qr_id = ${qr.id}
      ORDER BY sort_order ASC, created_at ASC
    `) as unknown as QRMedia[]

    const res = NextResponse.json({
      slug: qr.slug,
      title: qr.title,
      orderType: qr.order_type,
      isDemo: qr.is_demo,
      isActive: qr.is_active !== false,
      playCount: Number(qr.play_count || 0),
      nfcScanCount: Number(qr.nfc_scan_count || 0),
      nfcEncodedAt: qr.nfc_encoded_at,
      nfcLocked: Boolean(qr.nfc_locked),
      recordingCount: Number(qr.recording_count || 0),
      recordingLimit: Number(qr.recording_limit || 0),
      videoRecordingCount: Number(qr.video_recording_count || 0),
      videoRecordingLimit: Number(qr.video_recording_limit || 0),
      createdAt: qr.created_at,
      updatedAt: qr.updated_at,
      mode: qr.qr_mode === 'guestbook' ? 'guestbook' : 'standard',
      guestbook: qr.qr_mode === 'guestbook' ? publicGuestbookSettings(readGuestbookSettings(qr.guestbook_settings)) : null,
      media: media.map((item) => ({
        id: item.id,
        media_type: item.media_type,
        source_type: item.source_type,
        external_url: item.external_url,
        title: item.title,
        is_primary: item.is_primary,
      })),
    })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error('[qr/owner]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
