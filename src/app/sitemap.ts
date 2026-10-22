import type { MetadataRoute } from 'next'
import { PRODUCTS } from '@/lib/commerce/catalog'
import { LEGAL_DOCS } from '@/lib/legal'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly') => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: { languages: { 'tr-TR': `${SITE_URL}${path}`, 'en-US': `${SITE_URL}${path}${path.includes('?') ? '&' : '?'}lang=en` } },
  })

  return [
    page('/', 1),
    page('/shop', 0.9),
    ...PRODUCTS.map((product) => page(`/shop/${product.id}`, 0.8)),
    page('/guestbook', 0.8),
    page('/nfc', 0.7),
    page('/katalog', 0.7),
    page('/dpp', 0.7),
    page('/etsy', 0.4, 'monthly'),
    page('/partnerlik', 0.4, 'monthly'),
    page('/hotel', 0.4, 'monthly'),
    page('/education', 0.4, 'monthly'),
    ...LEGAL_DOCS.map((doc) => ({ url: `${SITE_URL}/legal/${doc.slug}`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ]
}
