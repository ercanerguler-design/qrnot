import type { Metadata } from 'next'
import { getRequestLang } from '@/lib/i18n.server'
import { loadFeatureQr } from '@/lib/qrFeatures'
import GroupContributeClient from './GroupContributeClient'

export const metadata: Metadata = {
  title: 'Grup hediyesine mesaj ekle',
  robots: { index: false, follow: false },
}

// Grup hediyesi daveti: /q/<slug>/katki?k=<davet anahtarı>
export default async function GroupContributePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string; k?: string }>
}) {
  const { slug } = await params
  const query = await searchParams
  const lang = await getRequestLang(query.lang)
  const qr = await loadFeatureQr(slug)
  const valid = Boolean(qr && qr.is_claimed && qr.is_active !== false && qr.qr_mode !== 'guestbook' && qr.group_token && query.k === qr.group_token)
  const title = String(qr?.title || '').replace(/\[(TEL|LOC):[^\]]+\]/g, '').trim()
  return <GroupContributeClient slug={slug} groupKey={valid ? String(query.k) : ''} title={title} lang={lang} valid={valid} />
}
