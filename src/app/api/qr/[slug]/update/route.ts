import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { validateAudioFile } from '@/lib/audio'
import { sql, QRCode } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const formData = await req.formData()
    const token = (formData.get('token') as string | null) || ''
    const audioFile = formData.get('audio') as File | null
    const titleRaw = formData.get('title') as string | null

    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 })
    }

    const rows = (await sql`
      SELECT id, slug, is_claimed, admin_token, audio_url, title
      FROM qr_codes WHERE slug = ${slug}
    `) as QRCode[]
    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı' }, { status: 404 })
    }
    const qr = rows[0]
    if (!qr.is_claimed || qr.admin_token !== token) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    let newAudioUrl = qr.audio_url
    const newTitle = titleRaw !== null ? titleRaw.trim().slice(0, 100) : qr.title

    if (audioFile && audioFile.size > 0) {
      const audioValidationError = await validateAudioFile(audioFile)
      if (audioValidationError) {
        return NextResponse.json({ error: audioValidationError }, { status: 400 })
      }

      // Eski blob'u sil
      if (qr.audio_url) {
        try {
          await del(qr.audio_url)
        } catch {
          // Eski blob silinmezse devam et
        }
      }

      // Yeni blob yükle
      const ext = audioFile.name.split('.').pop() || 'webm'
      const blob = await put(`qr/${slug}.${ext}`, audioFile, {
        access: 'public',
        addRandomSuffix: false,
      })
      newAudioUrl = blob.url
    }

    await sql`
      UPDATE qr_codes
      SET audio_url = ${newAudioUrl},
          title = ${newTitle || qr.title},
          updated_at = NOW()
      WHERE slug = ${slug}
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[update]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
