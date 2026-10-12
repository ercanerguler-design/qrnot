import { randomBytes, createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, EducationUser, sql } from '@/lib/db'
import { hashPassword, normalizeEmail, verifyPassword } from '@/lib/auth'

export const EDUCATION_AUTH_COOKIE_NAME = 'qrnote_education_auth'
const EDUCATION_SESSION_TTL_DAYS = 14

export interface EducationAuthUser {
  id: string
  email: string
  role: 'education_admin'
  hotelId: string | null
  hotelCode: string | null
  isActive: boolean
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function toEducationAuthUser(row: EducationUser & { hotel_code?: string | null }): EducationAuthUser {
  return {
    id: row.id,
    email: row.email,
    role: 'education_admin',
    hotelId: row.hotel_id,
    hotelCode: row.hotel_code || null,
    isActive: Boolean(row.is_active),
  }
}

export async function getEducationUserByEmail(email: string) {
  await ensureQrSchema()
  const normalizedEmail = normalizeEmail(email)

  const rows = (await sql`
    SELECT eu.id, eu.hotel_id, eu.email, eu.password_hash, eu.role, eu.is_active, eu.created_at, eu.updated_at,
           ht.code AS hotel_code
    FROM education_users eu
    LEFT JOIN hotel_tenants ht ON ht.id = eu.hotel_id
    WHERE eu.email = ${normalizedEmail}
    LIMIT 1
  `) as unknown as Array<EducationUser & { hotel_code?: string | null }>

  return rows[0] || null
}

export async function createEducationUser(input: {
  email: string
  password: string
  hotelId: string | null
}) {
  await ensureQrSchema()

  const email = normalizeEmail(input.email)
  const passwordHash = hashPassword(input.password)

  const rows = (await sql`
    INSERT INTO education_users (hotel_id, email, password_hash, role, is_active)
    VALUES (${input.hotelId}, ${email}, ${passwordHash}, 'education_admin', TRUE)
    RETURNING id, hotel_id, email, password_hash, role, is_active, created_at, updated_at
  `) as unknown as EducationUser[]

  return rows[0]
}

export async function createEducationSession(educationUserId: string) {
  await ensureQrSchema()
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + EDUCATION_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await sql`
    INSERT INTO education_sessions (token_hash, education_user_id, expires_at)
    VALUES (${tokenHash}, ${educationUserId}, ${expiresAt})
  `

  return token
}

export async function deleteEducationSession(token: string | undefined) {
  if (!token) return
  await ensureQrSchema()
  const tokenHash = hashToken(token)
  await sql`DELETE FROM education_sessions WHERE token_hash = ${tokenHash}`
}

export async function getAuthenticatedEducationUser(req: NextRequest) {
  await ensureQrSchema()
  const token = req.cookies.get(EDUCATION_AUTH_COOKIE_NAME)?.value?.trim()
  if (!token) return null

  const tokenHash = hashToken(token)
  const rows = (await sql`
    SELECT eu.id, eu.hotel_id, eu.email, eu.password_hash, eu.role, eu.is_active, eu.created_at, eu.updated_at,
           ht.code AS hotel_code
    FROM education_sessions es
    JOIN education_users eu ON eu.id = es.education_user_id
    LEFT JOIN hotel_tenants ht ON ht.id = eu.hotel_id
    WHERE es.token_hash = ${tokenHash}
      AND es.expires_at > NOW()
      AND eu.is_active = TRUE
    LIMIT 1
  `) as unknown as Array<EducationUser & { hotel_code?: string | null }>

  if (rows.length === 0) {
    return null
  }

  return toEducationAuthUser(rows[0])
}

export function applyEducationAuthCookie(res: NextResponse, token: string) {
  const isSecureCookie = process.env.NODE_ENV === 'production'

  res.cookies.set(EDUCATION_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie,
    path: '/',
    maxAge: EDUCATION_SESSION_TTL_DAYS * 24 * 60 * 60,
  })

  return res
}

export function clearEducationAuthCookie(res: NextResponse) {
  const isSecureCookie = process.env.NODE_ENV === 'production'

  res.cookies.set(EDUCATION_AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie,
    path: '/',
    maxAge: 0,
  })

  return res
}

export async function authenticateEducationCredentials(email: string, password: string) {
  const user = await getEducationUserByEmail(email)
  if (!user || !user.is_active) return null
  if (!verifyPassword(password, user.password_hash)) return null
  return toEducationAuthUser(user)
}
