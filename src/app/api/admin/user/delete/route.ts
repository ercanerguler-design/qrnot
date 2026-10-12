import { NextRequest, NextResponse } from 'next/server'
import { deleteBlob } from '@/lib/blob'
import { ensureQrSchema, QRMedia, sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const userId = String(body.userId || '').trim()

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Silinecek kullanıcı belirtilmedi' }, { status: 400 })
    }

    const userRows = await sql`
      SELECT id, email
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const userQrs = await sql`
      SELECT id, slug, audio_url
      FROM qr_codes
      WHERE creator_user_id = ${userId}
    `

    if (userQrs.length > 0) {
      const mediaRows = (await sql`
        SELECT m.id, m.qr_id, m.media_type, m.source_type, m.blob_url, m.external_url, m.title, m.sort_order, m.is_primary, m.created_at, m.updated_at
        FROM qr_media m
        INNER JOIN qr_codes q ON q.id = m.qr_id
        WHERE q.creator_user_id = ${userId}
          AND m.source_type = 'blob'
      `) as unknown as QRMedia[]

      const blobUrls = new Set<string>()
      for (const qr of userQrs) {
        if (qr.audio_url) {
          blobUrls.add(String(qr.audio_url))
        }
      }
      for (const media of mediaRows) {
        if (media.blob_url) {
          blobUrls.add(media.blob_url)
        }
      }

      for (const blobUrl of blobUrls) {
        try {
          await deleteBlob(blobUrl)
        } catch (error) {
          console.warn('[admin/user/delete blob]', error)
        }
      }

      await sql`DELETE FROM qr_codes WHERE creator_user_id = ${userId}`
    }

    await sql`DELETE FROM user_sessions WHERE user_id = ${userId}`
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`
    await sql`DELETE FROM users WHERE id = ${userId}`

    return NextResponse.json({ ok: true, userId, email: userRows[0].email })
  } catch (err) {
    console.error('[admin/user/delete]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
