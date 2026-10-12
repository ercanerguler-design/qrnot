import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'
import { deleteQrWithMedia } from '@/lib/qrDelete'

// Üye, kendi hesabındaki (oluşturduğu ya da sahiplendiği) QR'ı tüm içeriğiyle kalıcı olarak siler.
// Fiziksel ürünün QR'ı / NFC'si bundan sonra "bulunamadı" verir. Kullanılmış hak iade edilmez.
export async function POST(req: NextRequest) {
  try {
    await ensureGrowthSchema()

    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Devam etmek için giriş yap' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const slug = String(body.slug || '').trim()
    if (!slug) {
      return NextResponse.json({ error: 'Silinecek QR kodu belirtilmedi' }, { status: 400 })
    }

    const rows = (await sql`
      SELECT id, slug
      FROM qr_codes
      WHERE slug = ${slug}
        AND (creator_user_id = ${user.id} OR owner_user_id = ${user.id})
      LIMIT 1
    `) as Array<{ id: string; slug: string }>

    if (rows.length === 0) {
      return NextResponse.json({ error: 'QR kodu bulunamadı veya bu işlem için yetkin yok' }, { status: 404 })
    }

    const result = await deleteQrWithMedia(rows[0].id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    // Intentionally do not decrease used_slots.
    return NextResponse.json({ ok: true, slug: rows[0].slug })
  } catch (err) {
    console.error('[account/qr/delete]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
