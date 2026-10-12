import { cookies, headers } from 'next/headers'
import { LANG_COOKIE, langFromAcceptLanguage, normalizeLang, type Lang } from '@/lib/i18n'

export async function getRequestLang(queryLang?: string | string[] | null): Promise<Lang> {
  const fromQuery = normalizeLang(Array.isArray(queryLang) ? queryLang[0] : queryLang)
  if (fromQuery) return fromQuery

  const cookieStore = await cookies()
  const fromCookie = normalizeLang(cookieStore.get(LANG_COOKIE)?.value)
  if (fromCookie) return fromCookie

  const headerStore = await headers()
  return langFromAcceptLanguage(headerStore.get('accept-language'))
}
