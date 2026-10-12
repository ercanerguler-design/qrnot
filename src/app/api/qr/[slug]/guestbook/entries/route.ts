import { NextRequest, NextResponse } from 'next/server'
import { deleteBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { resolveDirectUpload } from '@/lib/directUpload'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import type { GuestbookEntry } from '@/lib/guestbook'
import { hashIp, hashPin, isGuestbookOwner, loadGuestbookQr } from '@/lib/guestbookServer'

// GET  → sahip (token ile) tüm anıları; misafir sadece onaylı anıları (herkese açık duvar açıksa) görür.
// POST → misafir yeni anı bırakır.

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const qr = await loadGuestbookQr(slug)
  if (!qr || qr.qr_mode !== 'guestbook' || !qr.is_claimed) {
    return NextResponse.json({ error: 'Anı defteri bulunamadı' }, { status: 404 })
  }

  const owner = isGuestbookOwner(qr, req.nextUrl.searchParams.get('token'))
  if (!owner && !qr.settings.publicWall) {
    return NextResponse.json({ entries: [] })
  }

  const entries = (owner
    ? await sql`
        SELECT id, author_name, message, media_type, status, created_at
        FROM guestbook_entries WHERE qr_id = ${qr.id}
        ORDER BY created_at DESC LIMIT 500
      `
    : await sql`
        SELECT id, author_name, message, media_type, status, created_at
        FROM guestbook_entries WHERE qr_id = ${qr.id} AND status = 'approved'
        ORDER BY created_at DESC LIMIT 300
      `) as unknown as GuestbookEntry[]

  const res = NextResponse.json({ entries })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  let pendingBlobUrl: string | null = null
  try {
    const { slug } = await params
    const body = await req.json().catch(() => ({}))
    pendingBlobUrl = typeof body.media_blob_url === 'string' && body.media_blob_url ? body.media_blob_url : null

    const fail = async (error: string, status: number) => {
      if (pendingBlobUrl) await deleteBlob(pendingBlobUrl).catch(() => undefined)
      return NextResponse.json({ error }, { status })
    }

    const qr = await loadGuestbookQr(slug)
    if (!qr || qr.qr_mode !== 'guestbook' || !qr.is_claimed || qr.is_active === false) {
      return fail('Anı defteri bulunamadı', 404)
    }
    if (!qr.settings.open) return fail('Bu anı defteri şu an yeni anı kabul etmiyor', 403)
    if (qr.settings.pinHash && hashPin(String(body.pin || '')) !== qr.settings.pinHash) {
      return fail('PIN hatalı', 403)
    }

    const ip = clientIp(req.headers)
    if (!(await consumeRateLimit(`gb:${slug}:${ip}`, 12, 3600))) {
      return fail('Çok fazla anı gönderildi. Lütfen biraz sonra tekrar dene.', 429)
    }

    const authorName = String(body.author_name || '').trim().slice(0, 80)
    const message = String(body.message || '').trim().slice(0, 2000)
    if (!authorName) return fail('Adını yazmalısın', 400)
    if (!message && !pendingBlobUrl) return fail('Bir mesaj yaz ya da ses/video/fotoğraf ekle', 400)

    const countRows = (await sql`
      SELECT COUNT(*)::int AS count FROM guestbook_entries WHERE qr_id = ${qr.id} AND status <> 'rejected'
    `) as Array<{ count: number }>
    if (Number(countRows[0]?.count || 0) >= qr.settings.entryLimit) {
      return fail('Bu anı defteri doldu', 409)
    }

    let mediaType: string | null = null
    let blobUrl: string | null = null
    if (pendingBlobUrl) {
      const resolved = await resolveDirectUpload(pendingBlobUrl, 'gb', slug, qr.order_type)
      if (!resolved.ok) return fail(resolved.error, 400)
      mediaType = resolved.mediaType
      blobUrl = resolved.url
    }

    const status = qr.settings.moderation ? 'pending' : 'approved'
    const rows = (await sql`
      INSERT INTO guestbook_entries (qr_id, author_name, message, media_type, blob_url, status, ip_hash)
      VALUES (${qr.id}, ${authorName}, ${message}, ${mediaType}, ${blobUrl}, ${status}, ${hashIp(ip)})
      RETURNING id
    `) as Array<{ id: string }>
    pendingBlobUrl = null

    return NextResponse.json({ id: rows[0]?.id, status })
  } catch (err) {
    console.error('[guestbook/entries POST]', err)
    if (pendingBlobUrl) await deleteBlob(pendingBlobUrl).catch(() => undefined)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
