import { randomBytes } from 'crypto'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'
import { sendPushToUser } from '@/lib/push'
import { SITE_URL } from '@/lib/site'

// Zaman kapsülü, kayıp modu, grup hediyesi, cevaplar, bildirimler ve premium için ortak sunucu yardımcıları.

export interface FeatureQr {
  id: string
  slug: string
  is_claimed: boolean
  is_active: boolean
  is_demo: boolean
  admin_token: string | null
  title: string | null
  order_type: string | null
  qr_mode: string | null
  unlock_at: string | null
  lost_mode: boolean
  notify_scans: boolean
  replies_enabled: boolean
  group_token: string | null
  owner_user_id: string | null
  creator_user_id: string | null
  last_scan_event_at: string | null
}

export async function loadFeatureQr(slug: string): Promise<FeatureQr | null> {
  await ensureGrowthSchema()
  const rows = (await sql`
    SELECT id, slug, is_claimed, is_active, is_demo, admin_token, title, order_type, qr_mode,
           unlock_at, lost_mode, notify_scans, replies_enabled, group_token, owner_user_id, creator_user_id, last_scan_event_at
    FROM qr_codes WHERE slug = ${slug}
  `) as unknown as FeatureQr[]
  return rows[0] || null
}

export function isOwnerToken(qr: Pick<FeatureQr, 'is_claimed' | 'admin_token'>, token: string | null | undefined) {
  return Boolean(qr.is_claimed && token && qr.admin_token && token === qr.admin_token)
}

export function ownerUserId(qr: Pick<FeatureQr, 'owner_user_id' | 'creator_user_id'>) {
  return qr.owner_user_id || qr.creator_user_id || null
}

/** Zaman kapsülü: açılış tarihi gelecekteyse içerik kilitli */
export function isTimeLocked(qr: Pick<FeatureQr, 'unlock_at'>) {
  return Boolean(qr.unlock_at && new Date(qr.unlock_at).getTime() > Date.now())
}

export async function isUserPremium(userId: string | null | undefined) {
  if (!userId) return false
  const rows = (await sql`SELECT premium_until FROM users WHERE id = ${userId}`) as Array<{ premium_until: string | null }>
  const until = rows[0]?.premium_until
  return Boolean(until && new Date(until).getTime() > Date.now())
}

export async function isQrPremium(qr: Pick<FeatureQr, 'owner_user_id' | 'creator_user_id'>) {
  return isUserPremium(ownerUserId(qr))
}

export function newGroupToken() {
  return randomBytes(12).toString('hex')
}

export type QrEventKind = 'scan' | 'reply' | 'group' | 'found'

const EVENT_TEXT: Record<QrEventKind, (title: string) => { title: string; body: string }> = {
  scan: (t) => ({ title: 'QR’ın okutuldu 💛', body: `“${t}” az önce açıldı.` }),
  reply: (t) => ({ title: 'Yeni cevap ↩️', body: `“${t}” için bir cevap bırakıldı.` }),
  group: (t) => ({ title: 'Grup hediyesine yeni mesaj 👨‍👩‍👧', body: `“${t}” için onay bekleyen bir mesaj var.` }),
  found: (t) => ({ title: '📍 Eşyan bulunmuş olabilir', body: `“${t}” için biri konumunu paylaştı.` }),
}

/** Olayı kaydeder ve QR sahibinin cihazlarına anlık bildirim gönderir. */
export async function recordQrEvent(qr: FeatureQr, kind: QrEventKind, data: Record<string, unknown> = {}) {
  await sql`INSERT INTO qr_events (qr_id, kind, data) VALUES (${qr.id}, ${kind}, ${JSON.stringify(data)}::jsonb)`
  const userId = ownerUserId(qr)
  if (!userId) return
  const title = String(qr.title || '').replace(/\[(TEL|LOC):[^\]]+\]/g, '').trim() || qr.slug
  const text = EVENT_TEXT[kind](title)
  await sendPushToUser(userId, { ...text, url: `${SITE_URL}/account?tab=notifications`, tag: `${kind}-${qr.slug}` }).catch((error) =>
    console.warn('[qr event push]', error)
  )
}

/**
 * Okutma bildirimi: aynı QR için en fazla 10 dakikada bir olay oluşturur (spam ve gereksiz bildirim olmasın).
 * Atomik güncelleme ile eşzamanlı okutmalarda tek olay oluşur.
 */
export async function recordScan(qr: FeatureQr, source: 'qr' | 'nfc') {
  if (!qr.is_claimed || !qr.notify_scans) return
  const rows = (await sql`
    UPDATE qr_codes SET last_scan_event_at = NOW()
    WHERE id = ${qr.id} AND (last_scan_event_at IS NULL OR last_scan_event_at < NOW() - INTERVAL '10 minutes')
    RETURNING id
  `) as Array<{ id: string }>
  if (rows.length === 0) return
  await recordQrEvent(qr, 'scan', { source })
}
