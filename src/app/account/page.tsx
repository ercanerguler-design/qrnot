import type { Metadata } from 'next'
import { Suspense } from 'react'
import { WarmPage } from '@/components/warm/SiteChrome'
import { getRequestLang } from '@/lib/i18n.server'
import AccountClient from './AccountClient'

export const metadata: Metadata = {
  title: 'Hesabım',
  robots: { index: false, follow: false },
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getRequestLang((await searchParams).lang)
  return (
    <WarmPage lang={lang}>
      <Suspense fallback={<div className="py-24" />}>
        <AccountClient lang={lang} />
      </Suspense>
    </WarmPage>
  )
}
