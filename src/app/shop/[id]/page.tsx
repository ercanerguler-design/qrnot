import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductCard from '@/components/warm/ProductCard'
import { WarmPage } from '@/components/warm/SiteChrome'
import { currencyForLang, formatMoney, getProduct, PRODUCTS } from '@/lib/commerce/catalog'
import { getRequestLang } from '@/lib/i18n.server'
import { withLang } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'
import ProductBuyBox from './AddToCart'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const product = getProduct((await params).id)
  if (!product) return {}
  const lang = await getRequestLang((await searchParams).lang)
  return {
    title: product.name[lang],
    description: product.description[lang].slice(0, 160),
    alternates: { canonical: `/shop/${product.id}`, languages: { 'tr-TR': `/shop/${product.id}`, 'en-US': `/shop/${product.id}?lang=en` } },
    openGraph: { title: product.name[lang], description: product.tagline[lang], type: 'website' },
  }
}

const T = {
  tr: {
    back: '← Tüm ürünler',
    how: 'Nasıl çalışır?',
    steps: [
      'Siparişin hediye kutusunda kapına gelir.',
      "QR'ı okut (ya da NFC'ye dokun), sesini, videonu ya da fotoğraflarını ekle.",
      'Hediyeni ver. Okutan herkes içeriğini görür; sen sonradan güncelleyebilirsin.',
    ],
    digitalSteps: ['Ödeme sonrası hesabına anında tanımlanır.', "Hesabından QR'ını oluştur ve indir.", 'İçeriğini ekle, paylaş ya da bas.'],
    shipping: '1-3 iş gününde kargoda. Kargo alıcı ödemelidir (teslimatta ödenir).',
    digitalNote: 'Dijital ürün — kargo yok, giriş yapmış hesabına tanımlanır.',
    related: 'Bunlar da ilgini çekebilir',
    noApp: 'Uygulama gerekmez · iPhone ve Android uyumlu',
  },
  en: {
    back: '← All products',
    how: 'How it works',
    steps: [
      'Your order arrives gift-boxed at your door.',
      'Scan the QR (or tap NFC) and add your voice, video or photos.',
      'Give your gift. Anyone who scans sees your content; you can update it later.',
    ],
    digitalSteps: ['Added to your account right after payment.', 'Create and download your QR from your account.', 'Add your content, share it or print it.'],
    shipping: 'Ships in 1-3 business days. Shipping is paid by the recipient on delivery.',
    digitalNote: 'Digital product — no shipping, added to your signed-in account.',
    related: 'You might also like',
    noApp: 'No app needed · Works on iPhone & Android',
  },
}

export default async function ProductPage({ params, searchParams }: Props) {
  const product = getProduct((await params).id)
  if (!product) notFound()
  const lang = await getRequestLang((await searchParams).lang)
  const t = T[lang]
  const currency = currencyForLang(lang)
  const price = product.price[currency]
  const compareAt = product.compareAt?.[currency]
  const related = PRODUCTS.filter((p) => p.id !== product.id && p.kind !== product.kind).slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[lang],
    description: product.description[lang],
    brand: { '@type': 'Brand', name: 'QRNot' },
    sku: product.id,
    url: `${SITE_URL}/shop/${product.id}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: (price / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/shop/${product.id}`,
    },
  }

  return (
    <WarmPage lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href={withLang('/shop', lang)} className="text-sm text-muted hover:text-ink">
          {t.back}
        </Link>
        <ProductBuyBox
          product={product}
          lang={lang}
          header={
            <>
              <div>
                {product.badge && <span className="w-chip">{product.badge[lang]}</span>}
                <h1 className="font-display mt-3 text-4xl font-semibold">{product.name[lang]}</h1>
                <p className="mt-2 text-lg text-ink-2">{product.tagline[lang]}</p>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-bold">{formatMoney(price, currency)}</span>
                  {compareAt && compareAt > price && <span className="text-lg text-muted line-through">{formatMoney(compareAt, currency)}</span>}
                </div>
                <p className="mt-1 text-sm text-muted">{t.noApp}</p>
              </div>
            </>
          }
          footer={
            <>
              <p className="rounded-2xl bg-cream-2 px-4 py-3 text-sm text-ink-2">{product.physical ? `🚚 ${t.shipping}` : `⚡ ${t.digitalNote}`}</p>

              <div>
                <p className="leading-relaxed text-ink-2">{product.description[lang]}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {product.features[lang].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink">
                      <span className="mt-0.5 text-sage">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-card p-5">
                <h2 className="font-display text-lg font-semibold">{t.how}</h2>
                <ol className="mt-3 space-y-3">
                  {(product.physical ? t.steps : t.digitalSteps).map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm text-ink-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-soft text-xs font-bold text-coral-2">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          }
        />

        <section className="mt-16">
          <h2 className="font-display mb-5 text-2xl font-semibold">{t.related}</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} lang={lang} />
            ))}
          </div>
        </section>
      </div>
    </WarmPage>
  )
}
