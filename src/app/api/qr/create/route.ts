import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema } from '@/lib/db'
import { createBlankQRCodes } from '@/lib/qr'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json()
    const { password, count = 1, orderType = 'individual' } = body
    const providedPassword = String(password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const normalizedOrderType = orderType === 'corporate' ? 'corporate' : 'individual'

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const n = Math.min(Math.max(1, Number(count) || 1), 500)
    if (normalizedOrderType === 'corporate' && n < 100) {
      return NextResponse.json({ error: 'Kurumsal üretimde minimum 100 QR oluşturulmalıdır' }, { status: 400 })
    }

    const baseUrl = req.nextUrl.origin || String(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()
    const created = await createBlankQRCodes(n, baseUrl, { orderType: normalizedOrderType })

    return NextResponse.json({ created, orderType: normalizedOrderType })
  } catch (err) {
    console.error('[qr/create]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
