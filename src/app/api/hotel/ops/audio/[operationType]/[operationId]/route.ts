import { NextRequest, NextResponse } from 'next/server'
import { getBlob } from '@/lib/blob'
import { ensureQrSchema, sql } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ operationType: string; operationId: string }> }
) {
  try {
    await ensureQrSchema()

    const { operationType, operationId } = await params
    const opType = String(operationType || '').trim().toLowerCase()
    const opId = String(operationId || '').trim()

    if (!opId) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
    }

    let voiceNoteUrl = ''

    if (opType === 'room-order') {
      const rows = await sql`
        SELECT voice_note_url
        FROM hotel_room_orders
        WHERE id = ${opId}
        LIMIT 1
      `
      voiceNoteUrl = String(rows[0]?.voice_note_url || '')
    } else if (opType === 'service-ticket') {
      const rows = await sql`
        SELECT voice_note_url
        FROM hotel_service_tickets
        WHERE id = ${opId}
        LIMIT 1
      `
      voiceNoteUrl = String(rows[0]?.voice_note_url || '')
    } else {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 })
    }

    if (!voiceNoteUrl) {
      return NextResponse.json({ error: 'Ses notu bulunamadı' }, { status: 404 })
    }

    const blobResult = await getBlob(voiceNoteUrl, false)
    if (!blobResult || !blobResult.stream) {
      return NextResponse.json({ error: 'Ses notu bulunamadı' }, { status: 404 })
    }

    const headers = new Headers(Array.from(blobResult.headers.entries()))
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    headers.set('Surrogate-Control', 'no-store')

    return new NextResponse(blobResult.stream as BodyInit, { headers })
  } catch (err) {
    console.error('[hotel/ops/audio GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
