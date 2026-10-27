import type { Metadata } from 'next'
import Link from 'next/link'
import { WarmPage } from '@/components/warm/SiteChrome'
import { withLang, type Lang } from '@/lib/i18n'
import { getRequestLang } from '@/lib/i18n.server'
import { isLeadTopic, LEAD_TOPICS, type LeadTopic } from '@/lib/leadTopics'
import { pageMeta } from '@/lib/seo'
import { whatsappHref } from '@/lib/site'
import LeadForm from './LeadForm'

type Search = Promise<{ lang?: string; konu?: string; [key: string]: string | undefined }>

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const params = await searchParams
  const topic = isLeadTopic(params.konu) ? (LEAD_TOPICS[params.konu] as LeadTopic) : null
  return {
    ...(await pageMeta(params.lang, '/teklif', {
      tr: { title: topic ? topic.title.tr : 'Teklif al', description: topic ? topic.lead.tr : 'QRNot kurumsal çözümleri için teklif formu: DPP, otel, eğitim, sağlık, fabrika, perakende, lojistik ve kurumsal hediye.' },
      en: { title: topic ? topic.title.en : 'Get a quote', description: topic ? topic.lead.en : 'Quote form for QRNot business solutions: DPP, hotels, education, healthcare, manufacturing, retail, logistics and corporate gifts.' },
    })),
    robots: { index: false, follow: true },
  }
}

const C = {
  tr: {
    kicker: 'Teklif formu',
    chooseTitle: 'Ne için teklif almak istersiniz?',
    chooseLead: 'Konuyu seçin; size uygun soruları soralım. En geç 1 iş günü içinde dönüş yaparız.',
    gift: { icon: '🎁', title: 'Kurumsal hediye', lead: 'Personel hediyesi: kolye ve anahtarlıkta sesli mesaj, adetle artan indirim.' },
    other: 'Başka bir konu',
    whatsapp: 'Formla uğraşmak istemiyorsan WhatsApp’tan da yazabilirsin',
    waMsg: 'Merhaba QRNot, teklif almak istiyorum.',
  },
  en: {
    kicker: 'Quote form',
    chooseTitle: 'What would you like a quote for?',
    chooseLead: 'Choose a topic and we will ask the right questions. We reply within 1 business day.',
    gift: { icon: '🎁', title: 'Corporate gifts', lead: 'Employee gifts: voice messages in necklaces and keychains, volume discounts.' },
    other: 'Another topic',
    whatsapp: 'Prefer chatting? You can also message us on WhatsApp',
    waMsg: 'Hello QRNot, I would like a quote.',
  },
}

export default async function QuotePage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams
  const lang: Lang = await getRequestLang(params.lang)
  const c = C[lang]
  const topicKey = isLeadTopic(params.konu) ? params.konu : null
  const preset: Record<string, string> = {}
  if (topicKey) {
    for (const f of (LEAD_TOPICS[topicKey] as LeadTopic).fields) {
      const value = params[f.key]
      if (typeof value === 'string' && value.length <= 80) preset[f.key] = value
    }
  }

  return (
    <WarmPage lang={lang}>
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
        {topicKey ? (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">
              {c.kicker} ·{' '}
              <Link href={withLang('/teklif', lang)} className="hover:underline">
                {c.other}
              </Link>
            </p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-tight">
              <span aria-hidden="true">{LEAD_TOPICS[topicKey].icon}</span> {LEAD_TOPICS[topicKey].title[lang]}
            </h1>
            <p className="mt-3 text-lg text-ink-2">{LEAD_TOPICS[topicKey].lead[lang]}</p>
            <div className="mt-8">
              <LeadForm lang={lang} topic={topicKey} preset={preset} />
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">{c.kicker}</p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-tight">{c.chooseTitle}</h1>
            <p className="mt-3 text-lg text-ink-2">{c.chooseLead}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link href={withLang('/kurumsal-hediye', lang)} className="w-card flex gap-4 p-5 transition hover:border-coral">
                <span className="text-3xl" aria-hidden="true">
                  {c.gift.icon}
                </span>
                <span>
                  <span className="block font-semibold">{c.gift.title}</span>
                  <span className="mt-1 block text-sm text-ink-2">{c.gift.lead}</span>
                </span>
              </Link>
              {Object.entries(LEAD_TOPICS).map(([key, topic]) => (
                <Link key={key} href={withLang(`/teklif?konu=${key}`, lang)} className="w-card flex gap-4 p-5 transition hover:border-coral">
                  <span className="text-3xl" aria-hidden="true">
                    {topic.icon}
                  </span>
                  <span>
                    <span className="block font-semibold">{topic.title[lang]}</span>
                    <span className="mt-1 block text-sm text-ink-2">{topic.lead[lang]}</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
        <p className="mt-10 text-sm text-muted">
          {c.whatsapp}:{' '}
          <a href={whatsappHref(c.waMsg)} target="_blank" rel="noopener noreferrer" className="w-link">
            +90 543 392 92 30
          </a>
        </p>
      </section>
    </WarmPage>
  )
}
