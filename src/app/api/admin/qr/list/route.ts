import { NextRequest, NextResponse } from 'next/server'
import { deactivateAllExpiredDemoQrs, ensureQrSchema, QRCode, sql } from '@/lib/db'

const INDIVIDUAL_PRICE = 149
const CORPORATE_UNIT_PRICE = 25.99

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()
    await deactivateAllExpiredDemoQrs()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const filter = String(body.filter || 'all')
    const orderType = String(body.orderType || 'all')

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const rows = (await sql`
      SELECT slug, is_demo, order_type, creator_user_id, is_active, is_claimed, title, demo_expires_at, created_at, updated_at,
              play_count, recording_count, recording_limit, video_recording_count, video_recording_limit, video_max_seconds
      FROM qr_codes
      ORDER BY created_at DESC
      LIMIT 5000
    `) as Array<Pick<QRCode, 'slug' | 'is_demo' | 'order_type' | 'creator_user_id' | 'is_active' | 'is_claimed' | 'title' | 'demo_expires_at' | 'created_at' | 'updated_at' | 'play_count' | 'recording_count' | 'recording_limit' | 'video_recording_count' | 'video_recording_limit'>>

    const users = await sql`
      SELECT id, email, account_type, free_slots, paid_slots, used_slots, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 2000
    `

    const demoQuotaRows = await sql`
      SELECT COUNT(*)::int AS session_count, COALESCE(SUM(qr_created_count), 0)::int AS total_created
      FROM demo_quotas
    `

    const allItems = rows
    const filteredRows = allItems.filter((row) => {
      if (filter === 'demo' && row.is_demo !== true) return false
      if (filter === 'real' && row.is_demo === true) return false
      if (orderType === 'trial' && row.order_type !== 'trial') return false
      if (orderType === 'individual' && row.order_type !== 'individual') return false
      if (orderType === 'corporate' && row.order_type !== 'corporate') return false
      return true
    })

    const statsBase = {
      totalQrs: allItems.length,
      demoQrs: allItems.filter((row) => row.is_demo === true).length,
      realQrs: allItems.filter((row) => row.is_demo !== true).length,
      activeQrs: allItems.filter((row) => row.is_active !== false).length,
      passiveQrs: allItems.filter((row) => row.is_active === false).length,
      claimedQrs: allItems.filter((row) => row.is_claimed === true).length,
      trialQrs: allItems.filter((row) => row.order_type === 'trial').length,
      individualQrs: allItems.filter((row) => row.order_type === 'individual').length,
      corporateQrs: allItems.filter((row) => row.order_type === 'corporate').length,
      demoSessions: Number(demoQuotaRows[0]?.session_count || 0),
      demoCreatedCount: Number(demoQuotaRows[0]?.total_created || 0),
      registeredUsers: users.length,
    }

    const individualSoldSlots = users
      .filter((user) => String(user.account_type || 'individual') !== 'corporate')
      .reduce((sum, user) => sum + Number(user.paid_slots || 0), 0)
    const corporateSoldSlots = users
      .filter((user) => String(user.account_type || 'individual') === 'corporate')
      .reduce((sum, user) => sum + Number(user.paid_slots || 0), 0)

    const individualRevenue = individualSoldSlots * INDIVIDUAL_PRICE
    const corporateRevenue = Number((corporateSoldSlots * CORPORATE_UNIT_PRICE).toFixed(2))

    return NextResponse.json({
      items: filteredRows,
      stats: {
        ...statsBase,
        individualPrice: INDIVIDUAL_PRICE,
        corporateUnitPrice: CORPORATE_UNIT_PRICE,
        corporatePackagePrice: 2599,
        corporatePackageSize: 100,
        individualSoldSlots,
        corporateSoldSlots,
        individualRevenue,
        corporateRevenue,
        totalRevenue: Number((individualRevenue + corporateRevenue).toFixed(2)),
      },
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        accountType: String(user.account_type || 'individual') === 'corporate' ? 'corporate' : 'individual',
        freeSlots: Number(user.free_slots),
        paidSlots: Number(user.paid_slots),
        usedSlots: Number(user.used_slots),
        remainingSlots: Math.max(0, Number(user.free_slots) + Number(user.paid_slots) - Number(user.used_slots)),
        createdAt: user.created_at,
      })),
    })
  } catch (err) {
    console.error('[admin/qr/list]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}