import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadGuestbookQr } from '@/lib/guestbookServer'
import { getRequestLang } from '@/lib/i18n.server'
import { SITE_URL } from '@/lib/site'
import WallClient from './WallClient'

export const metadata: Metadata = { title: 'Canlı anı duvarı', robots: { index: false, follow: false } }

// Canlı anı duvarı: etkinlik sırasında salondaki ekrana / projeksiyona yansıtılır; onaylı anılar canlı akar.
export default async function WallPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params
  const lang = await getRequestLang((await searchParams).lang)
  const qr = await loadGuestbookQr(slug)
  if (!qr || qr.qr_mode !== 'guestbook' || !qr.is_claimed || qr.is_active === false) notFound()
  return <WallClient slug={slug} lang={lang} eventName={qr.settings.eventName || qr.title || ''} isPublic={qr.settings.publicWall} qrUrl={`${SITE_URL}/q/${slug}`} />
}
