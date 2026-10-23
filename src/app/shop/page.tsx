import type { Metadata } from 'next'
import ProductCard from '@/components/warm/ProductCard'
import { WarmPage } from '@/components/warm/SiteChrome'
import { PRODUCTS } from '@/lib/commerce/catalog'
import { getRequestLang } from '@/lib/i18n.server'
import { pageMeta } from '@/lib/seo'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  return pageMeta((await searchParams).lang, "/shop", {
    tr: { title: "Sesli Kolye, Sesli Anahtarlık ve Anı Defteri", description: "QR ve NFC'li sesli kolye, sesli anahtarlık ve dijital anı defteri. Sevdiklerine sesini hediye et." },
    en: { title: "Voice Message Necklace, Keychain & Audio Guestbook", description: "QR and NFC voice message necklaces, voice keychains and a digital audio guestbook. Gift your voice to the people you love." },
  })
}

const T = {
  tr: {
    kicker: 'Mağaza',
    title: 'Sesini taşıyan hediyeler',
    desc: 'Her ürün kendine ait kalıcı bir QR (ve NFC modellerde çip) ile gelir. İçeriği sen eklersin, sonradan güncelleyebilirsin (3 kayıt dahil).',
    physical: 'Takı ve aksesuar',
    digital: 'Dijital ürünler',
    trust: ['🚚 1-3 iş gününde kargoda', '🎁 Hediye kutusunda', '🔒 iyzico güvenli ödeme', '↩️ 14 gün iade'],
  },
  en: {
    kicker: 'Shop',
    title: 'Gifts that carry your voice',
    desc: 'Every product comes with its own permanent QR (and an NFC chip on NFC models). You add the content and can update it later (3 recordings included).',
    physical: 'Jewelry & accessories',
    digital: 'Digital products',
    trust: ['🌍 Worldwide delivery', '🎁 Gift-ready packaging', '🔒 Secure Stripe checkout', '↩️ 14-day returns'],
  },
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getRequestLang((await searchParams).lang)
  const t = T[lang]
  const physical = PRODUCTS.filter((p) => p.physical)
  const digital = PRODUCTS.filter((p) => !p.physical)

  return (
    <WarmPage lang={lang}>
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-12">
        <span className="w-chip">{t.kicker}</span>
        <h1 className="font-display mt-3 text-4xl font-semibold sm:text-5xl">{t.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-2">{t.desc}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {t.trust.map((item) => (
            <span key={item} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink-2">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display mb-5 text-2xl font-semibold">{t.physical}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {physical.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display mb-5 text-2xl font-semibold">{t.digital}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {digital.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>
    </WarmPage>
  )
}
