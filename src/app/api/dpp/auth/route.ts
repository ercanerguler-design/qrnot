import { NextRequest, NextResponse } from 'next/server'
import { isLoginLocked, recordLoginFailure } from '@/lib/adminAuth'
import { normalizeEmail } from '@/lib/auth'
import { changeDppPassword, createDppSession, deleteDppSession, findDppUserForLogin, getDppUser, setDppCookie } from '@/lib/dpp/auth'
import { errorText, msg } from '@/lib/dpp/i18n'
import { requestLang } from '@/lib/dpp/requestLang'

// DPP paneli oturumu. GET: oturumdaki kullanıcı · POST: giriş / çıkış / şifre değiştirme

export async function GET(req: NextRequest) {
  const user = await getDppUser(req)
  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user })
}

export async function POST(req: NextRequest) {
  const lang = requestLang(req)
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')

    if (action === 'login') {
      const email = normalizeEmail(String(body.email || ''))
      const password = String(body.password || '')
      if (!email || !password) return NextResponse.json({ error: msg(lang, 'e_email_pw_required') }, { status: 400 })
      if (await isLoginLocked(req, 'dpp', email)) {
        return NextResponse.json({ error: msg(lang, 'e_locked') }, { status: 429 })
      }
      const userId = await findDppUserForLogin(email, password)
      if (!userId) {
        await recordLoginFailure(req, 'dpp', email)
        return NextResponse.json({ error: msg(lang, 'e_bad_login') }, { status: 401 })
      }
      return setDppCookie(NextResponse.json({ ok: true }), await createDppSession(userId))
    }

    if (action === 'logout') {
      await deleteDppSession(req)
      return setDppCookie(NextResponse.json({ ok: true }), '')
    }

    if (action === 'password') {
      const user = await getDppUser(req)
      if (!user) return NextResponse.json({ error: msg(lang, 'e_no_session') }, { status: 401 })
      await changeDppPassword(user.id, String(body.current || ''), String(body.next || ''))
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: msg(lang, 'e_invalid_action') }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: errorText(err, lang) }, { status: 400 })
  }
}
