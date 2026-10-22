import { NextRequest, NextResponse } from 'next/server'
import { createQrEntry, listQrEntries } from '@/lib/qrEntries'
import { isOwnerToken, loadFeatureQr } from '@/lib/qrFeatures'

// Grup hediyesi: sahibin paylaştığı gizli linkle birden fazla kişi aynı QR'a mesaj ekler.
// Mesajlar sahip onaylayınca QR sayfasında görünür.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const qr = await loadFeatureQr(slug)
    if (!qr || !qr.is_claimed || qr.is_active === false || qr.qr_mode === 'guestbook') {
      return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    }
    const key = req.nextUrl.searchParams.get('k') || ''
    if (!qr.group_token || key !== qr.group_token) {
      return NextResponse.json({ error: 'Bu davet linki geçersiz ya da kapatılmış' }, { status: 403 })
    }
    return createQrEntry(req, qr, 'group', 'gp')
  } catch (err) {
    console.error('[qr/group POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const qr = await loadFeatureQr(slug)
  if (!qr || !isOwnerToken(qr, req.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }
  const res = NextResponse.json({ entries: await listQrEntries(qr.id, 'group', false) })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
