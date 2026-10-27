import { createHash } from 'crypto'
import { NextRequest, NextResponse, after } from 'next/server'
import { notifyAdmin } from '@/lib/adminNotify'
import { sourceSummary, trackConversion } from '@/lib/analytics'
import { parseQuoteInput, QuoteError, saveQuote } from '@/lib/corporateQuote'
import { formatMoney, PRODUCTS } from '@/lib/commerce/catalog'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { adminEmails, sendMail } from '@/lib/mail'

// /kurumsal-hediye formu: talebi kaydeder, yöneticiye anında haber verir (telefona push + ayarlıysa WhatsApp).
// IP saklanmaz; kötüye kullanım sınırı için kısa ömürlü özeti kullanılır.

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const lang = body.lang === 'en' ? 'en' : 'tr'
  try {
    // Önce doğrula: yazım hatası düzelten kişi sınıra takılmasın; sadece geçerli talepler sayılır
    const input = parseQuoteInput(body, lang)
    const ipKey = createHash('sha256').update(clientIp(req.headers)).digest('hex').slice(0, 24)
    if (!(await consumeRateLimit(`corporate-quote:${ipKey}`, 5, 3600))) {
      throw new QuoteError(lang === 'en' ? 'Too many requests. Please try again later or message us on WhatsApp.' : 'Çok fazla deneme. Biraz sonra tekrar dene ya da WhatsApp’tan yaz.')
    }

    const headers = new Headers(req.headers)
    const source = await sourceSummary(headers).catch(() => '')
    const { id, estimate } = await saveQuote(input, source)
    // Tahmini tutar satış değildir: gelir olarak değil, ayrıntı olarak kaydedilir
    trackConversion(req, 'corporate_quote', { path: '/kurumsal-hediye', props: { qty: estimate.totalQty, estimate_try: estimate.total / 100 } })

    // Test adresleri (.invalid / .example / .test) bildirim göndermez
    if (!/\.(invalid|example|test)$/i.test(input.email)) {
      after(async () => {
        const lines = estimate.lines.map((line) => `• ${PRODUCTS.find((p) => p.id === line.id)?.name.tr || line.id}: ${line.qty} adet`)
        const total = formatMoney(estimate.total, 'TRY')
        const text = [
          '🎁 Yeni kurumsal hediye talebi',
          `Firma: ${input.company}`,
          `Kişi: ${input.name} · ${input.phone} · ${input.email}`,
          ...lines,
          `Toplam ${estimate.totalQty} adet · %${Math.round(estimate.rate * 100)} indirim · tahmini ${total} (KDV dahil)`,
          input.logoBox ? 'Logolu kutu istiyor' : '',
          input.neededBy ? `Teslim: ${input.neededBy}` : '',
          input.message ? `Not: ${input.message}` : '',
          `Kaynak: ${source || '-'}`,
          'Yönetim: https://www.qrnot.com/admin?tab=quotes',
        ]
          .filter(Boolean)
          .join('\n')
        const target = String(process.env.LEAD_NOTIFY_WHATSAPP || process.env.SHOP_NOTIFY_WHATSAPP || process.env.WHATSAPP_TO_NUMBER || '').trim()
        const res = await notifyAdmin({
          title: `🎁 Kurumsal talep: ${input.company}`,
          body: [`${input.name} · ${input.phone}`, `${estimate.totalQty} adet · tahmini ${total}`].join('\n'),
          url: '/admin?tab=quotes',
          whatsappText: text,
          whatsappTo: target || undefined,
        })
        // E-posta (Resend ayarlıysa): yöneticiye talep ayrıntısı, müşteriye onay. Cevapla → doğrudan müşteriye gider.
        const adminMail = await sendMail({ to: adminEmails(), subject: `Kurumsal hediye talebi: ${input.company} (${estimate.totalQty} adet)`, text, replyTo: input.email })
        const en = input.lang === 'en'
        const productLines = estimate.lines.map((line) => `• ${PRODUCTS.find((p) => p.id === line.id)?.name[input.lang] || line.id}: ${line.qty}`)
        await sendMail({
          to: input.email,
          replyTo: adminEmails()[0],
          subject: en ? 'We received your QRNot corporate gift request' : 'QRNot kurumsal hediye talebin bize ulaştı',
          text: [
            en ? `Hello ${input.name},` : `Merhaba ${input.name},`,
            '',
            en
              ? 'Thank you for your request. We will send you a written quote within 1 business day.'
              : 'Talebin için teşekkürler. En geç 1 iş günü içinde sana yazılı teklif göndereceğiz.',
            '',
            ...productLines,
            en
              ? `Total ${estimate.totalQty} pcs · ${Math.round(estimate.rate * 100)}% volume discount · estimated ${total} (incl. VAT)`
              : `Toplam ${estimate.totalQty} adet · %${Math.round(estimate.rate * 100)} adet indirimi · tahmini ${total} (KDV dahil)`,
            en ? 'The final price, shipping and logo box costs are confirmed in the quote.' : 'Kesin fiyat, kargo ve logolu kutu ücreti teklifte netleşir.',
            '',
            en ? 'Questions? Just reply to this email or message us on WhatsApp: +90 543 392 92 30' : 'Sorun olursa bu e-postayı yanıtlaman ya da WhatsApp’tan yazman yeterli: +90 543 392 92 30',
            '',
            'QRNot · www.qrnot.com',
          ].join('\n'),
        })
        if (!res.push && res.whatsapp !== 'sent' && adminMail.status !== 'sent') console.error('[corporate-quote notify] hiçbir kanaldan gönderilemedi', res, adminMail)
      })
    }

    return NextResponse.json({ ok: true, id }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (err instanceof QuoteError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error('[corporate-quote]', err)
    return NextResponse.json(
      { error: lang === 'en' ? 'Something went wrong. Please message us on WhatsApp.' : 'Bir sorun oluştu. Lütfen WhatsApp’tan yaz.' },
      { status: 500 }
    )
  }
}
