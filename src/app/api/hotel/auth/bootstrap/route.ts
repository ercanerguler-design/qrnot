import { NextRequest, NextResponse } from 'next/server'
import { createHotelUser, getHotelUserByEmail } from '@/lib/hotelAuth'
import { getEducationUserByEmail } from '@/lib/educationAuth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const bootstrapPassword = String(body.bootstrapPassword || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!bootstrapPassword || !configuredPassword || bootstrapPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: 'Geçerli e-posta ve en az 6 karakter şifre gerekli' }, { status: 400 })
    }

    const existingHotelUser = await getHotelUserByEmail(email)
    const existingEducationUser = await getEducationUserByEmail(email)
    if (existingHotelUser || existingEducationUser) {
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 })
    }

    const user = await createHotelUser({
      email,
      password,
      role: 'platform_admin',
      hotelId: null,
    })

    return NextResponse.json({ ok: true, userId: user.id })
  } catch (err) {
    console.error('[hotel/auth/bootstrap]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
