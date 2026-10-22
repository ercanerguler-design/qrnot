import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, normalizeEmail, verifyPassword } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ensureDppSchema } from './schema'
import type { DppRole } from './types'
import { findAdminRealmByEmail, realmLoginPath } from '@/lib/adminRealm'
import { DppError } from './i18n'

// DPP paneli oturumları: hediye hesaplarından ve sektör panellerinden bağımsız, kendi çerezi ve tablosu.

export const DPP_COOKIE = 'qrnot_dpp_auth'
const SESSION_DAYS = 14

export interface DppSessionUser {
  id: string
  email: string
  name: string
  role: DppRole
  mustChangePassword: boolean
  companyId: string
  companyName: string
  companyCode: string
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

/** Okunması kolay, karışmayan karakterlerle geçici şifre. */
export function generateTempPassword() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(12)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

export function randomKey(bytes = 24) {
  return randomBytes(bytes).toString('hex')
}

export async function findDppUserForLogin(email: string, password: string) {
  await ensureDppSchema()
  const rows = (await sql`
    SELECT u.id, u.password_hash, u.is_active, c.is_active AS company_active
    FROM dpp_users u JOIN dpp_companies c ON c.id = u.company_id
    WHERE lower(trim(u.email)) = ${normalizeEmail(email)}
  `) as Array<{ id: string; password_hash: string; is_active: boolean; company_active: boolean }>
  const row = rows[0]
  if (!row || !row.is_active || !row.company_active) return null
  if (!verifyPassword(password, row.password_hash)) return null
  return row.id
}

export async function createDppSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString()
  await sql`INSERT INTO dpp_sessions (token_hash, user_id, expires_at) VALUES (${hashToken(token)}, ${userId}, ${expiresAt})`
  await sql`UPDATE dpp_users SET last_login_at = NOW() WHERE id = ${userId}`
  await sql`DELETE FROM dpp_sessions WHERE expires_at < NOW()`
  return token
}

export function setDppCookie(res: NextResponse, token: string) {
  res.cookies.set(DPP_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: token ? SESSION_DAYS * 86400 : 0,
  })
  return res
}

export async function deleteDppSession(req: NextRequest) {
  const token = req.cookies.get(DPP_COOKIE)?.value
  if (token) await sql`DELETE FROM dpp_sessions WHERE token_hash = ${hashToken(token)}`
}

export async function getDppUser(req: NextRequest): Promise<DppSessionUser | null> {
  const token = req.cookies.get(DPP_COOKIE)?.value?.trim()
  if (!token) return null
  await ensureDppSchema()
  const rows = (await sql`
    SELECT u.id, u.email, u.name, u.role, u.must_change_password, c.id AS company_id, c.name AS company_name, c.code AS company_code
    FROM dpp_sessions s
    JOIN dpp_users u ON u.id = s.user_id
    JOIN dpp_companies c ON c.id = u.company_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > NOW() AND u.is_active = TRUE AND c.is_active = TRUE
  `) as Array<Record<string, string | boolean>>
  const r = rows[0]
  if (!r) return null
  return {
    id: String(r.id),
    email: String(r.email),
    name: String(r.name || ''),
    role: (['owner', 'editor', 'viewer'].includes(String(r.role)) ? r.role : 'viewer') as DppRole,
    mustChangePassword: Boolean(r.must_change_password),
    companyId: String(r.company_id),
    companyName: String(r.company_name),
    companyCode: String(r.company_code),
  }
}

/** Yeni kullanıcı (firma yöneticisi ya da ekip üyesi). Geçici şifre döner; ilk girişte değiştirmesi istenir. */
export async function createDppUser(companyId: string, email: string, role: DppRole, name = '') {
  const normalized = normalizeEmail(email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new DppError('e_valid_email')
  const exists = (await sql`SELECT 1 FROM dpp_users WHERE lower(trim(email)) = ${normalized}`) as unknown[]
  if (exists.length) throw new DppError('e_email_exists')
  // Bir e-posta sadece bir kurumsal panele ait olabilir (otel, eğitim, sektör panelleri, DPP)
  const otherRealm = await findAdminRealmByEmail(normalized)
  if (otherRealm && otherRealm !== 'dpp') throw new DppError('e_email_other_panel', { path: realmLoginPath(otherRealm) })
  const password = generateTempPassword()
  const rows = (await sql`
    INSERT INTO dpp_users (company_id, email, name, password_hash, role, must_change_password)
    VALUES (${companyId}, ${normalized}, ${name.trim().slice(0, 120)}, ${hashPassword(password)}, ${role}, TRUE)
    RETURNING id
  `) as Array<{ id: string }>
  return { id: rows[0].id, email: normalized, password }
}

export async function resetDppUserPassword(userId: string) {
  const password = generateTempPassword()
  await sql`UPDATE dpp_users SET password_hash = ${hashPassword(password)}, must_change_password = TRUE WHERE id = ${userId}`
  await sql`DELETE FROM dpp_sessions WHERE user_id = ${userId}`
  return password
}

export async function changeDppPassword(userId: string, current: string, next: string) {
  if (next.length < 8) throw new DppError('e_pw_min8')
  const rows = (await sql`SELECT password_hash FROM dpp_users WHERE id = ${userId}`) as Array<{ password_hash: string }>
  if (!rows[0] || !verifyPassword(current, rows[0].password_hash)) throw new DppError('e_current_pw')
  await sql`UPDATE dpp_users SET password_hash = ${hashPassword(next)}, must_change_password = FALSE WHERE id = ${userId}`
}
