import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const userId = String(body.userId || '').trim()
    const accountTypeRaw = String(body.accountType || '').trim().toLowerCase()
    const accountType = accountTypeRaw === 'corporate' ? 'corporate' : accountTypeRaw === 'individual' ? 'individual' : ''

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    if (!userId || !accountType) {
      return NextResponse.json({ error: 'Geçerli kullanıcı ve hesap tipi gerekli' }, { status: 400 })
    }

    const rows = await sql`
      UPDATE users
      SET account_type = ${accountType},
          updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, account_type
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, accountType: rows[0].account_type })
  } catch (err) {
    console.error('[admin/user/type]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
