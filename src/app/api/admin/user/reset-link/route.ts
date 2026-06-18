import { NextRequest, NextResponse } from 'next/server'
import { createPasswordResetToken } from '@/lib/auth'
import { ensureQrSchema, sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const userId = String(body.userId || '').trim()

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı seçilmedi' }, { status: 400 })
    }

    const rows = await sql`SELECT id, email FROM users WHERE id = ${userId} LIMIT 1`
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    await sql`
      DELETE FROM password_reset_tokens
      WHERE user_id = ${userId}
        AND used_at IS NULL
    `

    const token = await createPasswordResetToken(userId)
    const baseUrl = req.nextUrl.origin || String(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()
    const resetUrl = `${baseUrl}/reset-password/${token}`

    return NextResponse.json({
      ok: true,
      email: rows[0].email,
      resetUrl,
    })
  } catch (err) {
    console.error('[admin/user/reset-link]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}