import { NextRequest, NextResponse } from 'next/server'
import { deleteBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { isGuestbookOwner, loadGuestbookQr } from '@/lib/guestbookServer'

// Sahip: anıyı onaylar / reddeder (PATCH) veya kalıcı siler (DELETE).

type Ctx = { params: Promise<{ slug: string; entryId: string }> }

async function authorize(req: NextRequest, ctx: Ctx, token: unknown) {
  const { slug, entryId } = await ctx.params
  const qr = await loadGuestbookQr(slug)
  if (!qr || qr.qr_mode !== 'guestbook') return { error: NextResponse.json({ error: 'Anı defteri bulunamadı' }, { status: 404 }) }
  if (!isGuestbookOwner(qr, typeof token === 'string' ? token : null)) {
    return { error: NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 }) }
  }
  return { qr, entryId }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const body = await req.json().catch(() => ({}))
  const auth = await authorize(req, ctx, body.token)
  if ('error' in auth) return auth.error

  const status = body.status === 'approved' || body.status === 'rejected' || body.status === 'pending' ? body.status : null
  if (!status) return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })

  const rows = await sql`
    UPDATE guestbook_entries SET status = ${status}, updated_at = NOW()
    WHERE id = ${auth.entryId} AND qr_id = ${auth.qr.id}
    RETURNING id
  `
  if (rows.length === 0) return NextResponse.json({ error: 'Anı bulunamadı' }, { status: 404 })
  return NextResponse.json({ ok: true, status })
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const body = await req.json().catch(() => ({}))
  const auth = await authorize(req, ctx, body.token ?? req.nextUrl.searchParams.get('token'))
  if ('error' in auth) return auth.error

  const rows = (await sql`
    DELETE FROM guestbook_entries WHERE id = ${auth.entryId} AND qr_id = ${auth.qr.id}
    RETURNING blob_url
  `) as Array<{ blob_url: string | null }>
  if (rows.length === 0) return NextResponse.json({ error: 'Anı bulunamadı' }, { status: 404 })
  if (rows[0].blob_url) await deleteBlob(rows[0].blob_url).catch(() => undefined)
  return NextResponse.json({ ok: true })
}
