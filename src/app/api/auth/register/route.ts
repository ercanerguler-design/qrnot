import { NextRequest, NextResponse } from 'next/server'
import { applyAuthCookie, createUser, createUserSession, getUserByEmail, normalizeEmail, validatePassword, verifyPassword } from '@/lib/auth'

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

      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı. Şifrenle giriş yapabilirsin.' }, { status: 409 })
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