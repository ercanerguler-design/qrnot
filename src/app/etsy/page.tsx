import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { WarmPage } from '@/components/warm/SiteChrome'
import { LANG_COOKIE, normalizeLang } from '@/lib/i18n'
import EtsyActivate from './EtsyActivate'

export const metadata: Metadata = {
  title: 'Etsy Activation — Get your personal QR code',
  description: 'Bought a QRNot voice message QR or guestbook on Etsy? Activate your personal QR code here.',
  alternates: { canonical: '/etsy' },
}

// Etsy alıcıları çoğunlukla yabancı olduğu için bu sayfa varsayılan olarak İngilizcedir.
export default async function EtsyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const fromQuery = normalizeLang((await searchParams).lang)
  const fromCookie = normalizeLang((await cookies()).get(LANG_COOKIE)?.value)
  const lang = fromQuery || fromCookie || 'en'
  return (
    <WarmPage lang={lang}>
      <EtsyActivate lang={lang} />
    </WarmPage>
  )
}
