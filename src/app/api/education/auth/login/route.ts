import { NextRequest, NextResponse } from 'next/server'
import { applyEducationAuthCookie, authenticateEducationCredentials, createEducationSession } from '@/lib/educationAuth'
import { listAdminRealmsByEmail, realmLoginPath } from '@/lib/adminRealm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 })
    }

    const user = await authenticateEducationCredentials(email, password)
    if (!user) {
      const realms = await listAdminRealmsByEmail(email)
      if (!realms.includes('education') && realms.length > 0) {
        return NextResponse.json({ error: `Bu hesap ${realmLoginPath(realms[0])} paneline ait.` }, { status: 403 })
      }
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 })
    }

    const token = await createEducationSession(user.id)
    const res = NextResponse.json({ user })
    return applyEducationAuthCookie(res, token)
  } catch (err) {
    console.error('[education/auth/login]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
