import { createHash } from 'crypto'
import { deactivateExpiredDemoQr, sql, type QRCode } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'
import { readGuestbookSettings, type GuestbookSettings } from '@/lib/guestbook'

export type GuestbookQr = Pick<QRCode, 'id' | 'slug' | 'is_demo' | 'is_active' | 'is_claimed' | 'admin_token' | 'title' | 'order_type' | 'demo_expires_at'> & {
  qr_mode: string
  settings: GuestbookSettings
}

export async function loadGuestbookQr(slug: string): Promise<GuestbookQr | null> {
  await ensureGrowthSchema()
  const rows = (await sql`
    SELECT id, slug, is_demo, is_active, is_claimed, admin_token, title, order_type, demo_expires_at, qr_mode, guestbook_settings
    FROM qr_codes WHERE slug = ${slug}
  `) as unknown as Array<GuestbookQr & { guestbook_settings: unknown }>
  if (rows.length === 0) return null
  const row = await deactivateExpiredDemoQr(rows[0])
  return { ...row, qr_mode: row.qr_mode || 'standard', settings: readGuestbookSettings(row.guestbook_settings) }
}

export function isGuestbookOwner(qr: GuestbookQr, token: string | null | undefined) {
  return Boolean(qr.is_claimed && token && qr.admin_token && token === qr.admin_token)
}

export function hashPin(pin: string) {
  return createHash('sha256').update(pin.trim()).digest('hex')
}

export function hashIp(ip: string) {
  return createHash('sha256').update(`qrnote-gb:${ip}`).digest('hex').slice(0, 32)
}

export async function saveGuestbookSettings(qrId: string, settings: GuestbookSettings) {
  await sql`
    UPDATE qr_codes
    SET guestbook_settings = ${JSON.stringify(settings)}::jsonb,
        updated_at = NOW()
    WHERE id = ${qrId}
  `
}
