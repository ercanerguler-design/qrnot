import type { Metadata } from 'next'
import { getRequestLang } from '@/lib/i18n.server'
import RecoverClient from './RecoverClient'

export const metadata: Metadata = {
  title: 'Sahip linkini geri al',
  robots: { index: false, follow: false },
}

export default async function RecoverPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const { slug } = await params
  const lang = await getRequestLang((await searchParams).lang)
  return <RecoverClient slug={slug} lang={lang} />
}
