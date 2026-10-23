import { createHash } from 'crypto'
import { NextRequest, NextResponse, after } from 'next/server'
import { clientIp } from '@/lib/growthSchema'
import { sourceSummary, trackConversion } from '@/lib/analytics'
import { createDemo } from '@/lib/dpp/demoAccount'
import { DppError, errorText } from '@/lib/dpp/i18n'
import { requestLang } from '@/lib/dpp/requestLang'
import { notifyAdmin } from '@/lib/adminNotify'

// Web sitesinden demo talebi: kısıtlı demo firması + yönetici hesabı açar, geçici şifreyi bir kez döner.
// IP adresi saklanmaz; kötüye kullanım sınırı için sadece kısa ömürlü özeti kullanılır.
// Talep gelince QRNot yöneticisine anında bildirim gider (telefona push + ayarlıysa WhatsApp): firma, kişi, telefon, hangi reklamdan geldiği.

export async function POST(req: NextRequest) {
  const lang = requestLang(req)
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const ipKey = createHash('sha256').update(clientIp(req.headers) || 'unknown').digest('hex').slice(0, 24)
    const demo = await createDemo({ ...body, lang }, ipKey)
    trackConversion(req, 'dpp_demo', { path: '/dpp/demo', props: { sector: String(body.sector || '').slice(0, 30) } })
    const headers = new Headers(req.headers)
    // Test adresleri (.invalid / .example / .test) bildirim göndermez
    const testLead = /\.(invalid|example|test)$/i.test(String(body.email || '').trim())
    if (!testLead) after(async () => {
      const s = (k: string) => String(body[k] ?? '').trim().slice(0, 200)
      const source = await sourceSummary(headers)
      const text = [
        '🛂 Yeni DPP demo talebi',
        `Firma: ${s('company')}`,
        `Kişi: ${s('name')} · ${s('email')} · ${s('phone') || 'telefon yok'}`,
        `Sektör: ${s('sector') || '-'} · Ürün sayısı: ${s('products') || '-'} · Ülke: ${s('country') || 'TR'} · Dil: ${lang}`,
        s('message') ? `Mesaj: ${s('message')}` : '',
        `Kaynak: ${source}`,
        'Yönetim: https://www.qrnot.com/admin?tab=dpp',
      ]
        .filter(Boolean)
        .join('\n')
      const target = String(process.env.LEAD_NOTIFY_WHATSAPP || process.env.SHOP_NOTIFY_WHATSAPP || process.env.WHATSAPP_TO_NUMBER || '').trim()
      const res = await notifyAdmin({
        title: `🛂 DPP demo: ${s('company')}`,
        body: [`${s('name')} · ${s('phone') || s('email')}`, `Sektör: ${s('sector') || '-'} · ${s('products') || '?'} ürün`, `Kaynak: ${source}`].join('\n'),
        url: '/admin?tab=dpp',
        whatsappText: text,
        whatsappTo: target || undefined,
      })
      if (!res.push && res.whatsapp !== 'sent') console.error('[dpp/demo notify] hiçbir kanaldan gönderilemedi', res)
    })
    return NextResponse.json(demo, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (!(err instanceof DppError)) console.error('[dpp/demo]', err)
    const status = err instanceof DppError ? (err.key === 'e_too_many' ? 429 : 400) : 500
    return NextResponse.json({ error: errorText(err, lang) }, { status })
  }
}
