'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

// Sitenin kendi ölçümü (çerezsiz): sayfa görüntülemesi + önemli tıklamalar /api/t'ye gider.
// Adres çubuğundaki gizli anahtarlar (?key=, ?k= …) gönderilmez; sadece yol ve reklam parametreleri.
// Kendi cihazında ölçümü kapatmak için: siteyi bir kez ?notrack=1 ile aç (yönetim paneli bunu otomatik yapar).

const KEEP = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'li_fat_id', 'msclkid']

function noTrack() {
  try {
    if (new URLSearchParams(window.location.search).get('notrack') === '1') localStorage.setItem('qrnot_notrack', '1')
    return localStorage.getItem('qrnot_notrack') === '1'
  } catch {
    return false
  }
}

function send(payload: Record<string, unknown>) {
  if (noTrack()) return
  const body = JSON.stringify({ ...payload, l: navigator.language || '' })
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/t', new Blob([body], { type: 'text/plain' }))) return
  } catch {}
  void fetch('/api/t', { method: 'POST', body, keepalive: true }).catch(() => {})
}

function cleanUrl() {
  const params = new URLSearchParams(window.location.search)
  const kept = new URLSearchParams()
  for (const k of KEEP) {
    const v = params.get(k)
    if (v) kept.set(k, v.slice(0, 200))
  }
  const q = kept.toString()
  return window.location.pathname + (q ? `?${q}` : '')
}

/** Tıklama olayı (bileşenlerden de çağrılabilir) */
export function trackEvent(name: string, props: Record<string, string | number> = {}) {
  send({ t: 'event', n: name, u: window.location.pathname, p: props })
}

export default function SiteAnalytics() {
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    // İlk açılışta gerçek yönlendiren site; site içi geçişlerde kendi adresimiz (kaynak "site içi" sayılır)
    const referrer = first.current ? document.referrer : window.location.origin
    first.current = false
    send({ t: 'pageview', u: cleanUrl(), r: referrer })
  }, [pathname])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('a, button, [data-track]')
      if (!el) return
      const tagged = el.closest('[data-track]')
      if (tagged) {
        trackEvent(tagged.getAttribute('data-track') || 'click', { label: (tagged.getAttribute('data-track-label') || tagged.textContent || '').trim().slice(0, 60) })
        return
      }
      if (el.tagName !== 'A') return
      const href = (el as HTMLAnchorElement).href || ''
      const label = (el.textContent || '').trim().slice(0, 60)
      if (/wa\.me|whatsapp\.com/i.test(href)) trackEvent('whatsapp_click', { label })
      else if (href.startsWith('tel:')) trackEvent('phone_click', { label })
      else if (href.startsWith('mailto:')) trackEvent('email_click', { label })
      else {
        try {
          const u = new URL(href)
          if (u.origin !== window.location.origin && /^https?:$/.test(u.protocol)) trackEvent('outbound_click', { host: u.hostname.replace(/^www\./, ''), label })
        } catch {}
      }
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return null
}
