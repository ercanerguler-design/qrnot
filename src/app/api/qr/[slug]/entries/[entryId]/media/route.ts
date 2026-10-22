import { NextRequest, NextResponse } from 'next/server'
import { streamPrivateBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { isOwnerToken, isTimeLocked, loadFeatureQr } from '@/lib/qrFeatures'

// Cevap / grup mesajı medyası: sahip her zaman; herkes sadece onaylı grup mesajını (kapsül açıldıysa).
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; entryId: string }> }) {
  try {
    const { slug, entryId } = await params
    if (!/^[0-9a-f-]{36}$/i.test(entryId)) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    const qr = await loadFeatureQr(slug)
    if (!qr) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const rows = (await sql`
      SELECT blob_url, status, kind FROM guestbook_entries WHERE id = ${entryId} AND qr_id = ${qr.id} AND kind IN ('reply', 'group') LIMIT 1
    `) as Array<{ blob_url: string | null; status: string; kind: string }>
    const entry = rows[0]
    if (!entry?.blob_url) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const owner = isOwnerToken(qr, req.nextUrl.searchParams.get('token'))
    const publicOk = entry.kind === 'group' && entry.status === 'approved' && !isTimeLocked(qr)
    if (!owner && !publicOk) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })

    const response = await streamPrivateBlob(entry.blob_url, req.headers.get('range'))
    if (!response) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    if (req.nextUrl.searchParams.get('download') === '1') {
      const ext = (entry.blob_url.split('?')[0].split('.').pop() || 'bin').slice(0, 5)
      response.headers.set('content-disposition', `attachment; filename="mesaj-${entryId.slice(0, 8)}.${ext}"`)
    }
    return response
  } catch (err) {
    console.error('[qr/entries/media]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
