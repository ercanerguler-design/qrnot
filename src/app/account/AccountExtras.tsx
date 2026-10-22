'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { withLang, type Lang } from '@/lib/i18n'

// Hesap sayfası: Premium durumu, bildirim kutusu (okutma / cevap / grup mesajı / kayıp eşya konumu) ve anlık bildirim izni.

interface QrEvent {
  id: string
  kind: 'scan' | 'reply' | 'group' | 'found'
  data: { source?: string; author?: string; lat?: number | null; lng?: number | null; accuracy?: number | null; message?: string; contact?: string } | null
  read_at: string | null
  created_at: string
  slug: string
  title: string | null
}

const T = {
  tr: {
    premiumTitle: '💎 Premium',
    premiumActive: 'Premium üyeliğin aktif',
    premiumUntil: 'Bitiş',
    premiumDesc: 'Sınırsız içerik güncelleme ve yapay zekâ altyazı. Hesabındaki tüm QR’larda geçerli.',
    premiumBuy: 'Premium’a geç · 199 TL / yıl',
    premiumExtend: '1 yıl uzat',
    notificationsTitle: '🔔 Bildirimler',
    unread: 'okunmamış',
    markRead: 'Tümünü okundu say',
    empty: 'Henüz bildirim yok. QR’ların okutulunca, cevap ya da mesaj gelince burada görürsün.',
    pushOn: '📲 Bu cihazda bildirimleri aç',
    pushOff: 'Bu cihazda bildirimler açık ✓',
    pushUnsupported: 'Bu tarayıcı anlık bildirimi desteklemiyor. iPhone’da önce siteyi “Ana Ekrana Ekle” ile uygulama gibi açman gerekir.',
    pushDenied: 'Bildirim izni verilmedi. Tarayıcı ayarlarından açabilirsin.',
    pushUnavailable: 'Anlık bildirim servisi çok yakında aktif olacak.',
    scan: 'okutuldu',
    viaNfc: '(NFC ile)',
    reply: 'için yeni cevap',
    group: 'için yeni grup mesajı — onayını bekliyor',
    found: '📍 için bulan kişi konum/not gönderdi',
    openMap: 'Haritada aç',
    manage: 'Yönet',
  },
  en: {
    premiumTitle: '💎 Premium',
    premiumActive: 'Your Premium membership is active',
    premiumUntil: 'Ends',
    premiumDesc: 'Unlimited content updates and AI captions on every QR in your account.',
    premiumBuy: 'Go Premium · $9.99 / year',
    premiumExtend: 'Extend 1 year',
    notificationsTitle: '🔔 Notifications',
    unread: 'unread',
    markRead: 'Mark all as read',
    empty: 'No notifications yet. You will see scans, replies and messages here.',
    pushOn: '📲 Turn on notifications on this device',
    pushOff: 'Notifications are on for this device ✓',
    pushUnsupported: 'This browser does not support push notifications. On iPhone, add the site to your Home Screen first.',
    pushDenied: 'Notification permission was denied. You can enable it in your browser settings.',
    pushUnavailable: 'Push notifications will be live very soon.',
    scan: 'was scanned',
    viaNfc: '(via NFC)',
    reply: 'has a new reply',
    group: 'has a new group message — awaiting approval',
    found: '📍 a finder sent a location/note for',
    openMap: 'Open map',
    manage: 'Manage',
  },
}

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export default function AccountExtras({ lang, premiumUntil }: { lang: Lang; premiumUntil: string | null }) {
  const t = T[lang]
  const [events, setEvents] = useState<QrEvent[]>([])
  const [unread, setUnread] = useState(0)
  const [push, setPush] = useState<'unknown' | 'on' | 'off' | 'unsupported' | 'denied'>('unknown')
  const [pushError, setPushError] = useState<string | null>(null)
  const [now] = useState(() => Date.now())
  const premiumActive = Boolean(premiumUntil && new Date(premiumUntil).getTime() > now)

  const load = useCallback(async () => {
    const res = await fetch('/api/account/notifications', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setEvents(data.events || [])
    setUnread(data.unread || 0)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPush('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setPush('denied')
      return
    }
    navigator.serviceWorker
      .getRegistration('/sw.js')
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setPush(sub ? 'on' : 'off'))
      .catch(() => setPush('off'))
    if (window.location.search.includes('tab=notifications')) {
      document.getElementById('bildirimler')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [load])

  const enablePush = async () => {
    setPushError(null)
    if (!VAPID) {
      setPushError(t.pushUnavailable)
      return
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPush('denied')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) }))
      const res = await fetch('/api/account/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || t.pushUnavailable)
      setPush('on')
    } catch (err) {
      setPushError(err instanceof Error ? err.message : t.pushUnavailable)
    }
  }

  const markRead = async () => {
    await fetch('/api/account/notifications', { method: 'POST' })
    await load()
  }

  const label = (e: QrEvent) => {
    const name = String(e.title || '').replace(/\[(TEL|LOC):[^\]]+\]/g, '').trim() || e.slug
    if (e.kind === 'scan') return `“${name}” ${t.scan} ${e.data?.source === 'nfc' ? t.viaNfc : ''}`
    if (e.kind === 'reply') return `“${name}” ${t.reply}${e.data?.author ? ` · ${e.data.author}` : ''}`
    if (e.kind === 'group') return `“${name}” ${t.group}${e.data?.author ? ` · ${e.data.author}` : ''}`
    return `${t.found} “${name}”`
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      <section className={`w-card space-y-3 p-6 ${premiumActive ? 'border-2 border-gold' : ''}`}>
        <h2 className="font-display text-2xl font-semibold">{t.premiumTitle}</h2>
        {premiumActive ? (
          <>
            <p className="font-semibold text-sage">{t.premiumActive}</p>
            <p className="text-sm text-ink-2">
              {t.premiumUntil}: {new Date(premiumUntil as string).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', { dateStyle: 'long' })}
            </p>
          </>
        ) : null}
        <p className="text-sm text-ink-2">{t.premiumDesc}</p>
        <Link href={withLang('/shop/premium', lang)} className="w-btn w-btn-primary w-btn-sm">
          {premiumActive ? t.premiumExtend : t.premiumBuy}
        </Link>
      </section>

      <section id="bildirimler" className="w-card scroll-mt-24 space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">
            {t.notificationsTitle} {unread > 0 && <span className="w-chip w-chip-gold ml-1 align-middle text-xs">{unread} {t.unread}</span>}
          </h2>
          {unread > 0 && (
            <button type="button" className="text-xs font-semibold text-muted hover:text-ink" onClick={markRead}>
              {t.markRead}
            </button>
          )}
        </div>

        {push === 'on' ? (
          <p className="text-sm font-semibold text-sage">{t.pushOff}</p>
        ) : push === 'unsupported' ? (
          <p className="text-xs text-muted">{t.pushUnsupported}</p>
        ) : push === 'denied' ? (
          <p className="text-xs text-muted">{t.pushDenied}</p>
        ) : push === 'off' ? (
          <button type="button" className="w-btn w-btn-dark w-btn-sm" onClick={enablePush}>
            {t.pushOn}
          </button>
        ) : null}
        {pushError && <p className="text-xs text-coral">{pushError}</p>}

        {events.length === 0 ? (
          <p className="text-sm text-muted">{t.empty}</p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-auto pr-1">
            {events.map((e) => (
              <li key={e.id} className={`rounded-2xl border p-3 text-sm ${e.read_at ? 'border-line bg-paper' : 'border-coral/40 bg-coral-soft/40'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="font-medium">{label(e)}</span>
                  <span className="text-xs text-muted">{new Date(e.created_at).toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR')}</span>
                </div>
                {e.kind === 'found' && (
                  <div className="mt-2 space-y-1 text-ink-2">
                    {e.data?.message && <p>“{e.data.message}”</p>}
                    {e.data?.contact && <p>☎ {e.data.contact}</p>}
                    {e.data?.lat != null && e.data?.lng != null && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${e.data.lat},${e.data.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-btn w-btn-primary w-btn-sm"
                      >
                        📍 {t.openMap} {e.data.accuracy ? `(±${e.data.accuracy} m)` : ''}
                      </a>
                    )}
                  </div>
                )}
                {(e.kind === 'reply' || e.kind === 'group') && (
                  <Link href={withLang(`/q/${e.slug}`, lang)} className="mt-1 inline-block text-xs font-semibold text-coral hover:underline">
                    {t.manage} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
