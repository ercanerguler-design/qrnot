import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { sql } from '@/lib/db'

type RecoverRow = {
  id: string
  slug: string
  is_claimed: boolean
  recovery_code_hash: string | null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()
    const recoveryCode = String(body.recoveryCode || '').trim().toUpperCase()

    if (!recoveryCode) {
      return NextResponse.json({ error: 'Kurtarma kodu gerekli' }, { status: 400 })
    }

    const rows = (await sql`
      SELECT id, slug, is_claimed, recovery_code_hash
      FROM qr_codes
      WHERE slug = ${slug}
    `) as RecoverRow[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
    }

    const qr = rows[0]
    if (!qr.is_claimed || !qr.recovery_code_hash) {
      return NextResponse.json({ error: 'Bu QR için kurtarma henüz aktif değil' }, { status: 400 })
    }

    const providedHash = createHash('sha256').update(recoveryCode).digest('hex')
    if (providedHash !== qr.recovery_code_hash) {
      return NextResponse.json({ error: 'Kurtarma kodu hatalı' }, { status: 403 })
    }

    const ownerToken = randomBytes(32).toString('hex')
    await sql`
      UPDATE qr_codes
      SET admin_token = ${ownerToken},
          updated_at = NOW()
      WHERE slug = ${slug}
    `

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    return NextResponse.json({
      ownerToken,
      manageUrl: `${baseUrl}/manage/${slug}?token=${ownerToken}`,
    })
  } catch (err) {
    console.error('[recover]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}