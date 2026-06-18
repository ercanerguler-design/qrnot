import { createHash, randomBytes } from 'crypto'
import { hashPassword } from '@/lib/auth'
import { ensureQrSchema, sql } from '@/lib/db'

export type PanelRealm = 'hotel' | 'education' | 'health' | 'factory' | 'retail' | 'logistics'

const PANEL_RESET_TTL_HOURS = 24

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function normalizeRealm(input: unknown): PanelRealm | null {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'hotel' || value === 'education' || value === 'health' || value === 'factory' || value === 'retail' || value === 'logistics') {
    return value
  }
  return null
}

export async function createPanelPasswordResetToken(realmInput: unknown, userId: string, userEmail: string) {
  await ensureQrSchema()
  const realm = normalizeRealm(realmInput)
  if (!realm) {
    throw new Error('INVALID_REALM')
  }

  await sql`
    DELETE FROM panel_password_reset_tokens
    WHERE realm = ${realm}
      AND user_id = ${userId}
      AND used_at IS NULL
  `

  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + PANEL_RESET_TTL_HOURS * 60 * 60 * 1000).toISOString()

  await sql`
    INSERT INTO panel_password_reset_tokens (token_hash, realm, user_id, user_email, expires_at)
    VALUES (${tokenHash}, ${realm}, ${userId}, ${userEmail}, ${expiresAt})
  `

  return token
}

export async function resetPanelPasswordWithToken(token: string, password: string) {
  await ensureQrSchema()
  const tokenHash = hashToken(token)

  const rows = await sql`
    SELECT realm, user_id
    FROM panel_password_reset_tokens
    WHERE token_hash = ${tokenHash}
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `

  if (rows.length === 0) {
    throw new Error('INVALID_RESET_TOKEN')
  }

  const realm = normalizeRealm(rows[0].realm)
  const userId = String(rows[0].user_id || '')
  if (!realm || !userId) {
    throw new Error('INVALID_RESET_TOKEN')
  }

  const passwordHash = hashPassword(password)

  if (realm === 'hotel') {
    await sql`UPDATE hotel_users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${userId}`
  } else if (realm === 'education') {
    await sql`UPDATE education_users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${userId}`
  } else if (realm === 'health') {
    await sql`UPDATE health_users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${userId}`
  } else if (realm === 'factory') {
    await sql`UPDATE factory_users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${userId}`
  } else if (realm === 'retail') {
    await sql`UPDATE retail_users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${userId}`
  } else {
    await sql`UPDATE logistics_users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${userId}`
  }

  await sql`
    UPDATE panel_password_reset_tokens
    SET used_at = NOW()
    WHERE token_hash = ${tokenHash}
  `

  return { realm, userId }
}
