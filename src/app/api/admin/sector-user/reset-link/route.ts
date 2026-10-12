import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, sql } from '@/lib/db'
import { createPanelPasswordResetToken, PanelRealm } from '@/lib/panelReset'

function normalizeRealm(input: unknown): PanelRealm | null {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'hotel' || value === 'education' || value === 'health' || value === 'factory' || value === 'retail' || value === 'logistics') {
    return value
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const realm = normalizeRealm(body.realm)
    const userId = String(body.userId || '').trim()

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    if (!realm || !userId) {
      return NextResponse.json({ error: 'realm ve userId gerekli' }, { status: 400 })
    }

    let rows: Record<string, unknown>[] = []
    if (realm === 'hotel') {
      rows = await sql`SELECT id, email FROM hotel_users WHERE id = ${userId} LIMIT 1`
    } else if (realm === 'education') {
      rows = await sql`SELECT id, email FROM education_users WHERE id = ${userId} LIMIT 1`
    } else if (realm === 'health') {
      rows = await sql`SELECT id, email FROM health_users WHERE id = ${userId} LIMIT 1`
    } else if (realm === 'factory') {
      rows = await sql`SELECT id, email FROM factory_users WHERE id = ${userId} LIMIT 1`
    } else if (realm === 'retail') {
      rows = await sql`SELECT id, email FROM retail_users WHERE id = ${userId} LIMIT 1`
    } else {
      rows = await sql`SELECT id, email FROM logistics_users WHERE id = ${userId} LIMIT 1`
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const token = await createPanelPasswordResetToken(realm, String(rows[0].id || ''), String(rows[0].email || ''))
    const baseUrl = req.nextUrl.origin || String(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()
    const resetUrl = `${baseUrl}/reset-panel-password/${token}`

    return NextResponse.json({
      ok: true,
      realm,
      email: String(rows[0].email || ''),
      resetUrl,
    })
  } catch (err) {
    console.error('[admin/sector-user/reset-link]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
