import { NextRequest, NextResponse } from 'next/server'
import { pruneAnalytics } from '@/lib/analytics'
import { runDailyMaintenance } from '@/lib/dpp/safety'

// Vercel Cron (günde bir): DPP tam yedeği + çöp kutusu temizliği. Aynı gün ikinci çalıştırma bir şey yapmaz.
// CRON_SECRET tanımlıysa Vercel'in gönderdiği "Authorization: Bearer <CRON_SECRET>" başlığı zorunludur.

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = String(process.env.CRON_SECRET || '').trim()
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  // Site ölçümü: 400 günden eski olaylar silinir
  await pruneAnalytics().catch((e) => console.error('[analytics prune]', e))
  return NextResponse.json(await runDailyMaintenance())
}
