import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Kişisel QR sayfaları, yönetim ve API'ler arama motorlarına kapalı
        disallow: [
          '/api/',
          '/admin',
          '/manage/',
          '/q/',
          '/n/',
          '/recover/',
          '/order/',
          '/cart',
          '/account',
          '/print/',
          '/guestbook/cards/',
          '/checkout/',
          '/h/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
