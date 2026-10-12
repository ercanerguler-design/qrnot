import { NextRequest, NextResponse } from 'next/server'
import { applyAuthCookie, createUser, createUserSession, getUserByEmail, normalizeEmail, validatePassword, verifyPassword } from '@/lib/auth'
import { isLoginLocked, recordLoginFailure } from '@/lib/adminAuth'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = normalizeEmail(String(body.email || ''))
    const password = String(body.password || '')

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi gir' }, { status: 400 })
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      // Kayıt formu giriş gibi de çalışır; giriş kilidi burada da geçerli olmalı.
      if (await isLoginLocked(req, 'user', email)) {
        return NextResponse.json({ error: 'Çok fazla hatalı deneme. Lütfen 1 saat sonra tekrar dene.' }, { status: 429 })
      }
      // Idempotent registration UX: if password matches, continue as login.
      if (verifyPassword(password, existingUser.password_hash)) {
        const token = await createUserSession(existingUser.id)
        const res = NextResponse.json({
          user: {
            id: existingUser.id,
            email: existingUser.email,
            freeSlots: Number(existingUser.free_slots),
            paidSlots: Number(existingUser.paid_slots),
            usedSlots: Number(existingUser.used_slots),
            remainingSlots: Math.max(0, Number(existingUser.free_slots) + Number(existingUser.paid_slots) - Number(existingUser.used_slots)),
          },
          message: 'Bu e-posta zaten kayıtlı. Mevcut hesabına giriş yapıldı.',
        })

        return applyAuthCookie(res, token)
      }

      await recordLoginFailure(req, 'user', email)
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı. Şifrenle giriş yapabilirsin.' }, { status: 409 })
    }

    // Toplu / otomatik hesap açmayı sınırla.
    if (!(await consumeRateLimit(`register:${clientIp(req.headers)}`, 5, 3600))) {
      return NextResponse.json({ error: 'Çok fazla hesap oluşturuldu. Lütfen daha sonra tekrar dene.' }, { status: 429 })
    }

    const user = await createUser(email, password)
    const token = await createUserSession(user.id)
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        freeSlots: Number(user.free_slots),
        paidSlots: Number(user.paid_slots),
        usedSlots: Number(user.used_slots),
        remainingSlots: Number(user.free_slots) + Number(user.paid_slots) - Number(user.used_slots),
      },
    })

    return applyAuthCookie(res, token)
  } catch (err) {
    console.error('[auth/register]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}