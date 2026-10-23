import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/site'

// Sayfa meta bilgisi (TR / EN): her dil kendi başlığı, açıklaması ve kendi asıl adresiyle (canonical) dizine girer.
// Dil sadece adresten okunur (?lang=en); çerez ya da tarayıcı diline göre değişmez, yoksa Google iki dili karıştırır.

export type SeoCopy = { title: string; description: string }

export const seoLang = (raw: string | string[] | undefined | null): 'tr' | 'en' => ((Array.isArray(raw) ? raw[0] : raw) === 'en' ? 'en' : 'tr')

const enPath = (path: string) => `${path}${path.includes('?') ? '&' : '?'}lang=en`

export function pageMeta(
  rawLang: string | string[] | undefined | null,
  path: string,
  copy: { tr: SeoCopy; en: SeoCopy },
  opts: { image?: string; noindex?: boolean } = {}
): Metadata {
  const lang = seoLang(rawLang)
  const c = copy[lang]
  const canonical = lang === 'en' ? enPath(path) : path
  const image = opts.image || '/opengraph-image'
  return {
    // Başlıkta marka zaten varsa şablon ("| QRNot") ikinci kez eklenmesin
    title: c.title.includes(SITE_NAME) ? { absolute: c.title } : c.title,
    description: c.description,
    alternates: { canonical, languages: { 'tr-TR': path, 'en-US': enPath(path), 'x-default': path } },
    openGraph: {
      title: c.title,
      description: c.description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'tr_TR',
      alternateLocale: lang === 'en' ? ['tr_TR'] : ['en_US'],
      images: [{ url: image, width: 1200, height: 630, alt: c.title }],
    },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description, images: [image] },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
