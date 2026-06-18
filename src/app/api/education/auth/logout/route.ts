import { NextRequest, NextResponse } from 'next/server'
import { clearEducationAuthCookie, deleteEducationSession, EDUCATION_AUTH_COOKIE_NAME } from '@/lib/educationAuth'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(EDUCATION_AUTH_COOKIE_NAME)?.value?.trim()
    await deleteEducationSession(token)
    return clearEducationAuthCookie(NextResponse.json({ ok: true }))
  } catch (err) {
    console.error('[education/auth/logout]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
