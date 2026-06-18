import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { ensureQrSchema, sql } from '@/lib/db'
import { createBlankQRCodes } from '@/lib/qr'

export const dynamic = 'force-dynamic'

const FREE_TRIAL_LIMIT = 1

function withNoStore(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
  res.headers.set('Surrogate-Control', 'no-store')
  res.headers.set('Vary', 'Cookie')

  return res
}

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const user = await getAuthenticatedUser(req)
    if (!user) {
      return withNoStore(NextResponse.json({ error: 'Devam etmek için giriş yap', authRequired: true }, { status: 401 }))
    }

    const effectiveFreeSlots = Math.min(user.freeSlots, FREE_TRIAL_LIMIT)
    const policyRemaining = Math.max(0, effectiveFreeSlots + user.paidSlots - user.usedSlots)

    if (policyRemaining <= 0) {
      return withNoStore(NextResponse.json({ error: 'Bu hesap için ücretsiz hak bitti. Satın alma sonrası yeni hak eklenebilir.', remaining: 0 }, { status: 429 }))
    }

    const body = await req.json().catch(() => ({}))
    const requestedCount = Math.max(1, Number(body.count) || 1)
    const createCount = Math.min(requestedCount, policyRemaining)
    const freeRemainingBefore = Math.max(0, effectiveFreeSlots - user.usedSlots)
    const trialCreateCount = Math.min(createCount, freeRemainingBefore)
    const paidCreateCount = Math.max(0, createCount - trialCreateCount)
    const paidOrderType = user.accountType === 'corporate' ? 'corporate' : 'individual'
    const baseUrl = req.nextUrl.origin || String(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()

    const created: { slug: string; qrUrl: string }[] = []

    if (trialCreateCount > 0) {
      const trialQrs = await createBlankQRCodes(trialCreateCount, baseUrl, {
        isDemo: false,
        orderType: 'trial',
        creatorUserId: user.id,
      })
      created.push(...trialQrs)
    }

    if (paidCreateCount > 0) {
      const paidQrs = await createBlankQRCodes(paidCreateCount, baseUrl, {
        isDemo: false,
        orderType: paidOrderType,
        creatorUserId: user.id,
      })
      created.push(...paidQrs)
    }

    const userRows = await sql`
      UPDATE users
      SET used_slots = used_slots + ${createCount},
        updated_at = NOW()
      WHERE id = ${user.id}
      RETURNING free_slots, paid_slots, used_slots
    `

    const nextState = userRows[0]
    const nextEffectiveFreeSlots = Math.min(Number(nextState.free_slots), FREE_TRIAL_LIMIT)
    const remaining = Math.max(0, nextEffectiveFreeSlots + Number(nextState.paid_slots) - Number(nextState.used_slots))
    const freeRemaining = Math.max(0, nextEffectiveFreeSlots - Number(nextState.used_slots))
    const paidRemaining = Math.max(0, Number(nextState.paid_slots) - Math.max(0, Number(nextState.used_slots) - nextEffectiveFreeSlots))

    return withNoStore(NextResponse.json({
      created,
      user: {
        ...user,
        usedSlots: Number(nextState.used_slots),
        remainingSlots: remaining,
      },
      freeRemaining,
      paidRemaining,
      remaining,
      used: Number(nextState.used_slots),
    }))
  } catch (err) {
    console.error('[account/qr POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
