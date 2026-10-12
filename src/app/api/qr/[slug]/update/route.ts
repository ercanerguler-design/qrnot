import { NextRequest, NextResponse } from 'next/server'
import { validateAudioFile } from '@/lib/audio'
import { deleteBlob, putBlob } from '@/lib/blob'
import { deactivateExpiredDemoQr, ensureQrSchema, sql, QRCode, QRMedia } from '@/lib/db'
import {
  detectUploadedMediaType,
  normalizeOptionalUrl,
  validateExternalUrl,
  validateImageFile,
  validateSpotifyUrl,
  validateVideoFile,
  validateYouTubeUrl,
} from '@/lib/media'

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureQrSchema()

    const { slug } = await params
    const formData = await req.formData()
    const token = (formData.get('token') as string | null) || ''
    const legacyAudioFile = formData.get('audio') as File | null
    const mediaFile = (formData.get('media') as File | null) || legacyAudioFile
    const titleRaw = formData.get('title') as string | null
    const youtubeRaw = formData.get('youtube_url') as string | null
    const spotifyRaw = formData.get('spotify_url') as string | null
    const externalRaw = formData.get('external_url') as string | null

    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 })
    }

    const rows = (await sql`
      SELECT id, slug, is_demo, order_type, is_active, is_claimed, admin_token, audio_url, title, demo_expires_at, recording_count, recording_limit, video_recording_count, video_recording_limit, video_max_seconds
      FROM qr_codes WHERE slug = ${slug}
    `) as unknown as QRCode[]
    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
    }
    const qr = await deactivateExpiredDemoQr(rows[0]) as QRCode
    if (qr.is_demo && qr.is_active === false) {
      return NextResponse.json({ error: 'Demo QR süresi doldu' }, { status: 410 })
    }
    if (!qr.is_claimed || qr.admin_token !== token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const newTitle = titleRaw !== null ? titleRaw.trim().slice(0, 100) : qr.title
    const youtubeUrl = youtubeRaw === null ? null : normalizeOptionalUrl(youtubeRaw)
    const spotifyUrl = spotifyRaw === null ? null : normalizeOptionalUrl(spotifyRaw)
    const externalUrl = externalRaw === null ? null : normalizeOptionalUrl(externalRaw)

    const youtubeError = youtubeRaw === null ? null : validateYouTubeUrl(youtubeUrl)
    if (youtubeError) {
      return NextResponse.json({ error: youtubeError }, { status: 400 })
    }

    const spotifyError = spotifyRaw === null ? null : validateSpotifyUrl(spotifyUrl)
    if (spotifyError) {
      return NextResponse.json({ error: spotifyError }, { status: 400 })
    }

    const externalError = externalRaw === null ? null : validateExternalUrl(externalUrl)
    if (externalError) {
      return NextResponse.json({ error: externalError }, { status: 400 })
    }

    const mediaRows = (await sql`
      SELECT id, qr_id, media_type, source_type, blob_url, external_url, title, sort_order, is_primary, created_at, updated_at
      FROM qr_media
      WHERE qr_id = ${qr.id}
      ORDER BY sort_order ASC, created_at ASC
    `) as unknown as QRMedia[]

    const existingYoutube = mediaRows.find((item) => item.media_type === 'youtube')?.external_url || null
    const existingSpotify = mediaRows.find((item) => item.media_type === 'spotify')?.external_url || null
    const existingExternal = mediaRows.find((item) => item.media_type === 'link')?.external_url || null

    const youtubeChanged = youtubeRaw !== null && (youtubeUrl || null) !== existingYoutube
    const spotifyChanged = spotifyRaw !== null && (spotifyUrl || null) !== existingSpotify
    const externalChanged = externalRaw !== null && (externalUrl || null) !== existingExternal

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

    const hasBlobChange = Boolean(mediaFile && mediaFile.size > 0)
    const hasLinkChange = youtubeChanged || spotifyChanged || externalChanged
    const shouldIncreaseRecordingCount = hasBlobChange || hasLinkChange

    if (shouldIncreaseRecordingCount && recordingCount >= recordingLimit) {
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

    const blobMediaRows = mediaRows.filter((item) => item.source_type === 'blob')

    if (uploadedMediaBlobUrl) {
      for (const row of blobMediaRows) {
        if (row.blob_url) {
          try {
            await deleteBlob(row.blob_url)
          } catch {
            // eski blob silinmese de güncelleme devam eder
          }
        }
      }

      await sql`
        DELETE FROM qr_media WHERE qr_id = ${qr.id} AND source_type = 'blob'
      `

      await sql`
        INSERT INTO qr_media (qr_id, media_type, source_type, blob_url, title, sort_order, is_primary)
        VALUES (${qr.id}, ${uploadedMediaType}, 'blob', ${uploadedMediaBlobUrl}, ${newTitle || qr.title}, 0, TRUE)
      `

      await sql`
        UPDATE qr_media
        SET sort_order = sort_order + 1,
            updated_at = NOW()
        WHERE qr_id = ${qr.id}
          AND source_type = 'external'
      `
    }

    if (youtubeRaw !== null) {
      await sql`DELETE FROM qr_media WHERE qr_id = ${qr.id} AND media_type = 'youtube'`
      if (youtubeUrl) {
        await sql`
          INSERT INTO qr_media (qr_id, media_type, source_type, external_url, title, sort_order, is_primary)
          VALUES (${qr.id}, 'youtube', 'external', ${youtubeUrl}, 'YouTube', 20, FALSE)
        `
      }
    }

    if (spotifyRaw !== null) {
      await sql`DELETE FROM qr_media WHERE qr_id = ${qr.id} AND media_type = 'spotify'`
      if (spotifyUrl) {
        await sql`
          INSERT INTO qr_media (qr_id, media_type, source_type, external_url, title, sort_order, is_primary)
          VALUES (${qr.id}, 'spotify', 'external', ${spotifyUrl}, 'Spotify', 30, FALSE)
        `
      }
    }

    if (externalRaw !== null) {
      await sql`DELETE FROM qr_media WHERE qr_id = ${qr.id} AND media_type = 'link'`
      if (externalUrl) {
        await sql`
          INSERT INTO qr_media (qr_id, media_type, source_type, external_url, title, sort_order, is_primary)
          VALUES (${qr.id}, 'link', 'external', ${externalUrl}, 'Bağlantı', 40, FALSE)
        `
      }
    }

    const primaryAudioRows = (await sql`
      SELECT blob_url
      FROM qr_media
      WHERE qr_id = ${qr.id}
        AND source_type = 'blob'
        AND media_type = 'audio'
      ORDER BY is_primary DESC, sort_order ASC, created_at ASC
      LIMIT 1
    `) as Array<{ blob_url: string | null }>

    const legacyAudioUrl = primaryAudioRows[0]?.blob_url || null

    await sql`
      UPDATE qr_codes
      SET audio_url = ${legacyAudioUrl},
          recording_count = recording_count + ${shouldIncreaseRecordingCount ? 1 : 0},
          video_recording_count = video_recording_count + ${uploadedMediaType === 'video' ? 1 : 0},
          title = ${newTitle || qr.title},
          updated_at = NOW()
      WHERE slug = ${slug}
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[update]', err)

    if (err instanceof Error && err.message.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json({ error: 'Medya yükleme servisi hazır değil' }, { status: 500 })
    }

    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
