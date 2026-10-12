import { createHash, randomUUID } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'
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

/** Misafir cihazını tanıyan kalıcı çerez: aynı kişi aynı anı defterine bir kez yazabilir. */
export const GB_DEVICE_COOKIE = 'qrnot_gb_dev'

export function readGuestDevice(req: NextRequest) {
  const value = req.cookies.get(GB_DEVICE_COOKIE)?.value || ''
  return /^[0-9a-f-]{36}$/.test(value) ? value : null
}

export function newGuestDevice() {
  return randomUUID()
}

export function hashGuestDevice(deviceId: string) {
  return createHash('sha256').update(`qrnote-gb-dev:${deviceId}`).digest('hex').slice(0, 32)
}

export function setGuestDeviceCookie(res: NextResponse, deviceId: string) {
  res.cookies.set(GB_DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 2,
  })
}

/** Bu cihazdan ya da bu isimle (büyük/küçük harf duyarsız) reddedilmemiş bir anı var mı? */
export async function findDuplicateEntry(qrId: string, deviceHash: string | null, authorName: string | null) {
  const rows = (await sql`
    SELECT
      COALESCE(BOOL_OR(${deviceHash}::text IS NOT NULL AND device_hash = ${deviceHash}), FALSE) AS by_device,
      COALESCE(BOOL_OR(${authorName}::text IS NOT NULL AND LOWER(TRIM(author_name)) = LOWER(TRIM(${authorName}))), FALSE) AS by_name
    FROM guestbook_entries
    WHERE qr_id = ${qrId} AND status <> 'rejected'
  `) as Array<{ by_device: boolean; by_name: boolean }>
  return { byDevice: Boolean(rows[0]?.by_device), byName: Boolean(rows[0]?.by_name) }
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
