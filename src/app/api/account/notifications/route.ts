import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

export const dynamic = 'force-dynamic'

// Hesaptaki QR'ların bildirimleri: okutma, cevap, grup mesajı, kayıp eşya konumu.
export async function GET(req: NextRequest) {
  await ensureGrowthSchema()
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 })
  const rows = await sql`
    SELECT e.id, e.kind, e.data, e.read_at, e.created_at, q.slug, q.title
    FROM qr_events e JOIN qr_codes q ON q.id = e.qr_id
    WHERE q.owner_user_id = ${user.id} OR q.creator_user_id = ${user.id}
    ORDER BY e.created_at DESC
    LIMIT 100
  `
  const unread = (rows as Array<{ read_at: string | null }>).filter((r) => !r.read_at).length
  const res = NextResponse.json({ events: rows, unread })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

// Tümünü okundu işaretle
export async function POST(req: NextRequest) {
  await ensureGrowthSchema()
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 })
  await sql`
    UPDATE qr_events SET read_at = NOW()
    WHERE read_at IS NULL AND qr_id IN (SELECT id FROM qr_codes WHERE owner_user_id = ${user.id} OR creator_user_id = ${user.id})
  `
  return NextResponse.json({ ok: true })
}
