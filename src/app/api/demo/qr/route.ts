import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, sql } from '@/lib/db'
import { createBlankQRCodes } from '@/lib/qr'

const DEMO_COOKIE_NAME = 'qrnote_demo_session'
const DEMO_MAX_QR = 3

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return 'unknown'
}

function getSessionId(req: NextRequest) {
  const cookieValue = req.cookies.get(DEMO_COOKIE_NAME)?.value?.trim()
  return cookieValue || randomUUID()
}

async function getQuotaState(sessionId: string, ipAddress: string) {
  const sessionRows = await sql`
    SELECT qr_created_count FROM demo_quotas WHERE session_id = ${sessionId}
  `
  const ipRows = await sql`
    SELECT COALESCE(SUM(qr_created_count), 0) AS total
    FROM demo_quotas WHERE ip_address = ${ipAddress}
  `

  const sessionUsed = Number(sessionRows[0]?.qr_created_count || 0)
  const ipUsed = Number(ipRows[0]?.total || 0)
  const remaining = Math.max(0, Math.min(DEMO_MAX_QR - sessionUsed, DEMO_MAX_QR - ipUsed))

  return { sessionUsed, ipUsed, remaining }
}

function withDemoCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(DEMO_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return res
}

export async function GET(req: NextRequest) {
  try {
    await ensureQrSchema()

    const sessionId = getSessionId(req)
    const ipAddress = getClientIp(req)
    const quota = await getQuotaState(sessionId, ipAddress)

    return withDemoCookie(
      NextResponse.json({
        maxQr: DEMO_MAX_QR,
        sessionUsed: quota.sessionUsed,
        ipUsed: quota.ipUsed,
        remaining: quota.remaining,
      }),
      sessionId
    )
  } catch (err) {
    console.error('[demo/qr GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const sessionId = getSessionId(req)
    const ipAddress = getClientIp(req)
    const quota = await getQuotaState(sessionId, ipAddress)

    if (quota.remaining <= 0) {
      return withDemoCookie(
        NextResponse.json({ error: '3 ücretsiz demo QR hakkını kullandın', remaining: 0 }, { status: 429 }),
        sessionId
      )
    }

    const body = await req.json().catch(() => ({}))
    const requestedCount = Math.min(Math.max(1, Number(body.count) || quota.remaining), DEMO_MAX_QR)
    const createCount = Math.min(requestedCount, quota.remaining)
    const baseUrl = req.nextUrl.origin || String(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()
    const created = await createBlankQRCodes(createCount, baseUrl)

    await sql`
      INSERT INTO demo_quotas (session_id, ip_address, qr_created_count)
      VALUES (${sessionId}, ${ipAddress}, ${createCount})
      ON CONFLICT (session_id)
      DO UPDATE SET
        ip_address = EXCLUDED.ip_address,
        qr_created_count = demo_quotas.qr_created_count + EXCLUDED.qr_created_count,
        updated_at = NOW()
    `

    const nextQuota = await getQuotaState(sessionId, ipAddress)

    return withDemoCookie(
      NextResponse.json({
        created,
        remaining: nextQuota.remaining,
        used: nextQuota.sessionUsed,
      }),
      sessionId
    )
  } catch (err) {
    console.error('[demo/qr POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}