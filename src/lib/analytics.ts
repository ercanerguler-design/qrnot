import { createHash } from 'crypto'
import { after } from 'next/server'
import { sql } from '@/lib/db'
import { clientIp } from '@/lib/growthSchema'

// QRNot'un kendi ölçümü: çerez yok, IP saklanmaz. Ziyaretçi; günlük değişen gizli tuz + IP + tarayıcı özetiyle
// sadece o gün için tanınır (ertesi gün aynı kişi yeni ziyaretçidir). Reklam kaynağı (UTM, tıklama kimliği,
// yönlendiren site) sayfa görüntülemesinde kaydedilir; dönüşümler (üyelik, sipariş, demo…) o günün ilk kaynağına bağlanır.

export type EventType = 'pageview' | 'event' | 'conversion'

/** Dönüşüm adları: yönetim panelindeki tablolar bu listeyle çalışır */
export const CONVERSIONS = {
  signup: 'Üyelik',
  qr_activate: 'QR etkinleştirme',
  guestbook_setup: 'Anı defteri kurulumu',
  etsy_activate: 'Etsy etkinleştirme',
  qr_create: 'QR oluşturma (üye)',
  checkout_start: 'Ödeme başlatıldı',
  purchase: 'Ödeme alındı',
  dpp_demo: 'DPP demo talebi',
} as const
export type ConversionName = keyof typeof CONVERSIONS

const BOT = /^node|undici|bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp|telegram|discord|skype|curl|wget|python|node-fetch|axios|vercel|monitor|uptime/i

