import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { ensureGrowthSchema } from '@/lib/growthSchema'

// Boş bir QR'ı sahiplenmek için üye girişi zorunlu; QR sahiplenen hesaba (owner_user_id) bağlanır.
// Başka bir hesabın oluşturduğu QR da sahiplenilebilir (firma QR'ı hazırlar, alıcı kendi hesabıyla kurar).
// Sahiplenilince oluşturan hesap QR'ı yönetemez, silemez ve bildirimlerini görmez.
export async function requireClaimUser(req: NextRequest) {
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

  return { user }
}
