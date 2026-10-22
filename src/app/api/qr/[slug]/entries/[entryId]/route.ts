import { NextRequest, NextResponse } from 'next/server'
import { deleteBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { isOwnerToken, loadFeatureQr } from '@/lib/qrFeatures'

// Sahip: grup mesajını onaylar / reddeder (PATCH) ya da cevap / grup mesajını siler (DELETE).
async function ownerEntry(req: NextRequest, slug: string, entryId: string, token: unknown) {
  const qr = await loadFeatureQr(slug)
  if (!qr || !isOwnerToken(qr, String(token || ''))) return { error: NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 }) }
  if (!/^[0-9a-f-]{36}$/i.test(entryId)) return { error: NextResponse.json({ error: 'Bulunamadı' }, { status: 404 }) }
  const rows = (await sql`
    SELECT id, blob_url, kind FROM guestbook_entries WHERE id = ${entryId} AND qr_id = ${qr.id} AND kind IN ('reply', 'group')
  `) as Array<{ id: string; blob_url: string | null; kind: string }>
  if (rows.length === 0) return { error: NextResponse.json({ error: 'Bulunamadı' }, { status: 404 }) }
  return { qr, entry: rows[0] }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; entryId: string }> }) {
  const { slug, entryId } = await params
  const body = await req.json().catch(() => ({}))
  const found = await ownerEntry(req, slug, entryId, body.token)
  if (found.error) return found.error
  const status = body.status === 'approved' || body.status === 'rejected' ? body.status : null
  if (!status) return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })
  await sql`UPDATE guestbook_entries SET status = ${status}, updated_at = NOW() WHERE id = ${entryId}`
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string; entryId: string }> }) {
  const { slug, entryId } = await params
  const body = await req.json().catch(() => ({}))
  const found = await ownerEntry(req, slug, entryId, body.token)
  if (found.error) return found.error
  if (found.entry.blob_url) {
    try {
      await deleteBlob(found.entry.blob_url)
    } catch (error) {
      console.warn('[entry delete blob]', error)
      return NextResponse.json({ error: 'Dosya silinemedi, tekrar dene' }, { status: 502 })
    }
  }
  await sql`DELETE FROM guestbook_entries WHERE id = ${entryId}`
  return NextResponse.json({ ok: true })
}
