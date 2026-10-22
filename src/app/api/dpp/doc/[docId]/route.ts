import { NextRequest, NextResponse } from 'next/server'
import { streamPrivateBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { getDppUser } from '@/lib/dpp/auth'
import { ensureDppSchema } from '@/lib/dpp/schema'

// Pasaport belgesi (PDF / görsel).
// Herkese açık belge: ürün yayınlanmışsa herkes. Kısıtlı belge: ?k= yetkili erişim anahtarı ya da firma paneli oturumu.

export async function GET(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(docId)) return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })
  await ensureDppSchema()
  const rows = (await sql`
    SELECT d.blob_url, d.visibility, d.title, d.content_type, p.company_id, p.published IS NOT NULL AS published, c.restricted_key, c.is_active
    FROM dpp_documents d JOIN dpp_products p ON p.id = d.product_id JOIN dpp_companies c ON c.id = p.company_id
    WHERE d.id = ${docId}
  `) as Array<{ blob_url: string; visibility: string; title: string; content_type: string; company_id: string; published: boolean; restricted_key: string; is_active: boolean }>
  const doc = rows[0]
  if (!doc) return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })

  const key = req.nextUrl.searchParams.get('k')
  const panelUser = await getDppUser(req)
  const isOwnCompany = panelUser?.companyId === doc.company_id
  const publicOk = doc.is_active && doc.published && doc.visibility === 'public'
  const restrictedOk = doc.is_active && doc.published && Boolean(key) && key === doc.restricted_key
  if (!isOwnCompany && !publicOk && !restrictedOk) return NextResponse.json({ error: 'Bu belgeye erişim yetkin yok' }, { status: 403 })

  const res = await streamPrivateBlob(doc.blob_url, req.headers.get('range'))
  if (!res) return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })
  const ext = doc.content_type === 'application/pdf' ? 'pdf' : (doc.content_type.split('/')[1] || 'bin')
  const filename = `${doc.title.replace(/[^\p{L}\p{N} ._-]/gu, '').trim() || 'belge'}.${ext}`
  res.headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(filename)}`)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  return res
}
