// Tüketici sayfaları için basit iki dilli (TR/EN) altyapı.
// Öncelik: ?lang= parametresi → qrnote_lang çerezi → tarayıcı dili → tr

export type Lang = 'tr' | 'en'

export const LANG_COOKIE = 'qrnote_lang'

export function normalizeLang(value: unknown): Lang | null {
  if (value === 'tr' || value === 'en') return value
  return null
}

export function langFromAcceptLanguage(header: string | null | undefined): Lang {
  const first = String(header || '').split(',')[0]?.trim().toLowerCase() || ''
  if (!first) return 'tr'
  return first.startsWith('tr') ? 'tr' : 'en'
}

export function localeOf(lang: Lang) {
  return lang === 'en' ? 'en-US' : 'tr-TR'
}

export function formatDate(value: string | Date, lang: Lang) {
  return new Date(value).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'short', year: 'numeric' })
}

export function withLang(href: string, lang: Lang) {
  if (lang === 'tr') return href
  return href.includes('?') ? `${href}&lang=en` : `${href}?lang=en`
}
