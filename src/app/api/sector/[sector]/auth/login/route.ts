import { NextRequest, NextResponse } from 'next/server'
import { applySectorAuthCookie, authenticateSectorCredentials, createSectorSession, normalizeSector } from '@/lib/sectorPlatform'
import { listAdminRealmsByEmail, realmLoginPath } from '@/lib/adminRealm'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sector: string }> }) {
  try {
    const { sector: rawSector } = await params
    const sector = normalizeSector(rawSector)
    if (!sector) {
      return NextResponse.json({ error: 'Geçersiz sektör' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 })
    }

    const user = await authenticateSectorCredentials(sector, email, password)
    if (!user) {
      const realms = await listAdminRealmsByEmail(email)
      if (!realms.includes(sector) && realms.length > 0) {
        return NextResponse.json({ error: `Bu hesap ${realmLoginPath(realms[0])} paneline ait.` }, { status: 403 })
      }
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 })
    }

    const token = await createSectorSession(sector, user.id)
    const res = NextResponse.json({ user })
    return applySectorAuthCookie(res, sector, token)
  } catch (err) {
    console.error('[sector/auth/login]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
