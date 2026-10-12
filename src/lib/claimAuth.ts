import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

// Boş bir QR'ı sahiplenmek için üye girişi zorunlu; QR sahiplenen hesaba (owner_user_id) bağlanır.
// Başka bir hesabın oluşturduğu (creator_user_id dolu) QR'ı farklı bir hesap sahiplenemez.
export async function requireClaimUser(req: NextRequest, qrId: string) {
  await ensureGrowthSchema()
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Bu QR kodunu kurmak için giriş yapmalısın. / Please sign in to set up this QR code.', authRequired: true },
        { status: 401 }
      ),
    }
  }

  const rows = (await sql`SELECT creator_user_id FROM qr_codes WHERE id = ${qrId}`) as Array<{ creator_user_id: string | null }>
  const owner = rows[0]?.creator_user_id
  if (owner && owner !== user.id) {
    return {
      error: NextResponse.json({ error: 'Bu QR kodu başka bir hesaba ait. / This QR code belongs to another account.' }, { status: 403 }),
    }
  }

  return { user }
}
