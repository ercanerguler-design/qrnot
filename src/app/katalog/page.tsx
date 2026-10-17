import type { Metadata } from 'next'
import Link from 'next/link'
import { WarmPage } from '@/components/warm/SiteChrome'
import { withLang, type Lang } from '@/lib/i18n'
import { getRequestLang } from '@/lib/i18n.server'
import { MARKETPLACES, whatsappHref } from '@/lib/site'
import { CatalogImageButton, type CatalogImage } from './CatalogGallery'

export const metadata: Metadata = {
  title: 'Ürün Kataloğu — Neon QR Anahtarlık, Sticker ve Kolye',
  description:
    'QRNot neon QR koleksiyonu: sesli mesajlı anahtarlık, yuvarlak / kare / dik dörtgen QR sticker modelleri, kolye ve dijital ürünler. Uygulama gerekmez.',
  alternates: { canonical: '/katalog', languages: { 'tr-TR': '/katalog', 'en-US': '/katalog?lang=en' } },
}

// Tüm katalog görselleri (lightbox bu sırayla gezinir)
const IMAGES: Record<string, CatalogImage> = {
  anahtarlik: { src: '/katalog/neon-anahtarlik-tr.webp', width: 1254, height: 1254, alt: 'QRNot neon QR anahtarlık — ses, video, fotoğraf, müzik ve link tek QR’da' },
  bag: { src: '/katalog/neon-anahtarlik-sticker.webp', width: 1536, height: 1024, alt: 'Bir QR. Bir ses. Bir bağ. — Classic QR anahtarlık ve sticker modelleri' },
  sticker: { src: '/katalog/neon-sticker-modelleri.webp', width: 1402, height: 1122, alt: 'QRNot neon sticker ürünler — telefon, laptop, anahtarlık ve hediye' },
  koleksiyon: { src: '/katalog/neon-koleksiyon-en.webp', width: 1024, height: 1536, alt: 'QRNot neon kolye ve anahtarlık — evcil hayvan, çocuk, büyükler ve sevdikleriniz için' },
  dijitalProfil: { src: '/katalog/dijital-profil-en.webp', width: 1024, height: 1536, alt: 'QRNot dijital ürün — tek QR’da ses, video, fotoğraf, YouTube, Spotify ve link' },
  dijitalOzellik: { src: '/katalog/dijital-ozellikler-en.webp', width: 1254, height: 1254, alt: 'QRNot dijital ürün özellikleri ve kurumsal çözümler' },
}
const ORDER = ['anahtarlik', 'bag', 'sticker', 'koleksiyon', 'dijitalProfil', 'dijitalOzellik'] as const
const ALL = ORDER.map((key) => IMAGES[key])
const idx = (key: (typeof ORDER)[number]) => ORDER.indexOf(key)

