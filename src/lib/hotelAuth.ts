import { randomBytes, createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, HotelUser, sql } from '@/lib/db'
import { hashPassword, normalizeEmail, verifyPassword } from '@/lib/auth'

export const HOTEL_AUTH_COOKIE_NAME = 'qrnote_hotel_auth'
const HOTEL_SESSION_TTL_DAYS = 14

export interface HotelAuthUser {
  id: string
  email: string
  role: 'platform_admin' | 'hotel_admin' | 'staff'
  hotelId: string | null
  hotelCode: string | null
  isActive: boolean
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function toHotelAuthUser(row: HotelUser & { hotel_code?: string | null }): HotelAuthUser {
  return {
    id: row.id,
    email: row.email,
    role: (row.role || 'staff') as HotelAuthUser['role'],
    hotelId: row.hotel_id,
    hotelCode: row.hotel_code || null,
    isActive: Boolean(row.is_active),
  }
}

export async function getHotelUserByEmail(email: string) {
  await ensureQrSchema()
  const normalizedEmail = normalizeEmail(email)

  const rows = (await sql`
    SELECT hu.id, hu.hotel_id, hu.email, hu.password_hash, hu.role, hu.is_active, hu.created_at, hu.updated_at,
           ht.code AS hotel_code
    FROM hotel_users hu
    LEFT JOIN hotel_tenants ht ON ht.id = hu.hotel_id
    WHERE hu.email = ${normalizedEmail}
      AND hu.role <> 'education_admin'
    LIMIT 1
  `) as unknown as Array<HotelUser & { hotel_code?: string | null }>

  return rows[0] || null
}

export async function createHotelUser(input: {
  email: string
  password: string
  role: 'platform_admin' | 'hotel_admin' | 'staff'
  hotelId: string | null
}) {
  await ensureQrSchema()

  const email = normalizeEmail(input.email)
  const passwordHash = hashPassword(input.password)

  const rows = (await sql`
    INSERT INTO hotel_users (hotel_id, email, password_hash, role, is_active)
    VALUES (${input.hotelId}, ${email}, ${passwordHash}, ${input.role}, TRUE)
    RETURNING id, hotel_id, email, password_hash, role, is_active, created_at, updated_at
  `) as unknown as HotelUser[]

  return rows[0]
}

export async function createHotelSession(hotelUserId: string) {
  await ensureQrSchema()
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + HOTEL_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await sql`
    INSERT INTO hotel_sessions (token_hash, hotel_user_id, expires_at)
    VALUES (${tokenHash}, ${hotelUserId}, ${expiresAt})
  `

  return token
}

export async function deleteHotelSession(token: string | undefined) {
  if (!token) return
  await ensureQrSchema()
  const tokenHash = hashToken(token)
  await sql`DELETE FROM hotel_sessions WHERE token_hash = ${tokenHash}`
}

export async function getAuthenticatedHotelUser(req: NextRequest) {
  await ensureQrSchema()
  const token = req.cookies.get(HOTEL_AUTH_COOKIE_NAME)?.value?.trim()
  if (!token) return null

  const tokenHash = hashToken(token)
  const rows = (await sql`
    SELECT hu.id, hu.hotel_id, hu.email, hu.password_hash, hu.role, hu.is_active, hu.created_at, hu.updated_at,
           ht.code AS hotel_code
    FROM hotel_sessions hs
    JOIN hotel_users hu ON hu.id = hs.hotel_user_id
    LEFT JOIN hotel_tenants ht ON ht.id = hu.hotel_id
    WHERE hs.token_hash = ${tokenHash}
      AND hs.expires_at > NOW()
      AND hu.is_active = TRUE
      AND hu.role <> 'education_admin'
    LIMIT 1
  `) as unknown as Array<HotelUser & { hotel_code?: string | null }>

  if (rows.length === 0) {
    return null
  }

  return toHotelAuthUser(rows[0])
}

export function applyHotelAuthCookie(res: NextResponse, token: string) {
  const isSecureCookie = process.env.NODE_ENV === 'production'

  res.cookies.set(HOTEL_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie,
    path: '/',
    maxAge: HOTEL_SESSION_TTL_DAYS * 24 * 60 * 60,
  })

  return res
}

export function clearHotelAuthCookie(res: NextResponse) {
  const isSecureCookie = process.env.NODE_ENV === 'production'

  res.cookies.set(HOTEL_AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie,
    path: '/',
    maxAge: 0,
  })

  return res
}

export async function authenticateHotelCredentials(email: string, password: string) {
  const user = await getHotelUserByEmail(email)
  if (!user || !user.is_active) return null
  if (!verifyPassword(password, user.password_hash)) return null
  return toHotelAuthUser(user)
}