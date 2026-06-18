import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedHotelUser } from '@/lib/hotelAuth'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedHotelUser(req)
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch (err) {
    console.error('[hotel/auth/me]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
