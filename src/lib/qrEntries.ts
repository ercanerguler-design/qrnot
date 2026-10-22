import { NextRequest, NextResponse } from 'next/server'
import { deleteBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { resolveDirectUpload, type UploadScope } from '@/lib/directUpload'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { hashGuestDevice, hashIp, newGuestDevice, readGuestDevice, setGuestDeviceCookie } from '@/lib/guestbookServer'
import { recordQrEvent, type FeatureQr } from '@/lib/qrFeatures'

// Normal (anı defteri olmayan) QR'lara misafir girişi: "cevap ver" (kind = reply) ve "grup hediyesi" (kind = group).
// guestbook_entries tablosu ortak kullanılır; silme / dosya temizliği / cihaz çerezi altyapısı aynıdır.

export type EntryKind = 'reply' | 'group'

export async function createQrEntry(req: NextRequest, qr: FeatureQr, kind: EntryKind, scope: UploadScope) {
  const body = await req.json().catch(() => ({}))
  let pendingBlobUrl: string | null = typeof body.media_blob_url === 'string' && body.media_blob_url ? body.media_blob_url : null
  const fail = async (error: string, status: number) => {
    if (pendingBlobUrl) await deleteBlob(pendingBlobUrl).catch(() => undefined)
    return NextResponse.json({ error }, { status })
  }

  const ip = clientIp(req.headers)
  if (!(await consumeRateLimit(`${kind}:${qr.slug}:${ip}`, kind === 'group' ? 40 : 10, 3600))) {
    return fail('Çok fazla deneme. Lütfen biraz sonra tekrar dene.', 429)
  }

  const authorName = String(body.author_name || '').trim().slice(0, 80)
  const message = String(body.message || '').trim().slice(0, 2000)
  if (!authorName) return fail('Adını yazmalısın', 400)
  if (!message && !pendingBlobUrl) return fail('Bir mesaj yaz ya da ses/video/fotoğraf ekle', 400)

  // Aynı cihazdan aynı QR'a tek mesaj (grup hediyesinde) / en fazla 3 cevap
  const deviceId = readGuestDevice(req) || newGuestDevice()
  const deviceHash = hashGuestDevice(deviceId)
  const dup = (await sql`
    SELECT COUNT(*)::int AS n FROM guestbook_entries
    WHERE qr_id = ${qr.id} AND kind = ${kind} AND device_hash = ${deviceHash} AND status <> 'rejected'
  `) as Array<{ n: number }>
  if (Number(dup[0]?.n || 0) >= (kind === 'group' ? 1 : 3)) {
    return fail(kind === 'group' ? 'Bu hediyeye zaten bir mesaj bıraktın. Teşekkürler! 💛' : 'Bu QR için yeterince cevap bıraktın. Teşekkürler! 💛', 409)
  }
  const total = (await sql`SELECT COUNT(*)::int AS n FROM guestbook_entries WHERE qr_id = ${qr.id} AND kind = ${kind}`) as Array<{ n: number }>
  if (Number(total[0]?.n || 0) >= 300) return fail('Bu QR için mesaj sınırına ulaşıldı', 409)

  let mediaType: string | null = null
  let blobUrl: string | null = null
  if (pendingBlobUrl) {
    const resolved = await resolveDirectUpload(pendingBlobUrl, scope, qr.slug, qr.order_type)
    if (!resolved.ok) return fail(resolved.error, 400)
    mediaType = resolved.mediaType
    blobUrl = resolved.url
  }

  // Cevaplar sadece sahibe görünür (onay gerekmez); grup mesajları sahip onaylayınca herkese görünür.
  const status = kind === 'reply' ? 'approved' : 'pending'
  const rows = (await sql`
    INSERT INTO guestbook_entries (qr_id, author_name, message, media_type, blob_url, status, ip_hash, device_hash, kind)
    VALUES (${qr.id}, ${authorName}, ${message}, ${mediaType}, ${blobUrl}, ${status}, ${hashIp(ip)}, ${deviceHash}, ${kind})
    RETURNING id
  `) as Array<{ id: string }>
  pendingBlobUrl = null

  await recordQrEvent(qr, kind, { entryId: rows[0]?.id, author: authorName }).catch((e) => console.warn('[entry event]', e))

  const res = NextResponse.json({ id: rows[0]?.id, status })
  setGuestDeviceCookie(res, deviceId)
  return res
}

export interface QrEntryRow {
  id: string
  author_name: string
  message: string
  media_type: string | null
  status: string
  created_at: string
}

export async function listQrEntries(qrId: string, kind: EntryKind, onlyApproved: boolean) {
  return (onlyApproved
    ? await sql`
        SELECT id, author_name, message, media_type, status, created_at FROM guestbook_entries
        WHERE qr_id = ${qrId} AND kind = ${kind} AND status = 'approved' ORDER BY created_at ASC LIMIT 300
      `
    : await sql`
        SELECT id, author_name, message, media_type, status, created_at FROM guestbook_entries
        WHERE qr_id = ${qrId} AND kind = ${kind} ORDER BY created_at DESC LIMIT 300
      `) as unknown as QrEntryRow[]
}
