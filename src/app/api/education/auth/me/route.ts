import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedEducationUser } from '@/lib/educationAuth'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedEducationUser(req)
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch (err) {
    console.error('[education/auth/me]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
