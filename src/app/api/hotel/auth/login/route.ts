import { NextRequest, NextResponse } from 'next/server'
import { applyHotelAuthCookie, authenticateHotelCredentials, createHotelSession } from '@/lib/hotelAuth'
import { listAdminRealmsByEmail, realmLoginPath } from '@/lib/adminRealm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 })
    }

    const user = await authenticateHotelCredentials(email, password)
    if (!user) {
      const realms = await listAdminRealmsByEmail(email)
      if (!realms.includes('hotel') && realms.length > 0) {
        return NextResponse.json({ error: `Bu hesap ${realmLoginPath(realms[0])} paneline ait.` }, { status: 403 })
      }
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 })
    }

    const token = await createHotelSession(user.id)
    const res = NextResponse.json({ user })
    return applyHotelAuthCookie(res, token)
  } catch (err) {
    console.error('[hotel/auth/login]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