const T = {
  tr: {
    kicker: 'Ürün kataloğu · 2026',
    title: 'Neon QR koleksiyonu',
    desc: 'Anahtarlık, sticker ve kolye modellerimiz. Her ürün kendine ait bir QR kodla gelir; okutan kişi sesini duyar, videonu izler, fotoğraflarına bakar. Uygulama gerekmez.',
    order: 'Sipariş ver',
    quote: 'Toplu / kurumsal teklif',
    quoteMsg: 'Merhaba QRNot, katalogdaki ürünler için toplu sipariş / teklif almak istiyorum.',
    s1Kicker: 'Koleksiyon',
    s1Title: 'Anahtarlık ve sticker modelleri',
    s1Desc: 'Neon çerçeveli, siyah zeminli QR tasarımları. Anahtarlığa takılır, telefona, laptopa ya da hediye paketine yapıştırılır.',
    models: 'Modeller',
    modelList: [
      ['Classic QR anahtarlık', 'Yuvarlak, anahtarlık halkalı'],
      ['Yuvarlak sticker', 'Hediye paketi, kutu, defter'],
      ['Kare sticker', 'Telefon ve laptop arkası'],
      ['Dik dörtgen sticker', 'Telefon kılıfı, kart, etiket'],
    ],
    c1Title: 'Tek QR, tüm paylaşımın',
    c1Desc: 'Ses kaydı, fotoğraf, video, Spotify, YouTube, link ve acil durum iletişim bilgisi — hepsi tek bir QR sayfasında.',
    c2Title: 'Bir QR. Bir ses. Bir bağ.',
    c2Desc: 'Classic QR anahtarlık ve üç sticker modeli. Kaybolan eşyanı bulan kişi sana ulaşabilir, hediyende sesin kalır.',
    c3Title: 'Sticker ürünler',
    c3Desc: 'Telefon, laptop, anahtarlık ve hediye için neon QR sticker’lar. Yapıştır, okut, dinle.',
    s2Kicker: 'Kimin için?',
    s2Title: 'Sevdiklerin, eşyaların, dostların',
    s2Desc: 'Evcil hayvan künyesi, çocuğun çantası, büyüklerin için acil durum bilgisi, sevdiklerine hediye ya da ürünlerin için kullanım kılavuzu.',
    uses: ['🐾 Evcil hayvan künyesi', '🎒 Çocuk çantası', '👵 Büyükler için acil durum', '🎁 Sevdiklerine hediye', '📦 Ürün bilgisi ve kılavuz'],
    s3Kicker: 'Yurt dışı',
    s3Title: 'Dijital ürünler — Etsy',
    s3Desc: 'Yurt dışındaki müşteriler için İngilizce dijital ürünler. Fiziksel gönderim yoktur: alıcı QR’ını kendi kartına, etiketine ya da ürününe basar.',
    etsyCta: 'Etsy mağazasına git',
    factsTitle: 'Bilmen gerekenler',
    facts: [
      'Uygulama gerekmez — iPhone ve Android kamerasıyla açılır',
      'QR, satın alanın hesabına bağlanır; başkası değiştiremez',
      'Ses ve video kaydı 2 dakikaya kadar (kurumsalda 10 dakika)',
      '3 içerik kaydı dahil; isim, telefon ve adres sınırsız güncellenir',
    ],
    storesTitle: 'Nereden alırım?',
    site: 'qrnot.com mağazası',
    note: 'Görseller tanıtım amaçlıdır; renk tonu ve ölçüler ürüne göre farklılık gösterebilir.',
  },
  en: {
    kicker: 'Product catalog · 2026',
    title: 'Neon QR collection',
    desc: 'Our keychains, stickers and necklaces. Every product comes with its own QR code — whoever scans it hears your voice, watches your video and sees your photos. No app needed.',
    order: 'Order now',
    quote: 'Bulk / business quote',
    quoteMsg: 'Hello QRNot, I would like a bulk order / quote for the catalog products.',
    s1Kicker: 'Collection',
    s1Title: 'Keychain and sticker models',
    s1Desc: 'Black QR designs with a neon frame. Attach to your keys or stick on a phone, laptop or gift box.',
    models: 'Models',
    modelList: [
      ['Classic QR keychain', 'Round, with key ring'],
      ['Round sticker', 'Gift wrap, boxes, notebooks'],
      ['Square sticker', 'Phone and laptop backs'],
      ['Rectangle sticker', 'Phone cases, cards, labels'],
    ],
    c1Title: 'One QR for everything you share',
    c1Desc: 'Voice, photos, video, Spotify, YouTube, links and emergency contact info — all on one QR page.',
    c2Title: 'One QR. One voice. One bond.',
    c2Desc: 'The classic QR keychain and three sticker models. Whoever finds your lost item can reach you; your gift keeps your voice.',
    c3Title: 'Sticker products',
    c3Desc: 'Neon QR stickers for phones, laptops, keys and gifts. Stick, scan, listen.',
    s2Kicker: 'Who is it for?',
    s2Title: 'Loved ones, belongings and pets',
    s2Desc: 'Pet ID tags, your child’s backpack, emergency info for older adults, gifts for loved ones or user guides for your products.',
    uses: ['🐾 Pet ID tag', '🎒 Kids’ backpack', '👵 Emergency info', '🎁 Gifts', '📦 Product info & guides'],
    s3Kicker: 'Worldwide',
    s3Title: 'Digital products — Etsy',
    s3Desc: 'Digital products in English for customers worldwide. Nothing is shipped: buyers print their QR on their own card, tag or product.',
    etsyCta: 'Visit our Etsy shop',
    factsTitle: 'Good to know',
    facts: [
      'No app needed — opens with any iPhone or Android camera',
      'Your QR is linked to your account; no one else can change it',
      'Voice and video up to 2 minutes (10 minutes for business)',
      '3 recordings included; name, phone and address can be edited without limit',
    ],
    storesTitle: 'Where to buy',
    site: 'qrnot.com shop',
    note: 'Images are for illustration; colour tones and sizes may vary by product.',
  },
}

function Section({ kicker, title, desc, children }: { kicker: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff5fb8]">{kicker}</p>
      <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/70">{desc}</p>
      <div className="mt-10">{children}</div>
    </section>
  )
}

