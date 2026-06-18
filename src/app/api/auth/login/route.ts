import { NextRequest, NextResponse } from 'next/server'
import { applyAuthCookie, createUserSession, getUserByEmail, normalizeEmail, verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = normalizeEmail(String(body.email || ''))
    const password = String(body.password || '')

    const user = await getUserByEmail(email)
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 })
    }

    const token = await createUserSession(user.id)
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        freeSlots: Number(user.free_slots),
        paidSlots: Number(user.paid_slots),
        usedSlots: Number(user.used_slots),
        remainingSlots: Math.max(0, Number(user.free_slots) + Number(user.paid_slots) - Number(user.used_slots)),
      },
    })

    return applyAuthCookie(res, token)
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}