import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

export const dynamic = 'force-dynamic'

// Giriş yapmış kullanıcının mağaza siparişleri (hesabına bağlı veya aynı e-postayla verilmiş).
export async function GET(req: NextRequest) {
  await ensureGrowthSchema()
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 })

  const orders = await sql`
    SELECT order_no, access_key, status, currency, total, items, tracking_no, created_at
    FROM shop_orders
    WHERE (user_id = ${user.id} OR LOWER(email) = LOWER(${user.email}))
      AND status <> 'pending'
    ORDER BY created_at DESC
    LIMIT 50
  `
  const res = NextResponse.json({ orders })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