function Caption({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-white/65">{desc}</p>
    </div>
  )
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = await getRequestLang((await searchParams).lang)
  const t = T[lang]
  const etsy = MARKETPLACES.find((m) => m.id === 'etsy')!

  return (
    <WarmPage lang={lang}>
      <div className="relative overflow-hidden bg-[#07070f] text-white">
        {/* Neon arka plan */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-[#ff1f8f]/20 blur-[120px]" />
          <div className="absolute -right-40 top-[480px] h-[560px] w-[560px] rounded-full bg-[#2f6bff]/20 blur-[130px]" />
          <div className="absolute left-1/3 top-[1800px] h-[520px] w-[520px] rounded-full bg-[#a03bff]/15 blur-[130px]" />
        </div>

        <div className="relative">
          {/* HERO */}
          <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-10 pt-16 lg:grid-cols-[1fr_1.1fr] lg:pt-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5fb8ff]">{t.kicker}</p>
              <h1 className="font-display mt-4 bg-gradient-to-r from-[#ff5fb8] via-[#c86bff] to-[#5fb8ff] bg-clip-text text-5xl font-semibold leading-[1.05] text-transparent sm:text-6xl">
                {t.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{t.desc}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={withLang('/shop', lang)}
                  className="rounded-full bg-gradient-to-r from-[#ff1f8f] to-[#7b3bff] px-7 py-3.5 font-semibold text-white shadow-[0_10px_40px_-10px_rgba(255,31,143,0.8)] transition hover:brightness-110"
                >
                  {t.order} →
                </Link>
                <a
                  href={whatsappHref(t.quoteMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white transition hover:border-white/60"
                >
                  {t.quote}
                </a>
              </div>
            </div>
            <CatalogImageButton images={ALL} index={idx('anahtarlik')} sizes="(min-width: 1024px) 560px, 100vw" priority />
          </section>

          {/* 1) KOLEKSİYON */}
          <Section kicker={t.s1Kicker} title={t.s1Title} desc={t.s1Desc}>
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <CatalogImageButton images={ALL} index={idx('bag')} sizes="(min-width: 1024px) 560px, 100vw" />
                <Caption title={t.c2Title} desc={t.c2Desc} />
              </div>
              <div>
                <CatalogImageButton images={ALL} index={idx('sticker')} sizes="(min-width: 1024px) 560px, 100vw" />
                <Caption title={t.c3Title} desc={t.c3Desc} />
              </div>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {t.modelList.map(([name, desc]) => (
                <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5fb8]">{t.models}</p>
                  <p className="mt-2 font-semibold text-white">{name}</p>
                  <p className="mt-1 text-sm text-white/60">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Caption title={t.c1Title} desc={t.c1Desc} />
            </div>
          </Section>

          {/* 2) KİMİN İÇİN */}
          <Section kicker={t.s2Kicker} title={t.s2Title} desc={t.s2Desc}>
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_1fr]">
              <CatalogImageButton images={ALL} index={idx('koleksiyon')} sizes="(min-width: 1024px) 560px, 100vw" />
              <div className="space-y-3 lg:sticky lg:top-28">
                {t.uses.map((use) => (
                  <div key={use} className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-medium text-white">
                    {use}
                  </div>
                ))}
                <div className="rounded-2xl border border-[#5fb8ff]/30 bg-[#5fb8ff]/[0.06] p-5">
                  <p className="font-semibold text-white">{t.factsTitle}</p>
                  <ul className="mt-3 space-y-2 text-sm text-white/70">
                    {t.facts.map((fact) => (
                      <li key={fact} className="flex gap-2">
                        <span className="text-[#5fb8ff]">✓</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          {/* 3) ETSY DİJİTAL */}
          <Section kicker={t.s3Kicker} title={t.s3Title} desc={t.s3Desc}>
            <div className="grid gap-10 md:grid-cols-2">
              <CatalogImageButton images={ALL} index={idx('dijitalProfil')} sizes="(min-width: 768px) 560px, 100vw" />
              <div className="flex flex-col gap-6">
                <CatalogImageButton images={ALL} index={idx('dijitalOzellik')} sizes="(min-width: 768px) 560px, 100vw" />
                <a
                  href={etsy.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start rounded-full px-7 py-3.5 font-semibold text-white transition hover:brightness-110"
                  style={{ background: etsy.color }}
                >
                  {t.etsyCta} ↗
                </a>
              </div>
            </div>
          </Section>

          {/* NEREDEN ALIRIM */}
          <section className="mx-auto max-w-6xl px-4 pb-20 pt-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-white">{t.storesTitle}</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={withLang('/shop', lang)} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#07070f] hover:bg-white/90">
                  {t.site} →
                </Link>
                {MARKETPLACES.map((store) => (
                  <a
                    key={store.id}
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/15 bg-black/40 px-5 py-2.5 text-sm font-bold transition hover:border-white/50"
                    style={{ color: store.color }}
                  >
                    {store.name} ↗
                  </a>
                ))}
              </div>
              <p className="mt-6 text-xs text-white/45">{t.note}</p>
            </div>
          </section>
        </div>
      </div>
    </WarmPage>
  )
}
