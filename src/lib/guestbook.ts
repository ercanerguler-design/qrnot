// Anı defteri (guestbook) modu ayarları — qr_codes.guestbook_settings JSONB kolonunda tutulur.

export interface GuestbookSettings {
  /** Etkinlik adı, örn. "Ayşe & Mehmet'in Düğünü" */
  eventName: string
  /** Kısa karşılama mesajı */
  welcome: string
  /** Yeni anı kabul ediliyor mu */
  open: boolean
  /** true → anılar sahip onaylayana kadar görünmez */
  moderation: boolean
  /** true → onaylı anılar QR sayfasında herkese görünür */
  publicWall: boolean
  /** sha256(PIN) — boşsa PIN istenmez */
  pinHash: string | null
  /** Toplam anı sınırı */
  entryLimit: number
}

export const DEFAULT_GUESTBOOK_LIMIT = 300

export function readGuestbookSettings(raw: unknown): GuestbookSettings {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<GuestbookSettings>
  return {
    eventName: typeof value.eventName === 'string' ? value.eventName.slice(0, 120) : '',
    welcome: typeof value.welcome === 'string' ? value.welcome.slice(0, 400) : '',
    open: value.open !== false,
    moderation: value.moderation !== false,
    publicWall: value.publicWall === true,
    pinHash: typeof value.pinHash === 'string' && value.pinHash ? value.pinHash : null,
    entryLimit:
      typeof value.entryLimit === 'number' && Number.isFinite(value.entryLimit) && value.entryLimit > 0
        ? Math.floor(value.entryLimit)
        : DEFAULT_GUESTBOOK_LIMIT,
  }
}

/** Tarayıcıya gönderilebilir (PIN hash'i olmadan) ayarlar */
export function publicGuestbookSettings(settings: GuestbookSettings) {
  return {
    eventName: settings.eventName,
    welcome: settings.welcome,
    open: settings.open,
    moderation: settings.moderation,
    publicWall: settings.publicWall,
    pinRequired: Boolean(settings.pinHash),
    entryLimit: settings.entryLimit,
  }
}

export type PublicGuestbookSettings = ReturnType<typeof publicGuestbookSettings>

export interface GuestbookEntry {
  id: string
  author_name: string
  message: string
  media_type: 'audio' | 'video' | 'image' | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
