import { NextRequest, NextResponse } from 'next/server'
import { runDailyMaintenance } from '@/lib/dpp/safety'

// Vercel Cron (günde bir): DPP tam yedeği + çöp kutusu temizliği. Aynı gün ikinci çalıştırma bir şey yapmaz.
// CRON_SECRET tanımlıysa Vercel'in gönderdiği "Authorization: Bearer <CRON_SECRET>" başlığı zorunludur.

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = String(process.env.CRON_SECRET || '').trim()
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  return NextResponse.json(await runDailyMaintenance())
}
