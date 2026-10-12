import { sql } from '@/lib/db'

interface CreateBlankQRCodesOptions {
  isDemo?: boolean
  demoLifetimeHours?: number
  orderType?: 'individual' | 'corporate' | 'demo' | 'trial'
  creatorUserId?: string | null
}

function generateSlug(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function getDefaultAttemptLimits(orderType: 'individual' | 'corporate' | 'demo' | 'trial') {
  if (orderType === 'trial' || orderType === 'demo') {
    return {
      recordingLimit: 3,
      videoRecordingLimit: 3,
    }
  }

  if (orderType === 'individual' || orderType === 'corporate') {
    return {
      recordingLimit: 3,
      videoRecordingLimit: 3,
    }
  }

  return {
    recordingLimit: 3,
    videoRecordingLimit: 2,
  }
}

export async function createBlankQRCodes(
  count: number,
  baseUrl: string,
  options: CreateBlankQRCodesOptions = {}
) {
  const created: { slug: string; qrUrl: string }[] = []
  const demoLifetimeHours = options.demoLifetimeHours ?? 24
  const orderType = options.orderType ?? (options.isDemo ? 'demo' : 'individual')
  const limits = getDefaultAttemptLimits(orderType)

  for (let index = 0; index < count; index += 1) {
    let slug = generateSlug(8)

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await sql`SELECT id FROM qr_codes WHERE slug = ${slug}`
      if (existing.length === 0) break
      slug = generateSlug(8)
    }

    const demoExpiresAt = options.isDemo
      ? new Date(Date.now() + demoLifetimeHours * 60 * 60 * 1000).toISOString()
      : null

    await sql`
      INSERT INTO qr_codes (
        slug,
        is_demo,
        order_type,
        is_active,
        demo_expires_at,
        recording_count,
        recording_limit,
        video_recording_count,
        video_recording_limit
      )
      VALUES (
        ${slug},
        ${options.isDemo === true},
        ${orderType},
        TRUE,
        ${demoExpiresAt},
        0,
        ${limits.recordingLimit},
        0,
        ${limits.videoRecordingLimit}
      )
    `

    if (options.creatorUserId) {
      await sql`
        UPDATE qr_codes
        SET creator_user_id = ${options.creatorUserId}
        WHERE slug = ${slug}
      `
    }

    created.push({ slug, qrUrl: `${baseUrl}/q/${slug}` })
  }

  return created
}