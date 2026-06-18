import { NextRequest, NextResponse } from 'next/server'
import { createBootstrapPlatformAdminIfNeeded, normalizeSector } from '@/lib/sectorPlatform'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sector: string }> }) {
  try {
    const { sector: rawSector } = await params
    const sector = normalizeSector(rawSector)
    if (!sector) {
      return NextResponse.json({ error: 'Geçersiz sektör' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const bootstrapPassword = String(body.bootstrapPassword || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || password.length < 6) {
      return NextResponse.json({ error: 'Geçerli e-posta ve en az 6 karakter şifre gerekli' }, { status: 400 })
    }

    const userId = await createBootstrapPlatformAdminIfNeeded(sector, email, password, bootstrapPassword)
    return NextResponse.json({ ok: true, userId })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 })
    }

    console.error('[sector/auth/bootstrap]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
