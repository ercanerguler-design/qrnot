import type { Metadata } from 'next'
import { WarmPage } from '@/components/warm/SiteChrome'
import { QUOTE_TIERS } from '@/lib/corporateQuoteShared'
import type { Lang } from '@/lib/i18n'
import { getRequestLang } from '@/lib/i18n.server'
import { pageMeta } from '@/lib/seo'
import { whatsappHref } from '@/lib/site'
import QuoteForm from './QuoteForm'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  return pageMeta((await searchParams).lang, '/kurumsal-hediye', {
    tr: {
      title: 'Kurumsal Hediye — Yıl Sonu Personel Hediyesi, Sesli Mesajlı',
      description: 'Çalışanlarınıza sesli teşekkür mesajlı kolye ve anahtarlık. 10+ adette %10, 50+ adette %15, 200+ adette %20 indirim. Logolu kutu, toplu QR kurulumu. Hemen teklif alın.',
    },
    en: {
      title: 'Corporate Gifts — Employee Gifts with a Voice Message',
      description: 'Necklaces and keychains with a recorded thank-you message for your team. 10% off 10+, 15% off 50+, 20% off 200+. Logo boxes and bulk QR setup. Get a quote.',
    },
  })
}

const C = {
  tr: {
    kicker: 'Kurumsal hediye',
    title: 'Çalışanlarınıza sesli bir teşekkür',
    lead: 'Yıl sonu, bayram ya da özel gün hediyesi: her kolye ve anahtarlığın QR’ında yöneticinizin ya da ekibinizin sesli mesajı saklanır. Çalışan telefonuyla okutur, sesi dinler. Uygulama gerekmez.',
    cta: 'Teklif al',
    catalog: 'Kataloğu indir (PDF)',
    catalogHref: '/katalog/kurumsal-hediye-tr.pdf',
    whatsapp: 'WhatsApp’tan sor',
    waMsg: 'Merhaba QRNot, kurumsal hediye için bilgi almak istiyorum.',
    why: [
      ['🎙️', 'Kişisel ses mesajı', 'Genel müdürün teşekkürü ya da ekibin ortak mesajı. Hepsine tek kayıt ya da her çalışana ayrı mesaj.'],
      ['🎁', 'Logolu kutu ve toplu kurulum', 'Kutuları firmanızın logosuyla hazırlarız, QR’ları sizin yerinize kurar, hazır teslim ederiz.'],
      ['♾️', 'Kalıcı bir anı', 'Masada kalan bir eşya değil, her dinlendiğinde aynı duyguyu taşıyan bir hatıra.'],
    ],
    tiersTitle: 'Adet arttıkça indirim artar',
    tiersNote: 'Toplam adede göre; farklı ürünleri birlikte sayarız.',
    tierLabel: (min: number, max: number | null) => (max ? `${min}–${max} adet` : `${min}+ adet`),
    stepsTitle: 'Nasıl çalışır?',
    steps: [
      ['Formu doldurun', 'Ürün ve adedi seçin, tahmini tutarı hemen görün.'],
      ['1 iş gününde teklif', 'Kesin fiyat, kutu ve teslim tarihiyle yazılı teklif göndeririz.'],
      ['%50 peşinatla üretim', 'Onayla birlikte peşinat alınır, üretim başlar.'],
      ['Teslim ve kurulum', 'Hediyeler hazır gelir; kalan tutar teslimde ödenir.'],
    ],
    formTitle: 'Teklif formu',
    formLead: 'Adetleri girin; indirim ve toplam tutar anında hesaplanır.',
  },
  en: {
    kicker: 'Corporate gifts',
    title: 'A thank-you your team can hear',
    lead: 'Year-end, holiday or special-day gifts: each necklace and keychain carries a voice message from your leadership or team in its QR. Employees scan it with their phone and listen. No app needed.',
    cta: 'Get a quote',
    catalog: 'Download the catalog (PDF)',
    catalogHref: '/katalog/kurumsal-hediye-en.pdf',
    whatsapp: 'Ask on WhatsApp',
    waMsg: 'Hello QRNot, I would like information about corporate gifts.',
    why: [
      ['🎙️', 'A personal voice message', 'A thank-you from your CEO or the whole team. One message for all, or a separate one for each employee.'],
      ['🎁', 'Logo boxes and bulk setup', 'We prepare boxes with your logo, set up every QR for you and deliver them ready to give.'],
      ['♾️', 'A lasting memory', 'Not just another desk item: a keepsake that brings back the same feeling every time it is played.'],
    ],
    tiersTitle: 'The more you order, the more you save',
    tiersNote: 'Based on the total quantity; different products count together.',
    tierLabel: (min: number, max: number | null) => (max ? `${min}–${max} pcs` : `${min}+ pcs`),
    stepsTitle: 'How it works',
    steps: [
      ['Fill in the form', 'Choose products and quantities and see the estimate right away.'],
      ['Quote within 1 business day', 'We send a written quote with the final price, packaging and delivery date.'],
      ['Production with a 50% deposit', 'Production starts once the deposit is received.'],
      ['Delivery and setup', 'Gifts arrive ready to give; the balance is paid on delivery.'],
    ],
    formTitle: 'Quote form',
    formLead: 'Enter quantities; the discount and total update instantly.',
  },
}

export default async function CorporateGiftPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = await getRequestLang((await searchParams).lang)
  const c = C[lang]
  const tiers = QUOTE_TIERS.map((tier, i) => ({ ...tier, max: QUOTE_TIERS[i + 1] ? QUOTE_TIERS[i + 1].min - 1 : null }))

  return (
    <WarmPage lang={lang}>
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-10 sm:pt-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">{c.kicker}</p>
        <h1 className="font-display mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{c.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-2">{c.lead}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#teklif" className="w-btn w-btn-primary">
            {c.cta}
          </a>
          <a href={c.catalogHref} target="_blank" rel="noopener" className="w-btn w-btn-ghost">
            {c.catalog}
          </a>
          <a href={whatsappHref(c.waMsg)} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-ghost">
            {c.whatsapp}
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {c.why.map(([icon, title, desc]) => (
            <div key={title} className="w-card p-6">
              <span className="text-3xl" aria-hidden="true">
                {icon}
              </span>
              <h2 className="font-display mt-3 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-ink-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="w-card-soft p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">{c.tiersTitle}</h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {tiers.map((tier) => (
                <div key={tier.min} className="rounded-2xl border border-line bg-paper p-4 text-center">
                  <p className="font-display text-3xl font-semibold text-coral-2">%{Math.round(tier.rate * 100)}</p>
                  <p className="mt-1 text-sm text-ink-2">{c.tierLabel(tier.min, tier.max)}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">{c.tiersNote}</p>
          </div>
          <div className="w-card p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">{c.stepsTitle}</h2>
            <ol className="mt-5 space-y-4">
              {c.steps.map(([title, desc], i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">{i + 1}</span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-sm text-ink-2">{desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="teklif" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 pt-8">
        <h2 className="font-display text-3xl font-semibold">{c.formTitle}</h2>
        <p className="mt-2 text-ink-2">{c.formLead}</p>
        <div className="mt-6">
          <QuoteForm lang={lang} />
        </div>
      </section>
    </WarmPage>
  )
}
