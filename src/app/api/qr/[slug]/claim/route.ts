import { NextRequest, NextResponse } from 'next/server'
import { validateAudioFile } from '@/lib/audio'
import { putBlob } from '@/lib/blob'
import { deactivateExpiredDemoQr, ensureQrSchema, QRCode, sql } from '@/lib/db'
import {
  detectUploadedMediaType,
  normalizeOptionalUrl,
  validateExternalUrl,
  validateImageFile,
  validateSpotifyUrl,
  validateVideoFile,
  validateYouTubeUrl,
} from '@/lib/media'
import { randomBytes } from 'crypto'
import { createHash } from 'crypto'

const WHATSAPP_CONTACT = '905433929230'

function getOrderTypeMaxLimits(orderType: 'individual' | 'corporate' | 'demo' | 'trial' | null | undefined) {
  if (orderType === 'individual' || orderType === 'corporate') {
    return { recordingLimit: 3, videoRecordingLimit: 3 }
  }

  if (orderType === 'trial' || orderType === 'demo') {
    return { recordingLimit: 3, videoRecordingLimit: 3 }
  }

  return { recordingLimit: 3, videoRecordingLimit: 2 }
}

function limitExceededMessage(slug: string, kind: 'recording' | 'video') {
  const reason = kind === 'video' ? 'video kayıt limitine' : 'içerik güncelleme limitine'
  const whatsappMessage = encodeURIComponent(`Merhaba QRNote, ${slug} kodu için ${reason} takıldım. Limit artışı satın almak istiyorum.`)

  return `Bu QR kodunda ${reason} ulaştınız. Limit artışı için WhatsApp: https://wa.me/${WHATSAPP_CONTACT}?text=${whatsappMessage}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureQrSchema()

    const { slug } = await params

    // QR var mı ve sahipsiz mi?
    const rows = (await sql`
      SELECT id, slug, is_demo, order_type, is_active, is_claimed, demo_expires_at, recording_count, recording_limit, video_recording_count, video_recording_limit, video_max_seconds
      FROM qr_codes WHERE slug = ${slug}
    `) as Array<Pick<QRCode, 'id' | 'slug' | 'is_demo' | 'order_type' | 'is_active' | 'is_claimed' | 'demo_expires_at' | 'recording_count' | 'recording_limit' | 'video_recording_count' | 'video_recording_limit' | 'video_max_seconds'>>
    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
    }
    const qr = await deactivateExpiredDemoQr(rows[0])
    if (qr.is_demo && qr.is_active === false) {
      return NextResponse.json({ error: 'Demo QR süresi doldu' }, { status: 410 })
    }
    if (qr.is_claimed) {
      return NextResponse.json({ error: 'Bu QR kodu zaten sahiplenilmiş' }, { status: 409 })
    }

    const formData = await req.formData()
    const legacyAudioFile = formData.get('audio') as File | null
    const mediaFile = (formData.get('media') as File | null) || legacyAudioFile
    const title = ((formData.get('title') as string) || '').trim().slice(0, 100) || 'Sesli Not'
    const youtubeUrl = normalizeOptionalUrl(formData.get('youtube_url') as string | null)
    const spotifyUrl = normalizeOptionalUrl(formData.get('spotify_url') as string | null)
    const externalUrl = normalizeOptionalUrl(formData.get('external_url') as string | null)

    const youtubeError = validateYouTubeUrl(youtubeUrl)
    if (youtubeError) {
      return NextResponse.json({ error: youtubeError }, { status: 400 })
    }

    const spotifyError = validateSpotifyUrl(spotifyUrl)
    if (spotifyError) {
      return NextResponse.json({ error: spotifyError }, { status: 400 })
    }

    const externalError = validateExternalUrl(externalUrl)
    if (externalError) {
      return NextResponse.json({ error: externalError }, { status: 400 })
    }

    if (!mediaFile && !youtubeUrl && !spotifyUrl && !externalUrl) {
      return NextResponse.json({ error: 'En az bir içerik eklemelisin' }, { status: 400 })
    }

    let uploadedMediaType: 'audio' | 'video' | 'image' | null = null
    let uploadedMediaBlobUrl: string | null = null
    const recordingCount = Number(qr.recording_count ?? 0)
    const videoRecordingCount = Number(qr.video_recording_count ?? 0)
    const videoMaxSeconds = Number(qr.video_max_seconds)
    const videoMaxSecondsOverride = Number.isFinite(videoMaxSeconds) && videoMaxSeconds > 0 ? videoMaxSeconds : null
    const maxLimits = getOrderTypeMaxLimits(qr.order_type)
    const isPaidOrder = qr.order_type === 'individual' || qr.order_type === 'corporate'
    const recordingLimit = isPaidOrder
      ? maxLimits.recordingLimit
      : Math.min(Number(qr.recording_limit ?? maxLimits.recordingLimit), maxLimits.recordingLimit)
    const videoRecordingLimit = isPaidOrder
      ? maxLimits.videoRecordingLimit
      : Math.min(Number(qr.video_recording_limit ?? maxLimits.videoRecordingLimit), maxLimits.videoRecordingLimit)
    const hasAnyContentAttempt = Boolean(mediaFile || youtubeUrl || spotifyUrl || externalUrl)

    if (hasAnyContentAttempt && recordingCount >= recordingLimit) {
      return NextResponse.json({ error: limitExceededMessage(slug, 'recording') }, { status: 429 })
    }

    if (mediaFile && mediaFile.size > 0) {
      uploadedMediaType = detectUploadedMediaType(mediaFile)
      if (!uploadedMediaType) {
        return NextResponse.json({ error: 'Sadece ses, video veya resim dosyası yükleyebilirsin' }, { status: 400 })
      }

      if (uploadedMediaType === 'video' && videoRecordingCount >= videoRecordingLimit) {
        return NextResponse.json({ error: limitExceededMessage(slug, 'video') }, { status: 429 })
      }

      if (uploadedMediaType === 'audio') {
        const audioValidationError = await validateAudioFile(mediaFile)
        if (audioValidationError) {
          return NextResponse.json({ error: audioValidationError }, { status: 400 })
        }
      }

      if (uploadedMediaType === 'video') {
        const videoValidationError = await validateVideoFile(mediaFile, qr.order_type, videoMaxSecondsOverride)
        if (videoValidationError) {
          return NextResponse.json({ error: videoValidationError }, { status: 400 })
        }
      }

      if (uploadedMediaType === 'image') {
        const imageValidationError = validateImageFile(mediaFile)
        if (imageValidationError) {
          return NextResponse.json({ error: imageValidationError }, { status: 400 })
        }
      }

      const ext = mediaFile.name.split('.').pop() || 'webm'
      const blob = await putBlob(`qr/${slug}-${Date.now()}.${ext}`, mediaFile)
      uploadedMediaBlobUrl = blob.url
    }

    // QR sahibinin sonraki güncellemelerde kullanacağı özel token
    const ownerToken = randomBytes(32).toString('hex')
    const recoveryCode = randomBytes(4).toString('hex').toUpperCase()
    const recoveryCodeHash = createHash('sha256').update(recoveryCode).digest('hex')

    const baseUrl = req.nextUrl.origin || String(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()
    const shouldIncreaseRecordingCount = Boolean(uploadedMediaBlobUrl || youtubeUrl || spotifyUrl || externalUrl)

    const updatedRows = (await sql`
      UPDATE qr_codes
      SET is_claimed = TRUE,
          admin_token = ${ownerToken},
          recovery_code_hash = ${recoveryCodeHash},
          audio_url = ${uploadedMediaType === 'audio' ? uploadedMediaBlobUrl : null},
          recording_count = recording_count + ${shouldIncreaseRecordingCount ? 1 : 0},
          video_recording_count = video_recording_count + ${uploadedMediaType === 'video' ? 1 : 0},
          title = ${title},
          updated_at = NOW()
      WHERE slug = ${slug}
      RETURNING id
    `) as Array<{ id: string }>

    const qrId = updatedRows[0]?.id
    if (!qrId) {
      return NextResponse.json({ error: 'QR kodu güncellenemedi' }, { status: 500 })
    }

    let sortOrder = 0

    if (uploadedMediaBlobUrl && uploadedMediaType) {
      await sql`
        INSERT INTO qr_media (qr_id, media_type, source_type, blob_url, title, sort_order, is_primary)
        VALUES (${qrId}, ${uploadedMediaType}, 'blob', ${uploadedMediaBlobUrl}, ${title}, ${sortOrder}, TRUE)
      `
      sortOrder += 1
    }

    if (youtubeUrl) {
      await sql`
        INSERT INTO qr_media (qr_id, media_type, source_type, external_url, title, sort_order, is_primary)
        VALUES (${qrId}, 'youtube', 'external', ${youtubeUrl}, 'YouTube', ${sortOrder}, ${sortOrder === 0})
      `
      sortOrder += 1
    }

    if (spotifyUrl) {
      await sql`
        INSERT INTO qr_media (qr_id, media_type, source_type, external_url, title, sort_order, is_primary)
        VALUES (${qrId}, 'spotify', 'external', ${spotifyUrl}, 'Spotify', ${sortOrder}, ${sortOrder === 0})
      `
      sortOrder += 1
    }

    if (externalUrl) {
      await sql`
        INSERT INTO qr_media (qr_id, media_type, source_type, external_url, title, sort_order, is_primary)
        VALUES (${qrId}, 'link', 'external', ${externalUrl}, 'Bağlantı', ${sortOrder}, ${sortOrder === 0})
      `
    }

    return NextResponse.json({
      slug,
      ownerToken,
      recoveryCode,
      playUrl: `${baseUrl}/q/${slug}`,
      manageUrl: `${baseUrl}/manage/${slug}?token=${ownerToken}`,
    })
  } catch (err) {
    console.error('[claim]', err)

    if (err instanceof Error && err.message.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json({ error: 'Medya yükleme servisi hazır değil' }, { status: 500 })
    }

    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
