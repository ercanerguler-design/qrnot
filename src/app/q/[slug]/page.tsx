import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ensureQrSchema, sql } from '@/lib/db'
import type { QRCode } from '@/lib/db'
import QRClient from './QRClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await ensureQrSchema()
  const { slug } = await params
  const rows = (await sql`
    SELECT title, is_claimed FROM qr_codes WHERE slug = ${slug}
  `) as Pick<QRCode, 'title' | 'is_claimed'>[]
  if (rows.length === 0) return { title: 'QRNote' }
  const row = rows[0]
  if (!row.is_claimed) {
    return {
      title: 'QR Kodu Sahiplen — QRNote',
      description: 'Bu QR kodu henüz sahiplenilmedi. İlk sesini kaydet!',
    }
  }
  return {
    title: row.title ? `${row.title} — QRNote` : 'Sesli Not — QRNote',
    description: 'QR kod ile bırakılmış sesli bir mesaj seni bekliyor.',
  }
}

export default async function QRPage({ params }: Props) {
  await ensureQrSchema()
  const { slug } = await params

  const rows = (await sql`
    SELECT id, slug, is_demo, is_claimed, audio_url, title, play_count, created_at, updated_at
    FROM qr_codes WHERE slug = ${slug}
  `) as QRCode[]

  if (rows.length === 0) notFound()

  const qr = rows[0]

  // play_count artır (claimed ise)
  if (qr.is_claimed) {
    await sql`UPDATE qr_codes SET play_count = play_count + 1 WHERE slug = ${slug}`
    qr.play_count += 1
  }

  return <QRClient qr={qr} />
}

