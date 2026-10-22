import webpush from 'web-push'
import { sql } from '@/lib/db'

// Tarayıcı / telefon anlık bildirimleri (Web Push). Anahtarlar yoksa sessizce devre dışı kalır.
// Ortam değişkenleri: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)

let configured: boolean | null = null

function ensureConfigured() {
  if (configured !== null) return configured
  const publicKey = String(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || '').trim()
  if (!publicKey || !privateKey) {
    configured = false
    return false
  }
  webpush.setVapidDetails(String(process.env.VAPID_SUBJECT || 'mailto:sce@scegrup.com'), publicKey, privateKey)
  configured = true
  return true
}

export function pushEnabled() {
  return ensureConfigured()
}

export interface PushPayload {
  title: string
  body: string
  url: string
  tag?: string
}

/** Kullanıcının kayıtlı tüm cihazlarına bildirim gönderir; geçersiz abonelikleri temizler. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return 0
  const subs = (await sql`SELECT endpoint, keys FROM push_subscriptions WHERE user_id = ${userId}`) as Array<{
    endpoint: string
    keys: { p256dh: string; auth: string }
  }>
  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload), { TTL: 60 * 60 * 24 })
      sent += 1
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`
      } else {
        console.warn('[push]', status, (error as Error).message)
      }
    }
  }
  return sent
}
