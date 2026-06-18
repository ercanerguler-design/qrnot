import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { ensureQrSchema, QRCode, sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
const FREE_TRIAL_LIMIT = 1

export async function GET(req: NextRequest) {
  try {
    await ensureQrSchema()

    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 })
    }

    const effectiveFreeSlots = Math.min(user.freeSlots, FREE_TRIAL_LIMIT)
    const remainingSlots = Math.max(0, effectiveFreeSlots + user.paidSlots - user.usedSlots)
    const freeRemaining = Math.max(0, effectiveFreeSlots - user.usedSlots)
    const paidRemaining = Math.max(0, user.paidSlots - Math.max(0, user.usedSlots - effectiveFreeSlots))

    const items = (await sql`
      SELECT slug, order_type, is_claimed, title, play_count, created_at, updated_at
      FROM qr_codes
      WHERE creator_user_id = ${user.id}
      ORDER BY created_at DESC
    `) as Array<Pick<QRCode, 'slug' | 'order_type' | 'is_claimed' | 'title' | 'play_count' | 'created_at' | 'updated_at'>>

    return NextResponse.json({
      user: {
        ...user,
        freeSlots: effectiveFreeSlots,
        remainingSlots,
      },
      counters: {
        freeRemaining,
        paidRemaining,
        remaining: remainingSlots,
      },
      items,
    })
  } catch (err) {
    console.error('[account/qrs]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}