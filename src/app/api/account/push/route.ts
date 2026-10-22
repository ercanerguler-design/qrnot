import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'
import { pushEnabled } from '@/lib/push'

// Bu cihazı anlık bildirimlere kaydeder (POST) ya da kaydı siler (DELETE).
export async function POST(req: NextRequest) {
  await ensureGrowthSchema()
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 })
  if (!pushEnabled()) return NextResponse.json({ error: 'Bildirim servisi henüz aktif değil' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  const endpoint = String(body?.endpoint || '')
  const p256dh = String(body?.keys?.p256dh || '')
  const auth = String(body?.keys?.auth || '')
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) {
    return NextResponse.json({ error: 'Geçersiz abonelik' }, { status: 400 })
  }
  await sql`
    INSERT INTO push_subscriptions (endpoint, user_id, keys) VALUES (${endpoint}, ${user.id}, ${JSON.stringify({ p256dh, auth })}::jsonb)
    ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, keys = EXCLUDED.keys
  `
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  await ensureGrowthSchema()
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${String(body?.endpoint || '')} AND user_id = ${user.id}`
  return NextResponse.json({ ok: true })
}
