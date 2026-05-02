import { NextRequest, NextResponse } from 'next/server'
import { getBlob } from '@/lib/blob'
import { ensureQrSchema, sql } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureQrSchema()

    const { slug } = await params
    const rows = await sql`
      SELECT is_claimed, audio_url
      FROM qr_codes WHERE slug = ${slug}
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
    }

    const qr = rows[0]
    if (!qr.is_claimed || !qr.audio_url) {
      return NextResponse.json({ error: 'Ses dosyası bulunamadı' }, { status: 404 })
    }

    const blobResult = await getBlob(qr.audio_url, false)
    if (!blobResult || !blobResult.stream) {
      return NextResponse.json({ error: 'Ses dosyası bulunamadı' }, { status: 404 })
    }

    const headers = new Headers(Array.from(blobResult.headers.entries()))
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    headers.set('Surrogate-Control', 'no-store')

    return new NextResponse(blobResult.stream as BodyInit, { headers })
  } catch (err) {
    console.error('[qr/[slug]/audio GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}