import { NextRequest, NextResponse } from 'next/server'
import { clearHotelAuthCookie, deleteHotelSession, HOTEL_AUTH_COOKIE_NAME } from '@/lib/hotelAuth'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(HOTEL_AUTH_COOKIE_NAME)?.value?.trim()
    await deleteHotelSession(token)
    return clearHotelAuthCookie(NextResponse.json({ ok: true }))
  } catch (err) {
    console.error('[hotel/auth/logout]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
