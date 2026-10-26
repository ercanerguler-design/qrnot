import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import FrameBreakout from '@/components/warm/FrameBreakout'
import { WarmPage } from '@/components/warm/SiteChrome'
import { AUTH_COOKIE_NAME } from '@/lib/auth'
import { currencyForLang } from '@/lib/commerce/catalog'
import { availableProviders } from '@/lib/commerce/providers'
import { getRequestLang } from '@/lib/i18n.server'
import CartClient from './CartClient'

export const metadata: Metadata = {
  title: 'Sepet ve Ödeme',
  robots: { index: false, follow: false },
}

export default async function CartPage({ searchParams }: { searchParams: Promise<{ lang?: string; payment?: string }> }) {
  const query = await searchParams
  const lang = await getRequestLang(query.lang)
  const providers = availableProviders(currencyForLang(lang))
  const hasSession = Boolean((await cookies()).get(AUTH_COOKIE_NAME)?.value)

  return (
    <WarmPage lang={lang}>
      <FrameBreakout />
      <CartClient lang={lang} providers={providers} hasSession={hasSession} paymentError={query.payment === 'error'} />
    </WarmPage>
  )
}
