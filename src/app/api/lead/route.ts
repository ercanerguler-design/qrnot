import { createHash } from 'crypto'
import { NextRequest, NextResponse, after } from 'next/server'
import { notifyAdmin } from '@/lib/adminNotify'
import { sourceSummary, trackConversion } from '@/lib/analytics'
import { parseLeadInput, QuoteError, saveLead } from '@/lib/corporateQuote'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { describeLeadDetails, LEAD_TOPICS, topicLabel } from '@/lib/leadTopics'
import { adminEmails, sendMail } from '@/lib/mail'

// /teklif?konu=… formu (DPP, otel, eğitim, sağlık, fabrika, perakende, lojistik, pazaryeri, genel kurumsal).
// Talebi kaydeder, yöneticiye anında haber verir (push + WhatsApp + e-posta), müşteriye onay e-postası gönderir.

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const lang = body.lang === 'en' ? 'en' : 'tr'
  try {
    const input = parseLeadInput(body, lang)
    const ipKey = createHash('sha256').update(clientIp(req.headers)).digest('hex').slice(0, 24)
    if (!(await consumeRateLimit(`lead:${ipKey}`, 5, 3600))) {
      throw new QuoteError(lang === 'en' ? 'Too many requests. Please try again later or message us on WhatsApp.' : 'Çok fazla deneme. Biraz sonra tekrar dene ya da WhatsApp’tan yaz.')
    }
    const headers = new Headers(req.headers)
    const source = await sourceSummary(headers).catch(() => '')
    const { id } = await saveLead(input, source)
    trackConversion(req, 'lead', { path: `/teklif?konu=${input.topic}`, props: { topic: input.topic } })

    if (!/\.(invalid|example|test)$/i.test(input.email)) {
      after(async () => {
        const label = topicLabel(input.topic)
        const details = describeLeadDetails(input.topic, input.details)
        const text = [
          `${label}: yeni talep`,
          `Firma: ${input.company}`,
          `Kişi: ${input.name} · ${input.phone} · ${input.email}`,
          ...details.map((d) => `• ${d}`),
          input.message ? `Not: ${input.message}` : '',
          `Kaynak: ${source || '-'}`,
          'Yönetim: https://www.qrnot.com/admin?tab=quotes',
        ]
          .filter(Boolean)
          .join('\n')
        const target = String(process.env.LEAD_NOTIFY_WHATSAPP || process.env.SHOP_NOTIFY_WHATSAPP || process.env.WHATSAPP_TO_NUMBER || '').trim()
        const res = await notifyAdmin({
          title: `${LEAD_TOPICS[input.topic].icon} Teklif talebi: ${input.company}`,
          body: [`${input.name} · ${input.phone}`, ...details.slice(0, 3)].join('\n'),
          url: '/admin?tab=quotes',
          whatsappText: text,
          whatsappTo: target || undefined,
        })
        const adminMail = await sendMail({ to: adminEmails(), subject: `${label.replace(/^\S+\s/, '')}: ${input.company}`, text, replyTo: input.email })

        const en = input.lang === 'en'
        await sendMail({
          to: input.email,
          replyTo: adminEmails()[0],
          subject: en ? 'We received your QRNot request' : 'QRNot talebin bize ulaştı',
          text: [
            en ? `Hello ${input.name},` : `Merhaba ${input.name},`,
            '',
            en
              ? `Thank you for your request about "${LEAD_TOPICS[input.topic].title.en}". We will get back to you within 1 business day.`
              : `“${LEAD_TOPICS[input.topic].title.tr}” talebin için teşekkürler. En geç 1 iş günü içinde sana dönüş yapacağız.`,
            '',
            ...describeLeadDetails(input.topic, input.details, input.lang).map((d) => `• ${d}`),
            '',
            en ? 'Questions? Just reply to this email or message us on WhatsApp: +90 543 392 92 30' : 'Sorun olursa bu e-postayı yanıtlaman ya da WhatsApp’tan yazman yeterli: +90 543 392 92 30',
            '',
            'QRNot · www.qrnot.com',
          ].join('\n'),
        })
        if (!res.push && res.whatsapp !== 'sent' && adminMail.status !== 'sent') console.error('[lead notify] hiçbir kanaldan gönderilemedi', res, adminMail)
      })
    }

    return NextResponse.json({ ok: true, id }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (err instanceof QuoteError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error('[lead]', err)
    return NextResponse.json({ error: lang === 'en' ? 'Something went wrong. Please message us on WhatsApp.' : 'Bir sorun oluştu. Lütfen WhatsApp’tan yaz.' }, { status: 500 })
  }
}
