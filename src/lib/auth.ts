import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, sql, UserAccount } from '@/lib/db'

export const AUTH_COOKIE_NAME = 'qrnote_auth'
const SESSION_TTL_DAYS = 30
const PASSWORD_RESET_TTL_HOURS = 24

export interface AuthUserSummary {
  id: string
  email: string
  accountType: 'individual' | 'corporate'
  freeSlots: number
  paidSlots: number
  usedSlots: number
  remainingSlots: number
  createdAt: string
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function validatePassword(password: string) {
  return password.trim().length >= 6
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(':')
  if (!salt || !originalHash) return false

  const derived = scryptSync(password, salt, 64)
  const original = Buffer.from(originalHash, 'hex')

  if (derived.length !== original.length) return false
  return timingSafeEqual(derived, original)
}

function toAuthUserSummary(user: UserAccount): AuthUserSummary {
  const remainingSlots = Math.max(0, Number(user.free_slots) + Number(user.paid_slots) - Number(user.used_slots))

  return {
    id: user.id,
    email: user.email,
    accountType: user.account_type === 'corporate' ? 'corporate' : 'individual',
    freeSlots: Number(user.free_slots),
    paidSlots: Number(user.paid_slots),
    usedSlots: Number(user.used_slots),
    remainingSlots,
    createdAt: user.created_at,
  }
}

export async function getUserByEmail(email: string) {
  await ensureQrSchema()
  const normalizedEmail = normalizeEmail(email)
  const rows = (await sql`
    SELECT id, email, password_hash, free_slots, paid_slots, used_slots, created_at, updated_at
    FROM users
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `) as unknown as UserAccount[]

  return rows[0] || null
}

export async function createUser(email: string, password: string) {
  await ensureQrSchema()
  const normalizedEmail = normalizeEmail(email)
  const passwordHash = hashPassword(password)

  try {
    const rows = (await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${normalizedEmail}, ${passwordHash})
      RETURNING id, email, password_hash, free_slots, paid_slots, used_slots, created_at, updated_at
    `) as unknown as UserAccount[]

    return rows[0]
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
      throw new Error('EMAIL_ALREADY_EXISTS')
    }
    throw error
  }
}

export async function createUserSession(userId: string) {
  await ensureQrSchema()
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await sql`
    INSERT INTO user_sessions (token_hash, user_id, expires_at)
    VALUES (${tokenHash}, ${userId}, ${expiresAt})
  `

  return token
}

export async function createPasswordResetToken(userId: string) {
  await ensureQrSchema()
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000).toISOString()

  await sql`
    INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
    VALUES (${tokenHash}, ${userId}, ${expiresAt})
  `

  return token
}

export async function resetPasswordWithToken(token: string, password: string) {
  await ensureQrSchema()
  const tokenHash = hashToken(token)
  const rows = await sql`
    SELECT user_id
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `

  if (rows.length === 0) {
    throw new Error('INVALID_RESET_TOKEN')
  }

  const passwordHash = hashPassword(password)
  const userId = String(rows[0].user_id)

  await sql`
    UPDATE users
    SET password_hash = ${passwordHash},
        updated_at = NOW()
    WHERE id = ${userId}
  `

  await sql`
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE token_hash = ${tokenHash}
  `

  return userId
}

export function applyAuthCookie(res: NextResponse, token: string) {
  const isSecureCookie = process.env.NODE_ENV === 'production'

  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie,
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })

  return res
}

export function clearAuthCookie(res: NextResponse) {
  const isSecureCookie = process.env.NODE_ENV === 'production'

  res.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie,
    path: '/',
    maxAge: 0,
  })

  return res
}

export async function deleteUserSession(token: string | undefined) {
  if (!token) return
  await ensureQrSchema()
  const tokenHash = hashToken(token)
  await sql`DELETE FROM user_sessions WHERE token_hash = ${tokenHash}`
}

export async function getAuthenticatedUser(req: NextRequest) {
  await ensureQrSchema()
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value?.trim()
  if (!token) return null

  const tokenHash = hashToken(token)
  const rows = (await sql`
    SELECT u.id, u.email, u.password_hash, u.account_type, u.free_slots, u.paid_slots, u.used_slots, u.created_at, u.updated_at
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
    LIMIT 1
  `) as unknown as UserAccount[]

  if (rows.length === 0) {
    return null
  }

  return toAuthUserSummary(rows[0])
}

export async function getUserSummaryById(userId: string) {
  await ensureQrSchema()
  const rows = (await sql`
    SELECT id, email, password_hash, account_type, free_slots, paid_slots, used_slots, created_at, updated_at
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `) as unknown as UserAccount[]

  return rows[0] ? toAuthUserSummary(rows[0]) : null
}