import { NextRequest, NextResponse } from 'next/server'
import { sql, QRCode } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const rows = (await sql`
      SELECT id, slug, is_claimed, audio_url, title, play_count, created_at, updated_at
      FROM qr_codes WHERE slug = ${slug}
    `) as QRCode[]
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    }
    // admin_token hiçbir zaman dışarı çıkmasın
    return NextResponse.json(rows[0])
  } catch (err) {
    console.error('[qr/[slug] GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
