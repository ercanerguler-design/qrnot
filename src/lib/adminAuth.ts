import { createHash, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { clientIp, consumeRateLimit, ensureGrowthSchema } from '@/lib/growthSchema'

// Kaba kuvvet koruması: sadece BAŞARISIZ denemeler sayılır; sınır aşılınca pencere bitene kadar doğru şifre de reddedilir.
const ADMIN_FAIL_LIMIT = 10
const LOGIN_FAIL_LIMIT = 10
const WINDOW_SECONDS = 3600

async function isLockedOut(bucket: string, limit: number, windowSeconds: number) {
  await ensureGrowthSchema()
  const rows = (await sql`
    SELECT hits FROM rate_limits
    WHERE bucket = ${bucket} AND window_start >= NOW() - make_interval(secs => ${windowSeconds})
  `) as Array<{ hits: number }>
  return Number(rows[0]?.hits || 0) >= limit
}

function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/** ADMIN_PASSWORD kontrolü (zamanlamaya dayanıklı + IP başına başarısız deneme kilidi). Boş şifre deneme sayılmaz. */
export async function checkAdminPassword(req: NextRequest, provided: unknown) {
  const configured = String(process.env.ADMIN_PASSWORD || '').trim()
  const given = String(provided || '').trim()
  if (!configured || !given) return false

  const bucket = `admin-fail:${clientIp(req.headers)}`
  if (await isLockedOut(bucket, ADMIN_FAIL_LIMIT, WINDOW_SECONDS)) return false

  const ok = safeEqual(given, configured)
  if (!ok) await consumeRateLimit(bucket, ADMIN_FAIL_LIMIT, WINDOW_SECONDS)
  return ok
}

/** Kullanıcı girişleri için: IP ve e-posta başına başarısız deneme kilidi. */
export async function isLoginLocked(req: NextRequest, scope: string, email: string) {
  const ip = clientIp(req.headers)
  return (
    (await isLockedOut(`login-fail:${scope}:ip:${ip}`, LOGIN_FAIL_LIMIT * 3, WINDOW_SECONDS)) ||
    (await isLockedOut(`login-fail:${scope}:email:${email.toLowerCase()}`, LOGIN_FAIL_LIMIT, WINDOW_SECONDS))
  )
}

export async function recordLoginFailure(req: NextRequest, scope: string, email: string) {
  const ip = clientIp(req.headers)
  await consumeRateLimit(`login-fail:${scope}:ip:${ip}`, LOGIN_FAIL_LIMIT * 3, WINDOW_SECONDS)
  await consumeRateLimit(`login-fail:${scope}:email:${email.toLowerCase()}`, LOGIN_FAIL_LIMIT, WINDOW_SECONDS)
}
