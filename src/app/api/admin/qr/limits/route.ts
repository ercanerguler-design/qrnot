import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const slug = String(body.slug || '').trim()
    const recordingLimit = Number(body.recordingLimit)
    const videoRecordingLimit = Number(body.videoRecordingLimit)
    const rawVideoMaxSeconds = body.videoMaxSeconds

    let videoMaxSeconds: number | null = null
    if (rawVideoMaxSeconds !== null && rawVideoMaxSeconds !== undefined && String(rawVideoMaxSeconds).trim() !== '') {
      const parsedVideoMaxSeconds = Number(rawVideoMaxSeconds)
      if (!Number.isFinite(parsedVideoMaxSeconds) || parsedVideoMaxSeconds < 1) {
        return NextResponse.json({ error: 'Video sure limiti en az 1 saniye olmali' }, { status: 400 })
      }
      videoMaxSeconds = Math.floor(parsedVideoMaxSeconds)
    }

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erisim' }, { status: 401 })
    }

    if (!slug) {
      return NextResponse.json({ error: 'QR slug gerekli' }, { status: 400 })
    }

    if (!Number.isFinite(recordingLimit) || recordingLimit < 1) {
      return NextResponse.json({ error: 'Kayit limiti en az 1 olmali' }, { status: 400 })
    }

    if (!Number.isFinite(videoRecordingLimit) || videoRecordingLimit < 0) {
      return NextResponse.json({ error: 'Video limiti 0 veya daha buyuk olmali' }, { status: 400 })
    }

    const updated = await sql`
      UPDATE qr_codes
      SET recording_limit = ${Math.floor(recordingLimit)},
          video_recording_limit = ${Math.floor(videoRecordingLimit)},
          video_max_seconds = ${videoMaxSeconds},
          updated_at = NOW()
      WHERE slug = ${slug}
        RETURNING slug, recording_limit, video_recording_limit, video_max_seconds
    `

    if (updated.length === 0) {
      return NextResponse.json({ error: 'QR bulunamadi' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      slug: updated[0].slug,
      recordingLimit: Number(updated[0].recording_limit),
      videoRecordingLimit: Number(updated[0].video_recording_limit),
      videoMaxSeconds: updated[0].video_max_seconds === null ? null : Number(updated[0].video_max_seconds),
    })
  } catch (err) {
    console.error('[admin/qr/limits]', err)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
