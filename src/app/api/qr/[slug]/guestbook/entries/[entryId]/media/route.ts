import { NextRequest, NextResponse } from 'next/server'
import { streamPrivateBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { isGuestbookOwner, loadGuestbookQr } from '@/lib/guestbookServer'

// Anı medyasını akıtır: sahip her zaman; misafir sadece onaylı + herkese açık duvarda.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; entryId: string }> }) {
  try {
    const { slug, entryId } = await params
    const qr = await loadGuestbookQr(slug)
    if (!qr || qr.qr_mode !== 'guestbook') return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const rows = (await sql`
      SELECT blob_url, status FROM guestbook_entries WHERE id = ${entryId} AND qr_id = ${qr.id} LIMIT 1
    `) as Array<{ blob_url: string | null; status: string }>
    const entry = rows[0]
    if (!entry?.blob_url) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const owner = isGuestbookOwner(qr, req.nextUrl.searchParams.get('token'))
    if (!owner && !(entry.status === 'approved' && qr.settings.publicWall)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const response = await streamPrivateBlob(entry.blob_url, req.headers.get('range'))
    if (!response) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    if (req.nextUrl.searchParams.get('download') === '1') {
      const ext = (entry.blob_url.split('?')[0].split('.').pop() || 'bin').slice(0, 5)
      response.headers.set('content-disposition', `attachment; filename="ani-${entryId.slice(0, 8)}.${ext}"`)
    }
    return response
  } catch (err) {
    console.error('[guestbook/media]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
