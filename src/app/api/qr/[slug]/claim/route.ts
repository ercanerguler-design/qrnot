import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { validateAudioFile } from '@/lib/audio'
import { sql } from '@/lib/db'
import { randomBytes } from 'crypto'
import { createHash } from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // QR var mı ve sahipsiz mi?
    const rows = await sql`SELECT id, is_claimed FROM qr_codes WHERE slug = ${slug}`
    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
    }
    if (rows[0].is_claimed) {
      return NextResponse.json({ error: 'Bu QR kodu zaten sahiplenilmiş' }, { status: 409 })
    }

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    const title = ((formData.get('title') as string) || '').trim().slice(0, 100) || 'Sesli Not'

    const audioValidationError = await validateAudioFile(audioFile as File)
    if (audioValidationError) {
      return NextResponse.json({ error: audioValidationError }, { status: 400 })
    }

    if (!audioFile) {
      return NextResponse.json({ error: 'Ses dosyası gerekli' }, { status: 400 })
    }

    // Vercel Blob'a yükle
    const ext = audioFile.name.split('.').pop() || 'webm'
    const blob = await put(`qr/${slug}.${ext}`, audioFile, {
      access: 'public',
      addRandomSuffix: false,
    })

    // QR sahibinin sonraki güncellemelerde kullanacağı özel token
    const ownerToken = randomBytes(32).toString('hex')
    const recoveryCode = randomBytes(4).toString('hex').toUpperCase()
    const recoveryCodeHash = createHash('sha256').update(recoveryCode).digest('hex')

    const baseUrl = String(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()

    await sql`
      UPDATE qr_codes
      SET is_claimed = TRUE,
          admin_token = ${ownerToken},
          recovery_code_hash = ${recoveryCodeHash},
          audio_url = ${blob.url},
          title = ${title},
          updated_at = NOW()
      WHERE slug = ${slug}
    `

    return NextResponse.json({
      slug,
      ownerToken,
      recoveryCode,
      playUrl: `${baseUrl}/q/${slug}`,
      manageUrl: `${baseUrl}/manage/${slug}?token=${ownerToken}`,
    })
  } catch (err) {
    console.error('[claim]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
