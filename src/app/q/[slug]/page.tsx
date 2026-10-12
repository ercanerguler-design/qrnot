import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { deactivateExpiredDemoQr, ensureQrSchema, sql } from '@/lib/db'
import type { QRCode, QRMedia } from '@/lib/db'
import QRClient from './QRClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await ensureQrSchema()
  const { slug } = await params
  const rows = (await sql`
    SELECT slug, title, is_demo, is_active, is_claimed, demo_expires_at FROM qr_codes WHERE slug = ${slug}
  `) as Pick<QRCode, 'title' | 'is_claimed'>[]
  if (rows.length === 0) return { title: 'QRNote' }
  const row = await deactivateExpiredDemoQr(rows[0] as QRCode) as QRCode
  if (row.is_demo && row.is_active === false) {
    return {
      title: 'Demo QR Süresi Doldu — QRNote',
      description: 'Bu demo QR artık aktif değil. Yeni demo oluşturabilir veya paket satın alabilirsin.',
    }
  }
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
    SELECT id, slug, is_demo, order_type, is_active, is_claimed, audio_url, title, play_count, demo_expires_at, created_at, updated_at
    FROM qr_codes WHERE slug = ${slug}
  `) as unknown as QRCode[]

  if (rows.length === 0) notFound()

  const qr = await deactivateExpiredDemoQr(rows[0]) as QRCode

  // play_count artır (claimed ise)
  if (qr.is_claimed && qr.is_active !== false) {
    await sql`UPDATE qr_codes SET play_count = play_count + 1 WHERE slug = ${slug}`
    qr.play_count += 1
  }

  const mediaRows = (await sql`
    SELECT id, qr_id, media_type, source_type, blob_url, external_url, title, sort_order, is_primary, created_at, updated_at
    FROM qr_media
    WHERE qr_id = ${qr.id}
    ORDER BY sort_order ASC, created_at ASC
  `) as unknown as QRMedia[]
  qr.media_items = mediaRows

  return <QRClient qr={qr} />
}

