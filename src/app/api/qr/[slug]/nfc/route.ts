import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

// Sahip: NFC etiketine yazma işlemi tamamlandığında kaydeder.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await ensureGrowthSchema()
    const { slug } = await params
    const body = await req.json().catch(() => ({}))
    const token = String(body.token || '')
    if (!token) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })

    const rows = await sql`
      UPDATE qr_codes
      SET nfc_encoded_at = NOW(),
          nfc_locked = nfc_locked OR ${body.locked === true},
          updated_at = NOW()
      WHERE slug = ${slug} AND is_claimed = TRUE AND admin_token = ${token}
      RETURNING nfc_encoded_at, nfc_locked
    `
    if (rows.length === 0) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    return NextResponse.json({ ok: true, nfcEncodedAt: rows[0].nfc_encoded_at, nfcLocked: rows[0].nfc_locked })
  } catch (err) {
    console.error('[qr/nfc]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
