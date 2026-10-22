import { NextRequest, NextResponse } from 'next/server'
import { isLoginLocked, recordLoginFailure } from '@/lib/adminAuth'
import { normalizeEmail } from '@/lib/auth'
import { changeDppPassword, createDppSession, deleteDppSession, findDppUserForLogin, getDppUser, setDppCookie } from '@/lib/dpp/auth'

// DPP paneli oturumu. GET: oturumdaki kullanıcı · POST: giriş / çıkış / şifre değiştirme

export async function GET(req: NextRequest) {
  const user = await getDppUser(req)
  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')

    if (action === 'login') {
      const email = normalizeEmail(String(body.email || ''))
      const password = String(body.password || '')
      if (!email || !password) return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 })
      if (await isLoginLocked(req, 'dpp', email)) {
        return NextResponse.json({ error: 'Çok fazla hatalı deneme. Bir saat sonra tekrar dene ya da yöneticinden şifre sıfırlamasını iste.' }, { status: 429 })
      }
      const userId = await findDppUserForLogin(email, password)
      if (!userId) {
        await recordLoginFailure(req, 'dpp', email)
        return NextResponse.json({ error: 'E-posta ya da şifre hatalı' }, { status: 401 })
      }
      return setDppCookie(NextResponse.json({ ok: true }), await createDppSession(userId))
    }

    if (action === 'logout') {
      await deleteDppSession(req)
      return setDppCookie(NextResponse.json({ ok: true }), '')
    }

    if (action === 'password') {
      const user = await getDppUser(req)
      if (!user) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
      await changeDppPassword(user.id, String(body.current || ''), String(body.next || ''))
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
