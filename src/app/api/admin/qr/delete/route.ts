import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'
import { ensureQrSchema, QRCode, sql } from '@/lib/db'
import { deleteQrWithMedia } from '@/lib/qrDelete'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const slug = String(body.slug || '').trim()

    if (!(await checkAdminPassword(req, providedPassword))) {
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

    const result = await deleteQrWithMedia(rows[0].id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    return NextResponse.json({ ok: true, slug })
  } catch (err) {
    console.error('[admin/qr/delete]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}