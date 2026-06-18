import { NextRequest, NextResponse } from 'next/server'
import { resetPasswordWithToken, validatePassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = String(body.token || '').trim()
    const password = String(body.password || '')

    if (!token) {
      return NextResponse.json({ error: 'Reset token gerekli' }, { status: 400 })
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
    }

    try {
      await resetPasswordWithToken(token, password)
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_RESET_TOKEN') {
        return NextResponse.json({ error: 'Reset linki geçersiz veya süresi dolmuş' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/reset-password]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}