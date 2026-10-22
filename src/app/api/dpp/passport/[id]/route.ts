import { NextRequest, NextResponse } from 'next/server'
import { loadPublicPassport, passportJson } from '@/lib/dpp/server'

// Makinenin okuyabileceği pasaport (JSON). Denetim yazılımları, geri dönüşüm tesisleri ve entegrasyonlar için.
// ?k= yetkili erişim anahtarı verilirse kısıtlı alanlar da döner.

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const view = await loadPublicPassport(id, req.nextUrl.searchParams.get('k'))
  if (!view) return NextResponse.json({ error: 'Pasaport bulunamadı' }, { status: 404 })
  return NextResponse.json(passportJson(view), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      // Yeni yayın JSON'a hemen yansısın: CDN'de saklanmaz, tarayıcıda en fazla 60 sn
      'Cache-Control': view.restrictedAccess ? 'no-store' : 'public, max-age=60',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  })
}
