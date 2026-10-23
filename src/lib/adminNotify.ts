import webpush from 'web-push'
import { sql } from '@/lib/db'
import { notifyHotelOpsOnWhatsApp } from '@/lib/hotelNotify'
import { pushEnabled } from '@/lib/push'

// QRNot yöneticisine anlık haber: yeni DPP demo talebi, yeni ödeme…
// 1) Yönetim panelinden "bildirimleri aç" denmiş tüm cihazlara web push (telefon / bilgisayar)
// 2) WhatsApp Cloud API ayarlıysa ayrıca WhatsApp mesajı
// Hiçbiri hata fırlatmaz; sonuç döner.

let ready: Promise<void> | null = null
export function ensureAdminPushSchema() {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
          endpoint TEXT PRIMARY KEY,
          keys JSONB NOT NULL,
          label VARCHAR(80) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          last_sent_at TIMESTAMP WITH TIME ZONE
        )
      `
    })().catch((err) => {
      ready = null
      throw err
    })
  }
  return ready
}

export async function saveAdminSubscription(input: unknown, label: string) {
  await ensureAdminPushSchema()
  const body = (input || {}) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  const endpoint = String(body.endpoint || '')
  const p256dh = String(body.keys?.p256dh || '')
  const auth = String(body.keys?.auth || '')
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) throw new Error('Geçersiz abonelik')
  await sql`
    INSERT INTO admin_push_subscriptions (endpoint, keys, label) VALUES (${endpoint}, ${JSON.stringify({ p256dh, auth })}::jsonb, ${label.slice(0, 80)})
    ON CONFLICT (endpoint) DO UPDATE SET keys = EXCLUDED.keys, label = EXCLUDED.label
  `
}

export async function removeAdminSubscription(endpoint: string) {
  await ensureAdminPushSchema()
  await sql`DELETE FROM admin_push_subscriptions WHERE endpoint = ${endpoint}`
}

export async function adminDevices() {
  await ensureAdminPushSchema()
  return (await sql`SELECT label, created_at, last_sent_at FROM admin_push_subscriptions ORDER BY created_at`) as Array<{ label: string; created_at: string; last_sent_at: string | null }>
}

/** Tüm yönetici cihazlarına anlık bildirim; geçersizleşen abonelikleri temizler. Gönderilen cihaz sayısını döner. */
async function pushToAdmins(payload: { title: string; body: string; url: string; tag?: string }) {
  if (!pushEnabled()) return 0
  await ensureAdminPushSchema()
  const subs = (await sql`SELECT endpoint, keys FROM admin_push_subscriptions`) as Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>
  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload), { TTL: 60 * 60 * 24, urgency: 'high' })
      await sql`UPDATE admin_push_subscriptions SET last_sent_at = NOW() WHERE endpoint = ${sub.endpoint}`
      sent += 1
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) await sql`DELETE FROM admin_push_subscriptions WHERE endpoint = ${sub.endpoint}`
      else console.warn('[admin push]', status, (error as Error).message)
    }
  }
  return sent
}

export async function notifyAdmin(input: { title: string; body: string; url: string; whatsappText?: string; whatsappTo?: string }) {
  const result = { push: 0, whatsapp: 'skipped' as string }
  try {
    result.push = await pushToAdmins({ title: input.title, body: input.body.slice(0, 400), url: input.url, tag: `admin-${Date.now()}` })
  } catch (err) {
    console.error('[admin notify push]', err)
  }
  try {
    const wa = await notifyHotelOpsOnWhatsApp(input.whatsappText || `${input.title}\n${input.body}\n${input.url}`, input.whatsappTo || undefined)
    result.whatsapp = wa.status
    if (wa.status === 'failed') console.error('[admin notify whatsapp]', wa.detail)
  } catch (err) {
    console.error('[admin notify whatsapp]', err)
  }
  return result
}
