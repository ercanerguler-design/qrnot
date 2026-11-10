import { createHash } from 'crypto'
import { NextRequest, NextResponse, after } from 'next/server'
import { notifyAdmin } from '@/lib/adminNotify'
import { trackConversion } from '@/lib/analytics'
import { getAuthenticatedUser } from '@/lib/auth'
import { DealerError, parseApplication, saveApplication } from '@/lib/dealers'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { adminEmails, sendMail } from '@/lib/mail'

// /bayilik başvuru formu: kaydeder, yöneticiye haber verir, başvurana onay e-postası gönderir.

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  try {
    if (String(body.website2 || '')) return NextResponse.json({ ok: true }) // bot tuzağı
    const input = parseApplication(body)
    const ipKey = createHash('sha256').update(clientIp(req.headers)).digest('hex').slice(0, 24)
    if (!(await consumeRateLimit(`dealer-apply:${ipKey}`, 5, 3600))) {
      throw new DealerError('Çok fazla deneme. Biraz sonra tekrar dene ya da WhatsApp’tan yaz.')
    }
    const user = await getAuthenticatedUser(req).catch(() => null)
    const id = await saveApplication(input, user && user.email.toLowerCase() === input.email ? user.id : null)
    trackConversion(req, 'dealer_apply', { path: '/bayilik', props: { type: input.businessType, interests: input.interests.join(',') } })

    if (!/\.(invalid|example|test)$/i.test(input.email)) {
      after(async () => {
        const interests = input.interests.map((x) => (x === 'dpp' ? 'DPP' : 'Ürünler')).join(' + ')
        const text = [
          '🤝 Yeni bayilik başvurusu',
          `Firma: ${input.company} (${input.businessType})`,
          `Yetkili: ${input.contactName} · ${input.phone} · ${input.email}`,
          `Şehir: ${input.city}${input.district ? ` / ${input.district}` : ''}`,
          `Vergi: ${input.taxOffice} · ${input.taxNo}`,
          `İlgi: ${interests}${input.expectedMonthly ? ` · aylık ~${input.expectedMonthly} adet` : ''}`,
          input.message ? `Not: ${input.message}` : '',
          'Yönetim: https://www.qrnot.com/admin?tab=dealers',
        ]
          .filter(Boolean)
          .join('\n')
        const target = String(process.env.LEAD_NOTIFY_WHATSAPP || process.env.SHOP_NOTIFY_WHATSAPP || process.env.WHATSAPP_TO_NUMBER || '').trim()
        await notifyAdmin({
          title: `🤝 Bayilik başvurusu: ${input.company}`,
          body: `${input.contactName} · ${input.city} · ${interests}`,
          url: '/admin?tab=dealers',
          whatsappText: text,
          whatsappTo: target || undefined,
        }).catch((e) => console.error('[dealer apply notify]', e))
        await sendMail({ to: adminEmails(), subject: `Bayilik başvurusu: ${input.company}`, text, replyTo: input.email }).catch(() => null)
        await sendMail({
          to: input.email,
          replyTo: adminEmails()[0],
          subject: 'QRNot bayilik başvurun bize ulaştı',
          text: [
            `Merhaba ${input.contactName},`,
            '',
            `${input.company} adına yaptığın QRNot bayilik başvurusu bize ulaştı. En geç 2 iş günü içinde inceleyip sana dönüş yapacağız.`,
            '',
            'Onaylandığında bayi paneline bu e-posta adresiyle açtığın QRNot hesabıyla girersin:',
            'www.qrnot.com/bayi',
            '',
            'Henüz QRNot hesabın yoksa şimdiden aynı e-postayla açabilirsin: www.qrnot.com/account',
            '',
            'Sorun olursa bu e-postayı yanıtlaman ya da WhatsApp’tan yazman yeterli: +90 543 392 92 30',
            '',
            'QRNot · SCE Innovation',
          ].join('\n'),
        }).catch(() => null)
      })
    }
    return NextResponse.json({ ok: true, id }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (err instanceof DealerError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error('[dealer apply]', err)
    return NextResponse.json({ error: 'Sunucu hatası. Lütfen tekrar dene.' }, { status: 500 })
  }
}
