import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'
import { getRequestLang } from '@/lib/i18n.server'
import { SITE_URL } from '@/lib/site'
import PrintTemplates from './PrintTemplates'

export const metadata: Metadata = { title: 'Print templates', robots: { index: false, follow: false } }

// Bir QR için yazdırılabilir hediye kartı / etiket / sticker şablonları (A4).
export default async function PrintPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params
  const lang = await getRequestLang((await searchParams).lang)
  await ensureGrowthSchema()
  const rows = await sql`SELECT slug FROM qr_codes WHERE slug = ${slug} AND is_active = TRUE LIMIT 1`
  if (rows.length === 0) notFound()
  return <PrintTemplates lang={lang} url={`${SITE_URL}/q/${slug}`} />
}
