import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

// NFC etiketlerine yazılan kısa adres: /n/{slug}
// NFC okutmalarını ayrıca sayar ve QR sayfasına yönlendirir.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const safeSlug = slug.replace(/[^a-z0-9]/gi, '').slice(0, 12)
  const target = new URL(`/q/${safeSlug}`, req.nextUrl.origin)
  target.searchParams.set('src', 'nfc')
  const lang = req.nextUrl.searchParams.get('lang')
  if (lang === 'en' || lang === 'tr') target.searchParams.set('lang', lang)

  try {
    await ensureGrowthSchema()
    await sql`UPDATE qr_codes SET nfc_scan_count = nfc_scan_count + 1 WHERE slug = ${safeSlug}`
  } catch (err) {
    // sayaç hatası yönlendirmeyi engellemesin
    console.error('[nfc redirect]', err)
  }

  const res = NextResponse.redirect(target, 302)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
