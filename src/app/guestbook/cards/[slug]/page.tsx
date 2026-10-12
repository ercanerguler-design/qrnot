import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadGuestbookQr } from '@/lib/guestbookServer'
import { getRequestLang } from '@/lib/i18n.server'
import { SITE_URL } from '@/lib/site'
import PrintCards from './PrintCards'

export const metadata: Metadata = { title: 'Masa kartları', robots: { index: false, follow: false } }

// Anı defteri için yazdırılabilir masa kartları (A4'e 4 kart).
export default async function GuestbookCardsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params
  const lang = await getRequestLang((await searchParams).lang)
  const qr = await loadGuestbookQr(slug)
  if (!qr || qr.qr_mode !== 'guestbook') notFound()

  return <PrintCards lang={lang} url={`${SITE_URL}/q/${slug}`} eventName={qr.settings.eventName || qr.title} pinRequired={Boolean(qr.settings.pinHash)} />
}
