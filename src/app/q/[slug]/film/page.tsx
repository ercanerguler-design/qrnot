import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadGuestbookQr } from '@/lib/guestbookServer'
import { getRequestLang } from '@/lib/i18n.server'
import FilmClient from './FilmClient'

export const metadata: Metadata = { title: 'Anı filmi', robots: { index: false, follow: false } }

// Anı defteri "düğün filmi": onaylı anılar sırayla, tam ekran oynatılır.
// Sahip (token ile) her zaman; diğerleri sadece "herkese açık duvar" açıksa izleyebilir.
export default async function FilmPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params
  const lang = await getRequestLang((await searchParams).lang)
  const qr = await loadGuestbookQr(slug)
  if (!qr || qr.qr_mode !== 'guestbook' || !qr.is_claimed || qr.is_active === false) notFound()
  return <FilmClient slug={slug} lang={lang} eventName={qr.settings.eventName || qr.title || ''} welcome={qr.settings.welcome} isPublic={qr.settings.publicWall} />
}