let ready: Promise<void> | null = null
export function ensureAnalyticsSchema() {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS site_events (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          day DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Europe/Istanbul')::date,
          type VARCHAR(12) NOT NULL,
          name VARCHAR(40) NOT NULL DEFAULT '',
          path VARCHAR(300) NOT NULL DEFAULT '',
          area VARCHAR(20) NOT NULL DEFAULT '',
          visitor CHAR(16) NOT NULL,
          source VARCHAR(80) NOT NULL DEFAULT 'direct',
          medium VARCHAR(40) NOT NULL DEFAULT '',
          campaign VARCHAR(100) NOT NULL DEFAULT '',
          content VARCHAR(100) NOT NULL DEFAULT '',
          referrer VARCHAR(200) NOT NULL DEFAULT '',
          country VARCHAR(2) NOT NULL DEFAULT '',
          device VARCHAR(8) NOT NULL DEFAULT '',
          lang VARCHAR(8) NOT NULL DEFAULT '',
          value NUMERIC(12, 2),
          currency VARCHAR(3),
          props JSONB NOT NULL DEFAULT '{}'::jsonb
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_site_events_day ON site_events(day, type)`
      await sql`CREATE INDEX IF NOT EXISTS idx_site_events_visitor ON site_events(visitor, day)`
    })().catch((err) => {
      ready = null
      throw err
    })
  }
  return ready
}

/** Yolun ait olduğu ürün alanı */
export function areaOf(path: string) {
  const p = path.toLowerCase()
  if (p.startsWith('/dpp') || p.startsWith('/p/') || p.startsWith('/01/')) return 'dpp'
  if (/^\/(shop|cart|checkout|order)(\/|$)/.test(p)) return 'shop'
  if (/^\/(nfc|katalog)(\/|$)/.test(p)) return 'nfc'
  if (p.startsWith('/guestbook')) return 'guestbook'
  if (/^\/(hotel|education|retail|logistics|factory)(\/|$)/.test(p)) return 'sector'
  if (p.startsWith('/etsy')) return 'etsy'
  if (p.startsWith('/partnerlik')) return 'partner'
  if (/^\/(q|n|h|manage|create|demo|account|recover)(\/|$)/.test(p)) return 'app'
  if (p === '/' || p === '') return 'home'
  return 'other'
}

const OWN_HOSTS = /(^|\.)qrnot\.com$|^localhost$|vercel\.app$/

/** Sayfa görüntülemesinin kaynağı: UTM > reklam tıklama kimliği > yönlendiren site > doğrudan */
export function sourceOf(search: URLSearchParams, referrer: string) {
  const utm = (k: string) => (search.get(`utm_${k}`) || '').trim().toLowerCase().slice(0, k === 'source' ? 80 : 100)
  let refHost = ''
  try {
    refHost = referrer ? new URL(referrer).hostname.replace(/^www\./, '').toLowerCase() : ''
  } catch {}
  const internal = refHost !== '' && OWN_HOSTS.test(refHost)
  // Kampanya adı utm_source olmadan da gelebilir (ör. sadece utm_campaign eklenmiş bağlantı)
  const base = { campaign: utm('campaign'), content: utm('content'), refHost, internal }
  if (utm('source')) return { ...base, source: utm('source'), medium: utm('medium').slice(0, 40) }
  if (search.get('gclid') || search.get('gbraid') || search.get('wbraid')) return { ...base, source: 'google', medium: 'cpc' }
  if (search.get('li_fat_id')) return { ...base, source: 'linkedin', medium: 'cpc' }
  if (search.get('fbclid')) return { ...base, source: refHost.includes('instagram') ? 'instagram' : 'facebook', medium: 'social' }
  if (search.get('msclkid')) return { ...base, source: 'bing', medium: 'cpc' }
  if (refHost && !internal) {
    const medium = /google|bing|yandex|duckduckgo|yahoo|ecosia/.test(refHost)
      ? 'organic'
      : /linkedin|lnkd|facebook|instagram|^t\.co$|twitter|x\.com|tiktok|youtube|pinterest|reddit/.test(refHost)
        ? 'social'
        : 'referral'
    return { ...base, source: siteName(refHost), medium }
  }
  return { ...base, source: 'direct', medium: '' }
}

const GENERIC_LABELS = new Set(['com', 'net', 'org', 'co', 'gov', 'edu', 'ac', 'bel', 'k12', 'tr', 'uk', 'de', 'fr', 'nl', 'es', 'it', 'io', 'ai', 'app', 'me', 'eu', 'us'])
/** Yönlendiren adresten site adı: l.instagram.com → instagram, google.com.tr → google, t.co → twitter */
function siteName(host: string) {
  if (host === 't.co') return 'twitter'
  if (host === 'lnkd.in') return 'linkedin'
  const labels = host.split('.')
  while (labels.length > 1 && GENERIC_LABELS.has(labels[labels.length - 1])) labels.pop()
  return (labels[labels.length - 1] || host).slice(0, 80)
}

function salt() {
  return createHash('sha256')
    .update(process.env.ANALYTICS_SALT || process.env.DATABASE_URL || 'qrnot')
    .digest('hex')
}
function istanbulDay() {
  return new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10)
}
export function visitorOf(headers: Headers) {
  const ua = headers.get('user-agent') || ''
  return createHash('sha256').update(`${salt()}|${istanbulDay()}|${clientIp(headers)}|${ua}`).digest('hex').slice(0, 16)
}
export const isBot = (headers: Headers) => {
  const ua = headers.get('user-agent') || ''
  return !ua || BOT.test(ua)
}
export function deviceOf(headers: Headers) {
  const ua = headers.get('user-agent') || ''
  if (/ipad|tablet/i.test(ua)) return 'tablet'
  return /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
}
const countryOf = (headers: Headers) => (headers.get('x-vercel-ip-country') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)

/** Sunucu tarafı dönüşüm: istek yapan ziyaretçinin o günkü ilk kaynağıyla kaydedilir. Yanıtı bekletmez, hata fırlatmaz. */
export function trackConversion(
  req: { headers: Headers },
  name: ConversionName,
  opts: { path?: string; value?: number | null; currency?: string | null; props?: Record<string, unknown> } = {}
) {
  const headers = new Headers(req.headers)
  const run = async () => {
    try {
      if (isBot(headers)) return
      await ensureAnalyticsSchema()
      const visitor = visitorOf(headers)
      await insertConversion(visitor, name, { ...opts, country: countryOf(headers), device: deviceOf(headers) })
    } catch (err) {
      console.error('[analytics]', err)
    }
  }
  try {
    after(run)
  } catch {
    void run()
  }
}

async function insertConversion(
  visitor: string,
  name: ConversionName,
  opts: { path?: string; value?: number | null; currency?: string | null; props?: Record<string, unknown>; country?: string; device?: string }
) {
  // O günün ilk dış kaynaklı görüntülemesi (yoksa ilk görüntüleme): reklama bağlama
  const first = (await sql`
    SELECT source, medium, campaign, content, area, path FROM site_events
    WHERE visitor = ${visitor} AND type = 'pageview' AND created_at > NOW() - INTERVAL '30 hours'
    ORDER BY (source IN ('direct', 'internal')) ASC, created_at ASC LIMIT 1
  `) as Array<{ source: string; medium: string; campaign: string; content: string; area: string; path: string }>
  const f = first[0]
  const path = opts.path || f?.path || ''
  await sql`
    INSERT INTO site_events (type, name, path, area, visitor, source, medium, campaign, content, country, device, value, currency, props)
    VALUES ('conversion', ${name}, ${path}, ${areaOf(path)}, ${visitor}, ${f && f.source !== 'internal' ? f.source : 'direct'}, ${f?.medium || ''}, ${f?.campaign || ''}, ${f?.content || ''},
            ${opts.country || ''}, ${opts.device || ''}, ${opts.value ?? null}, ${opts.currency ?? null}, ${JSON.stringify({ ...(opts.props || {}), landing: f?.path || null })}::jsonb)
  `
}

/** Ödeme sağlayıcısından gelen onay (tarayıcı değil): ödemeyi başlatan ziyaretçinin kaynağına bağlanır */
export async function trackPurchase(orderNo: string, value: number, currency: string) {
  try {
    await ensureAnalyticsSchema()
    const start = (await sql`
      SELECT visitor, source, medium, campaign, content, country, device FROM site_events
      WHERE type = 'conversion' AND name = 'checkout_start' AND props->>'orderNo' = ${orderNo}
      ORDER BY created_at DESC LIMIT 1
    `) as Array<{ visitor: string; source: string; medium: string; campaign: string; content: string; country: string; device: string }>
    const s = start[0]
    await sql`
      INSERT INTO site_events (type, name, path, area, visitor, source, medium, campaign, content, country, device, value, currency, props)
      VALUES ('conversion', 'purchase', '/checkout', 'shop', ${s?.visitor || 'server0000000000'}, ${s?.source || 'unknown'}, ${s?.medium || ''}, ${s?.campaign || ''}, ${s?.content || ''},
              ${s?.country || ''}, ${s?.device || ''}, ${value}, ${currency.slice(0, 3)}, ${JSON.stringify({ orderNo })}::jsonb)
    `
  } catch (err) {
    console.error('[analytics purchase]', err)
  }
}

/** Ziyaretçinin o günkü kaynağı (bildirim mesajları için) */
export async function sourceSummary(headers: Headers) {
  try {
    await ensureAnalyticsSchema()
    const rows = (await sql`
      SELECT source, medium, campaign, path FROM site_events
      WHERE visitor = ${visitorOf(headers)} AND type = 'pageview' AND created_at > NOW() - INTERVAL '30 hours'
      ORDER BY (source IN ('direct', 'internal')) ASC, created_at ASC LIMIT 1
    `) as Array<{ source: string; medium: string; campaign: string; path: string }>
    const r = rows[0]
    if (!r) return 'bilinmiyor'
    return [r.source === 'internal' ? 'direct' : r.source, r.medium, r.campaign].filter(Boolean).join(' / ') + ` (ilk sayfa ${r.path})`
  } catch {
    return 'bilinmiyor'
  }
}

/** 400 günden eski olayları siler (günlük bakımda çağrılır) */
export async function pruneAnalytics() {
  await ensureAnalyticsSchema()
  await sql`DELETE FROM site_events WHERE created_at < NOW() - INTERVAL '400 days'`
}
