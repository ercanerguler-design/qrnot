import { NextRequest, NextResponse } from 'next/server'
import { createQrEntry, listQrEntries } from '@/lib/qrEntries'
import { isOwnerToken, isTimeLocked, loadFeatureQr } from '@/lib/qrFeatures'

// "Cevap ver": hediyeyi alan kişi QR sahibine sesli / yazılı cevap bırakır. Cevapları sadece sahip görür.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const qr = await loadFeatureQr(slug)
    if (!qr || !qr.is_claimed || qr.is_active === false || qr.qr_mode === 'guestbook') {
      return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    }
    if (!qr.replies_enabled || isTimeLocked(qr)) return NextResponse.json({ error: 'Bu QR şu an cevap kabul etmiyor' }, { status: 403 })
    return createQrEntry(req, qr, 'reply', 'rp')
  } catch (err) {
    console.error('[qr/replies POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const qr = await loadFeatureQr(slug)
  if (!qr || !isOwnerToken(qr, req.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }
  const res = NextResponse.json({ entries: await listQrEntries(qr.id, 'reply', false) })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
