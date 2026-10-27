'use client'

// Meta (Facebook / Instagram) Pixel: yalnızca ziyaretçi çerez onayı verdiyse yüklenir (KVKK).
// Gizli anahtar taşıyan ya da kişisel içerik gösteren sayfalarda (QR içeriği, yönetim, sipariş, admin…) hiç çalışmaz.
// Satın alma olayı tarayıcıdan değil, ödeme onaylanınca sunucudan gönderilir (src/lib/metaCapi.ts).

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1296303192108755'
export const CONSENT_COOKIE = 'qrnot_consent'
export const CONSENT_EVENT = 'qrnot-consent'
export const OPEN_CONSENT_EVENT = 'qrnot-open-consent'

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[]; push: unknown; loaded: boolean; version: string; disablePushState?: boolean }
declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

const PRIVATE_PREFIXES = ['/q/', '/manage', '/admin', '/order', '/print', '/recover', '/reset-password', '/reset-panel-password', '/n/', '/p/', '/h/', '/checkout']

export function isPrivatePath(path: string) {
  return PRIVATE_PREFIXES.some((prefix) => path === prefix.replace(/\/$/, '') || path.startsWith(prefix))
}

export function readConsent(): 'all' | 'essential' | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`))
  return match?.[1] === 'all' ? 'all' : match?.[1] === 'essential' ? 'essential' : null
}

export function saveConsent(value: 'all' | 'essential') {
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
  if (value === 'essential') {
    // Önceden kabul edilip sonra reddedildiyse Meta çerezlerini sil
    for (const name of ['_fbp', '_fbc']) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${location.hostname.replace(/^www\./, '')}`
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }))
}

function noTrack() {
  try {
    return localStorage.getItem('qrnot_notrack') === '1'
  } catch {
    return false
  }
}

export function pixelAllowed() {
  return readConsent() === 'all' && !noTrack() && !isPrivatePath(window.location.pathname)
}

/** Pixel betiğini bir kez yükler. Otomatik olaylar ve adres değişikliği takibi kapalı: sadece bizim gönderdiklerimiz gider. */
export function loadPixel() {
  if (typeof window === 'undefined' || window.fbq || !pixelAllowed()) return
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  } as Fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  fbq.disablePushState = true
  window.fbq = fbq
  if (!window._fbq) window._fbq = fbq
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
  fbq('set', 'autoConfig', false, META_PIXEL_ID)
  fbq('init', META_PIXEL_ID)
}

/** Standart Meta olayı (PageView, Lead, AddToCart, InitiateCheckout, CompleteRegistration…). Onay yoksa sessizce atlanır. */
export function pixelTrack(event: string, params?: Record<string, unknown>) {
  try {
    if (!pixelAllowed()) return
    loadPixel()
    window.fbq?.('track', event, params || {})
  } catch {}
}
