import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isOwnerToken, loadFeatureQr, newGroupToken } from '@/lib/qrFeatures'

// Sahip ayarları: zaman kapsülü, kayıp modu, okutma bildirimi, cevaplar, grup hediyesi daveti.
// Sadece gönderilen alanlar değişir. Bu ayarlar içerik kaydı (3 kayıt hakkı) harcamaz.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const body = await req.json().catch(() => ({}))
    const qr = await loadFeatureQr(slug)
    if (!qr || !isOwnerToken(qr, String(body.token || ''))) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    if (qr.qr_mode === 'guestbook') return NextResponse.json({ error: 'Anı defterinde bu ayarlar yok' }, { status: 400 })

    let unlockAt = qr.unlock_at
    if ('unlockAt' in body) {
      if (body.unlockAt === null || body.unlockAt === '') {
        unlockAt = null
      } else {
        const date = new Date(String(body.unlockAt))
        if (Number.isNaN(date.getTime())) return NextResponse.json({ error: 'Geçersiz tarih' }, { status: 400 })
        if (date.getTime() <= Date.now()) return NextResponse.json({ error: 'Açılış tarihi gelecekte olmalı' }, { status: 400 })
        if (date.getTime() > Date.now() + 50 * 365 * 24 * 3600 * 1000) return NextResponse.json({ error: 'En fazla 50 yıl sonrası seçilebilir' }, { status: 400 })
        unlockAt = date.toISOString()
      }
    }
    const lostMode = typeof body.lostMode === 'boolean' ? body.lostMode : qr.lost_mode
    const notifyScans = typeof body.notifyScans === 'boolean' ? body.notifyScans : qr.notify_scans
    const repliesEnabled = typeof body.repliesEnabled === 'boolean' ? body.repliesEnabled : qr.replies_enabled
    let groupToken = qr.group_token
    if (body.groupEnabled === true && !groupToken) groupToken = newGroupToken()
    if (body.groupEnabled === false) groupToken = null
    if (body.regenerateGroupLink === true && groupToken) groupToken = newGroupToken()

    await sql`
      UPDATE qr_codes
      SET unlock_at = ${unlockAt}, lost_mode = ${lostMode}, notify_scans = ${notifyScans},
          replies_enabled = ${repliesEnabled}, group_token = ${groupToken}, updated_at = NOW()
      WHERE id = ${qr.id}
    `
    return NextResponse.json({ ok: true, unlockAt, lostMode, notifyScans, repliesEnabled, groupToken })
  } catch (err) {
    console.error('[qr/settings]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
