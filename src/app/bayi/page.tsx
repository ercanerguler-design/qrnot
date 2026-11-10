import type { Metadata } from 'next'
import { Suspense } from 'react'
import { WarmPage } from '@/components/warm/SiteChrome'
import { getRequestLang } from '@/lib/i18n.server'
import DealerPanel from './DealerPanel'

export const metadata: Metadata = {
  title: 'Bayi paneli',
  robots: { index: false, follow: false },
}

export default async function DealerPanelPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getRequestLang((await searchParams).lang)
  return (
    <WarmPage lang={lang}>
      <Suspense fallback={<div className="py-24" />}>
        <DealerPanel />
      </Suspense>
    </WarmPage>
  )
}
