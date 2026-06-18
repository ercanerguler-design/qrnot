import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { deleteBlob } from '@/lib/blob'
import { ensureQrSchema, QRCode, QRMedia, sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Devam etmek için giriş yap' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const slug = String(body.slug || '').trim()

    if (!slug) {
      return NextResponse.json({ error: 'Silinecek QR kodu belirtilmedi' }, { status: 400 })
    }

    const rows = (await sql`
      SELECT id, slug, audio_url
      FROM qr_codes
      WHERE slug = ${slug}
        AND creator_user_id = ${user.id}
      LIMIT 1
    `) as Array<Pick<QRCode, 'id' | 'slug' | 'audio_url'>>

    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı veya bu işlem için yetkin yok' }, { status: 404 })
    }

    const qr = rows[0]
    const mediaRows = (await sql`
      SELECT id, qr_id, media_type, source_type, blob_url, external_url, title, sort_order, is_primary, created_at, updated_at
      FROM qr_media
      WHERE qr_id = ${qr.id}
        AND source_type = 'blob'
    `) as unknown as QRMedia[]

    const blobUrls = new Set<string>()
    if (qr.audio_url) {
      blobUrls.add(qr.audio_url)
    }

    for (const media of mediaRows) {
      if (media.blob_url) {
        blobUrls.add(media.blob_url)
      }
    }

    const failedBlobDeletes: string[] = []
    for (const blobUrl of blobUrls) {
      try {
        await deleteBlob(blobUrl)
      } catch (error) {
        console.warn('[account/qr/delete blob]', error)
        failedBlobDeletes.push(blobUrl)
      }
    }

    if (failedBlobDeletes.length > 0) {
      return NextResponse.json(
        { error: 'Medya dosyalari silinemedigi icin QR silinmedi. Lutfen tekrar dene.' },
        { status: 502 }
      )
    }

    await sql`DELETE FROM qr_codes WHERE id = ${qr.id}`

    // Intentionally do not decrease used_slots.
    return NextResponse.json({ ok: true, slug: qr.slug })
  } catch (err) {
    console.error('[account/qr/delete]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
