import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { SITE_URL } from '@/lib/site'
import { ensureDppSchema } from './schema'
import { normalizeGtin } from './types'

// GS1 Digital Link çözümleyici: /01/{GTIN}[/21/{seri}] adresini ilgili pasaporta yönlendirir.
// Böylece ürün etiketindeki standart GS1 QR'ı da doğrudan pasaportu açar.

export async function resolveDigitalLink(rawGtin: string, serial: string | null) {
  const gtin = normalizeGtin(rawGtin)
  if (!gtin) return NextResponse.json({ error: 'Geçersiz GTIN' }, { status: 404 })
  await ensureDppSchema()

  if (serial) {
    const items = (await sql`
      SELECT i.public_id FROM dpp_items i JOIN dpp_products p ON p.id = i.product_id JOIN dpp_companies c ON c.id = p.company_id
      WHERE p.gtin = ${gtin} AND i.serial = ${serial.slice(0, 40)} AND p.published IS NOT NULL AND c.is_active = TRUE
      ORDER BY p.published_at DESC LIMIT 1
    `) as Array<{ public_id: string }>
    if (items[0]) return NextResponse.redirect(`${SITE_URL}/p/${items[0].public_id}`, 307)
  }

  const products = (await sql`
    SELECT p.public_id FROM dpp_products p JOIN dpp_companies c ON c.id = p.company_id
    WHERE p.gtin = ${gtin} AND p.published IS NOT NULL AND c.is_active = TRUE
    ORDER BY p.published_at DESC LIMIT 1
  `) as Array<{ public_id: string }>
  if (products[0]) return NextResponse.redirect(`${SITE_URL}/p/${products[0].public_id}`, 307)
  return NextResponse.json({ error: 'Bu GTIN için yayınlanmış pasaport bulunamadı' }, { status: 404 })
}
