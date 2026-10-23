import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { clientIp } from '@/lib/growthSchema'
import { createDemo } from '@/lib/dpp/demoAccount'
import { DppError, errorText } from '@/lib/dpp/i18n'
import { requestLang } from '@/lib/dpp/requestLang'

// Web sitesinden demo talebi: kısıtlı demo firması + yönetici hesabı açar, geçici şifreyi bir kez döner.
// IP adresi saklanmaz; kötüye kullanım sınırı için sadece kısa ömürlü özeti kullanılır.

export async function POST(req: NextRequest) {
  const lang = requestLang(req)
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const ipKey = createHash('sha256').update(clientIp(req.headers) || 'unknown').digest('hex').slice(0, 24)
    const demo = await createDemo({ ...body, lang }, ipKey)
    return NextResponse.json(demo, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (!(err instanceof DppError)) console.error('[dpp/demo]', err)
    const status = err instanceof DppError ? (err.key === 'e_too_many' ? 429 : 400) : 500
    return NextResponse.json({ error: errorText(err, lang) }, { status })
  }
}
