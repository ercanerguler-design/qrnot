import { NextRequest, NextResponse } from 'next/server'
import { streamPrivateBlob } from '@/lib/blob'
import { getDppUser } from '@/lib/dpp/auth'
import { getProduct, resolvePassport } from '@/lib/dpp/server'

// Ürün görseli. ?p={publicId} → yayınlanmış sürümün görseli (herkese açık)
//              ?id={productId} → taslaktaki görsel (sadece firma paneli)

export async function GET(req: NextRequest) {
  const publicId = req.nextUrl.searchParams.get('p')
  const productId = req.nextUrl.searchParams.get('id')
  let url: string | null = null

  if (publicId) {
    const r = await resolvePassport(publicId)
    url = r ? ((r.published as { imageUrl?: string | null }).imageUrl ?? null) : null
  } else if (productId) {
    const user = await getDppUser(req)
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    url = (await getProduct(user.companyId, productId))?.image_url ?? null
  }
  if (!url) return NextResponse.json({ error: 'Görsel yok' }, { status: 404 })

  const res = await streamPrivateBlob(url, null)
  if (!res) return NextResponse.json({ error: 'Görsel yok' }, { status: 404 })
  // Yayınlanmış görsel değişmez (yeni görsel yeni dosya olur): tarayıcı önbelleğine izin ver
  if (publicId) res.headers.set('Cache-Control', 'public, max-age=3600')
  return res
}
