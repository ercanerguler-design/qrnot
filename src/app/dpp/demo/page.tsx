import type { Metadata } from 'next'
import Link from 'next/link'
import { WarmPage } from '@/components/warm/SiteChrome'
import { getRequestLang } from '@/lib/i18n.server'
import { withLang, type Lang } from '@/lib/i18n'
import DemoForm from './DemoForm'

// Ücretsiz demo talebi: form doldurulunca kısıtlı bir demo firması ve yönetici hesabı anında açılır.

export const metadata: Metadata = {
  title: 'Ücretsiz DPP demosu — QRNot',
  description: 'QRNot Dijital Ürün Pasaportu panelini 14 gün ücretsiz deneyin: 3 ürün, 100 seri numarası, tedarikçi portalı ve 8 dil; tüm özellikler gerçek çalışır.',
  alternates: { canonical: '/dpp/demo', languages: { 'tr-TR': '/dpp/demo', 'en-US': '/dpp/demo?lang=en' } },
}

const C: Record<Lang, { back: string; kicker: string; title: string; lead: string; includes: string; items: string[]; note: string }> = {
  tr: {
    back: '← Dijital Ürün Pasaportu',
    kicker: 'Ücretsiz demo · 14 gün',
    title: 'Paneli kendi ürününüzle deneyin.',
    lead: 'Formu doldurun, demo hesabınız hemen açılsın. Tüm özellikler gerçek çalışır; sadece sayılar sınırlıdır.',
    includes: 'Demoda neler var?',
    items: [
      '3 ürün pasaportu, 8 dilde yayın',
      '100 seri numarası ve QR etiket baskısı',
      '3 tedarikçi bilgi talebi (tedarikçi portalı)',
      'Karbon tahmini yardımcısı, belgeler, sürüm geçmişi',
      '2 kullanıcı (ekip arkadaşınızı ekleyin)',
    ],
    note: 'Demo pasaportlarında “demo” notu görünür. 14 gün sonunda hesap kapanır, verileriniz silinmez; ücretli pakete geçerseniz kaldığınız yerden devam edersiniz.',
  },
  en: {
    back: '← Digital Product Passport',
    kicker: 'Free demo · 14 days',
    title: 'Try the panel with your own product.',
    lead: 'Fill in the form and your demo account opens instantly. Every feature works for real; only the numbers are limited.',
    includes: 'What’s in the demo?',
    items: [
      '3 product passports, published in 8 languages',
      '100 serial numbers and QR label printing',
      '3 supplier data requests (supplier portal)',
      'Carbon estimate helper, documents, version history',
      '2 users (invite a colleague)',
    ],
    note: 'Demo passports show a “demo” notice. After 14 days the account closes and your data is kept; upgrade to a paid plan to continue where you left off.',
  },
}

export default async function DppDemoPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = await getRequestLang((await searchParams).lang)
  const c = C[lang]
  return (
    <WarmPage lang={lang}>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-12 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
        <div>
          <Link href={withLang('/dpp', lang)} className="text-sm text-ink-2 hover:underline">
            {c.back}
          </Link>
          <div className="mt-6">
            <span className="w-chip">🧪 {c.kicker}</span>
          </div>
          <h1 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{c.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">{c.lead}</p>
          <div className="w-card mt-8 p-6">
            <h2 className="font-semibold">{c.includes}</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-2">
              {c.items.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-coral">✓</span>
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">{c.note}</p>
          </div>
        </div>
        <DemoForm lang={lang} />
      </section>
    </WarmPage>
  )
}
