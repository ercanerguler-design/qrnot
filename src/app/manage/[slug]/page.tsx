import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getRequestLang } from '@/lib/i18n.server'
import ManageClient from './ManageClient'

export const metadata: Metadata = {
  title: 'QR Yönetimi',
  robots: { index: false, follow: false },
}

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const { slug } = await params
  const lang = await getRequestLang((await searchParams).lang)

  return (
    <Suspense fallback={<div className="warm" />}>
      <ManageClient slug={slug} lang={lang} />
    </Suspense>
  )
}
