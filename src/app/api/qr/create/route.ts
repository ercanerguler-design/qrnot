import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, sql } from '@/lib/db'
import { createBlankQRCodes } from '@/lib/qr'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json()
    const { password, count = 1 } = body
    const providedPassword = String(password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const n = Math.min(Math.max(1, Number(count) || 1), 500)
    const baseUrl = req.nextUrl.origin || String(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()
    const created = await createBlankQRCodes(n, baseUrl)

    return NextResponse.json({ created })
  } catch (err) {
    console.error('[qr/create]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
