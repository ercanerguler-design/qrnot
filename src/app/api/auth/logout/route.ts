import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, clearAuthCookie, deleteUserSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value?.trim()
    await deleteUserSession(token)
    return clearAuthCookie(NextResponse.json({ ok: true }))
  } catch (err) {
    console.error('[auth/logout]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}