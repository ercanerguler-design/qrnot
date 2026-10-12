import { NextRequest, NextResponse } from 'next/server'
import { deleteBlob } from '@/lib/blob'
import { ensureQrSchema, QRCode, QRMedia, sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const slug = String(body.slug || '').trim()

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    if (!slug) {
      return NextResponse.json({ error: 'Silinecek QR kodu belirtilmedi' }, { status: 400 })
    }

    const rows = (await sql`
      SELECT id, slug, audio_url FROM qr_codes WHERE slug = ${slug}
    `) as Array<Pick<QRCode, 'id' | 'slug' | 'audio_url'>>

    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
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
        console.warn('[admin/qr/delete blob]', error)
        failedBlobDeletes.push(blobUrl)
      }
    }

    if (failedBlobDeletes.length > 0) {
      return NextResponse.json(
        { error: 'Medya dosyalari silinemedigi icin QR silinmedi. Lutfen tekrar dene.' },
        { status: 502 }
      )
    }

    await sql`DELETE FROM qr_codes WHERE slug = ${slug}`

    return NextResponse.json({ ok: true, slug })
  } catch (err) {
    console.error('[admin/qr/delete]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}