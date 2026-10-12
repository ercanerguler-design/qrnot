import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const userId = String(body.userId || '').trim()
    const amount = Math.max(1, Number(body.amount) || 0)

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    if (!userId || amount <= 0) {
      return NextResponse.json({ error: 'Geçerli kullanıcı ve hak adedi gerekli' }, { status: 400 })
    }

    const rows = await sql`
      UPDATE users
      SET paid_slots = paid_slots + ${amount},
          updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/user/credits]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}