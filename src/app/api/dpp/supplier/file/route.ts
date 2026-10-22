import { NextRequest, NextResponse } from 'next/server'
import { streamPrivateBlob } from '@/lib/blob'
import { getDppUser } from '@/lib/dpp/auth'
import { supplierFileFor } from '@/lib/dpp/suppliers'

// Tedarikçinin yüklediği belge: firma paneli oturumu (kendi firması) ya da talebin token'ı (?t=) ile görüntülenir.

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const token = q.get('t') || undefined
  const user = token ? null : await getDppUser(req)
  const file = await supplierFileFor(q.get('r') || '', Number(q.get('i')), { companyId: user?.companyId, token })
  if (!file) return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })
  const res = await streamPrivateBlob(file.url, req.headers.get('range'))
  if (!res) return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })
  const ext = file.contentType === 'application/pdf' ? 'pdf' : file.contentType.split('/')[1] || 'bin'
  const filename = `${file.title.replace(/[^\p{L}\p{N} ._-]/gu, '').trim() || 'belge'}.${ext}`
  res.headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(filename)}`)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}
