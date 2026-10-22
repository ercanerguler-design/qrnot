import { Metadata } from 'next'
import { after } from 'next/server'
import { notFound } from 'next/navigation'
import { deactivateExpiredDemoQr, sql } from '@/lib/db'
import type { QRCode, QRMedia } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'
import { publicGuestbookSettings, readGuestbookSettings } from '@/lib/guestbook'
import { getRequestLang } from '@/lib/i18n.server'
import { listQrEntries } from '@/lib/qrEntries'
import { isTimeLocked, loadFeatureQr, recordScan } from '@/lib/qrFeatures'
import QRClient from './QRClient'
import type { PlayExtrasData } from './PlayExtras'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string; src?: string }>
}

type QrRow = QRCode & { qr_mode?: string | null; guestbook_settings?: unknown }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  await ensureGrowthSchema()
  const { slug } = await params
  const lang = await getRequestLang((await searchParams).lang)
  const en = lang === 'en'
  const rows = (await sql`
    SELECT slug, title, is_demo, is_active, is_claimed, demo_expires_at, qr_mode, guestbook_settings FROM qr_codes WHERE slug = ${slug}
  `) as unknown as QrRow[]
  const base: Metadata = { robots: { index: false, follow: false } }
  if (rows.length === 0) return { ...base, title: 'QRNot' }
  const row = (await deactivateExpiredDemoQr(rows[0])) as QrRow
  if (row.is_demo && row.is_active === false) {
    return { ...base, title: en ? 'Demo expired' : 'Demo süresi doldu' }
  }
  if (row.qr_mode === 'guestbook') {
    const settings = readGuestbookSettings(row.guestbook_settings)
    return {
      ...base,
      title: settings.eventName || (en ? 'Guestbook' : 'Anı Defteri'),
      description: en ? 'Leave a voice message, video or note.' : 'Sesli mesaj, video ya da not bırak.',
    }
  }
  if (!row.is_claimed) {
    return { ...base, title: en ? 'Set up your QR' : 'QR kodunu hazırla' }
  }
  const cleanTitle = String(row.title || '').replace(/\[(TEL|LOC):[^\]]+\]/g, '').trim()
  return {
    ...base,
    title: cleanTitle || (en ? 'A voice message for you' : 'Sana bir sesli mesaj var'),
    description: en ? 'Someone left you a message on QRNot.' : 'QRNot üzerinden sana bırakılmış bir mesaj var.',
  }
}

export default async function QRPage({ params, searchParams }: Props) {
  await ensureGrowthSchema()
  const { slug } = await params
  const query = await searchParams
  const lang = await getRequestLang(query.lang)

  const rows = (await sql`
    SELECT id, slug, is_demo, order_type, is_active, is_claimed, audio_url, title, play_count, demo_expires_at, created_at, updated_at, qr_mode, guestbook_settings
    FROM qr_codes WHERE slug = ${slug}
  `) as unknown as QrRow[]

  if (rows.length === 0) notFound()

  const qr = (await deactivateExpiredDemoQr(rows[0])) as QrRow
  // Admin tarafından iptal edilen (ör. sahte Etsy aktivasyonu) QR'lar hiç açılmaz.
  if (!qr.is_demo && qr.is_active === false) notFound()

  if (qr.is_claimed && qr.is_active !== false) {
    await sql`UPDATE qr_codes SET play_count = play_count + 1 WHERE slug = ${slug}`
    qr.play_count += 1
  }

  // Ek özellikler (zaman kapsülü, kayıp modu, grup mesajları, cevaplar, altyazı) — sadece normal QR'larda
  const feature = qr.qr_mode === 'guestbook' ? null : await loadFeatureQr(slug)
  const locked = Boolean(feature && qr.is_claimed && isTimeLocked(feature))

  if (feature && qr.is_claimed && qr.is_active !== false) {
    // Okutma bildirimi yanıt gönderildikten sonra işlenir; sayfa açılışını yavaşlatmaz
    after(() => recordScan(feature, query.src === 'nfc' ? 'nfc' : 'qr').catch((error) => console.warn('[scan event]', error)))
  }

  // Kapsül kilitliyken içerik sayfaya hiç gönderilmez
  const mediaRows = locked
    ? []
    : ((await sql`
        SELECT id, qr_id, media_type, source_type, blob_url, external_url, title, sort_order, is_primary, created_at, updated_at, transcript
        FROM qr_media
        WHERE qr_id = ${qr.id}
        ORDER BY sort_order ASC, created_at ASC
      `) as unknown as Array<QRMedia & { transcript: string | null }>)

  const extras: PlayExtrasData | null =
    feature && qr.is_claimed
      ? {
          lockedUntil: locked ? feature.unlock_at : null,
          lostMode: feature.lost_mode,
          repliesEnabled: feature.replies_enabled && !locked,
          groupMessages: locked ? [] : await listQrEntries(qr.id, 'group', true),
          captionMediaIds: mediaRows.filter((m) => m.transcript).map((m) => m.id),
        }
      : null

  const mode = qr.qr_mode === 'guestbook' ? 'guestbook' : 'standard'
  const guestbook = mode === 'guestbook' ? publicGuestbookSettings(readGuestbookSettings(qr.guestbook_settings)) : null

  const safeQr: QRCode = {
    id: qr.id,
    slug: qr.slug,
    is_demo: qr.is_demo,
    order_type: qr.order_type,
    is_active: qr.is_active,
    is_claimed: qr.is_claimed,
    admin_token: null,
    audio_url: qr.audio_url,
    title: qr.title,
    play_count: qr.play_count,
    demo_expires_at: qr.demo_expires_at,
    created_at: new Date(qr.created_at).toISOString(),
    updated_at: new Date(qr.updated_at).toISOString(),
    // Döküm metni sayfaya gömülmez; altyazı API üzerinden dile göre istenir
    media_items: mediaRows.map(({ transcript: _transcript, ...item }) => item as QRMedia),
  }

  return <QRClient qr={safeQr} lang={lang} mode={mode} guestbook={guestbook} viaNfc={query.src === 'nfc'} extras={extras} />
}
