import type { Metadata } from 'next'
import Link from 'next/link'
import ProductArt from '@/components/warm/ProductArt'
import ProductCard from '@/components/warm/ProductCard'
import { WarmPage } from '@/components/warm/SiteChrome'
import VoicePlayer from '@/components/warm/VoicePlayer'
import { PRODUCTS } from '@/lib/commerce/catalog'
import { getRequestLang } from '@/lib/i18n.server'
import { withLang, type Lang } from '@/lib/i18n'
import { SITE_URL, whatsappHref } from '@/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: '/', languages: { 'tr-TR': '/', 'en-US': '/?lang=en' } },
}

const C = {
  tr: {
    heroChip: '🎁 Anneler Günü, yıldönümü ve doğum günleri için',
    heroTitle: 'Hediyene',
    heroAccent: 'bir ses ver.',
    heroDesc:
      "Kolyenin ya da anahtarlığın arkasındaki QR'ı okutan, senin sesini duyar, videonu izler, fotoğraflarını görür. Uygulama gerekmez; içeriği istediğin zaman değiştirirsin.",
    ctaShop: 'Ürünleri gör',
    ctaFree: 'Ücretsiz dene',
    trust: ['Uygulama gerekmez', 'iPhone & Android', 'İçerik her zaman güncellenebilir', 'Hediye kutusunda gönderim'],
    demoTitle: 'Bir örnek dinle',
    demoLabel: 'Annemin sesi ❤️',
    productsKicker: 'Ürünler',
    productsTitle: 'Taşınabilir anılar',
    productsAll: 'Tüm ürünler →',
    howKicker: 'Nasıl çalışır?',
    howTitle: '3 adımda sesli hediye',
    how: [
      ['Sipariş ver', 'Kolye ya da anahtarlık hediye kutusunda kapına gelir. Her birinin kendine ait kalıcı QR kodu (NFC modellerde çipi) vardır.'],
      ['Sesini ekle', "QR'ı telefonla okut, sesini kaydet ya da video, fotoğraf, Spotify şarkısı ekle. 1 dakika sürer."],
      ['Hediye et', 'Okutan herkes içeriğini anında açar. Sonradan değiştirmek istersen sahip linkinden güncellersin.'],
    ],
    usesKicker: 'Kim için?',
    usesTitle: 'Her anının bir sesi var',
    uses: [
      ['💐', 'Anneye, babaya', 'Uzakta olsan da sesin hep yanında.'],
      ['💍', 'Sevgiliye', 'İlk tanıştığınız şarkı, söyleyemediklerin.'],
      ['👶', 'Bebeğin ilk sesleri', 'İlk kelimesi, ilk kahkahası, ultrason videosu.'],
      ['🕊️', 'Anma ve hatıra', 'Kaybettiğin birinin sesi, fotoğrafları — hep yanında.'],
      ['🐾', 'Evcil hayvan künyesi', 'Kaybolursa bulan kişi sahibine anında ulaşır.'],
      ['🎓', 'Mezuniyet & veda', "Arkadaşlarından sesli mesajlar tek QR'da."],
    ],
    gbKicker: 'Yeni · Dijital Anı Defteri',
    gbTitle: 'Düğününde misafirlerinin sesi kalsın',
    gbDesc:
      'Masalara koyduğun tek QR ile misafirlerin sesli mesaj, video, fotoğraf ve yazılı anı bırakır. Sen onaylarsın, saklarsın, yıllar sonra tekrar dinlersin. Pahalı ses kayıt telefonlarına göre çok daha ekonomik.',
    gbPoints: ['Uygulama yok, misafir sadece okutur', 'Onay ve PIN ile tam kontrol', 'Yazdırılabilir masa kartları dahil'],
    gbCta: 'Anı defterini incele',
    nfcKicker: 'NFC',
    nfcTitle: 'Dokun, dinle.',
    nfcDesc:
      'NFC modellerinde kamerayı açmaya bile gerek yok: telefonu kolyeye ya da anahtarlığa yaklaştırmak yeterli. QR yedekte, NFC olmayan telefonlar da açabilir.',
    nfcCta: 'NFC ürünleri gör',
    videoTitle: '30 saniyede QRNot',
    faqKicker: 'Sık sorulan sorular',
    faq: [
      ['Uygulama indirmek gerekiyor mu?', "Hayır. Telefonun kamerasıyla QR'ı okutmak (ya da NFC modellerde dokundurmak) yeterli. İçerik tarayıcıda açılır."],
      [
        'İçeriği sonradan değiştirebilir miyim?',
        "Evet. QR'ı ilk hazırladığında sana özel bir sahip linki verilir. Bu linkle sesini, videonu ve fotoğraflarını istediğin zaman değiştirebilirsin.",
      ],
      ['Ses ve video ne kadar süre saklanıyor?', 'İçeriğin sen silmediğin sürece saklanır; QR kodun ve sayfan için yenileme ücreti alınmaz.'],
      [
        'Sahip linkimi kaybedersem ne olur?',
        "İlk kurulumda verilen 8 haneli kurtarma koduyla yeni sahip linki alabilirsin. Kodu da kaybettiysen WhatsApp'tan bize yaz.",
      ],
      [
        "QR'ı okutan herkes içeriğimi görebilir mi?",
        "Evet, QR'ı okutan kişi içeriği görür; bu yüzden hediye ettiğin kişiyle paylaşmak istediğin içerikleri ekle. Değiştirme yetkisi sadece sende.",
      ],
      [
        'Kargo ve iade nasıl?',
        'Siparişler 1-3 iş gününde kargoya verilir, Türkiye geneli kargo ücretsiz. Kullanılmamış ürünlerde 14 gün içinde iade hakkın var.',
      ],
    ],
    b2bKicker: 'Kurumsal',
    b2bTitle: 'İşletmeler için QR çözümleri',
    b2bDesc: 'Otel, eğitim, sağlık, fabrika, perakende ve lojistik için özel paneller. Toplu üretim ve pazaryeri entegrasyonu.',
    sectors: [
      ['🏨', 'Otel', '/hotel'],
      ['🎓', 'Eğitim', '/education'],
      ['🏥', 'Sağlık', '/health'],
      ['🏭', 'Fabrika', '/factory'],
      ['🛍️', 'Perakende', '/retail'],
      ['🚚', 'Lojistik', '/logistics'],
    ],
    b2bCta: 'Kurumsal teklif al',
    partner: 'Pazaryeri ortaklığı',
    finalTitle: 'Sevdiğin birine sesini hediye et.',
    finalCta: 'Hemen sipariş ver',
  },
  en: {
    heroChip: "🎁 For birthdays, anniversaries & Mother's Day",
    heroTitle: 'Give your gift',
    heroAccent: 'a voice.',
    heroDesc:
      'Whoever scans the QR on the back of the necklace or keychain hears your voice, watches your video, sees your photos. No app needed — and you can change the content any time.',
    ctaShop: 'Shop now',
    ctaFree: 'Try it free',
    trust: ['No app needed', 'iPhone & Android', 'Update content any time', 'Gift-ready packaging'],
    demoTitle: 'Listen to an example',
    demoLabel: "Mom's voice ❤️",
    productsKicker: 'Products',
    productsTitle: 'Memories you can carry',
    productsAll: 'All products →',
    howKicker: 'How it works',
    howTitle: 'A voice gift in 3 steps',
    how: [
      ['Order', 'Your necklace or keychain arrives gift-boxed. Each has its own permanent QR code (and NFC chip on NFC models).'],
      ['Add your voice', 'Scan the QR, record your voice or add a video, photos or a Spotify song. Takes a minute.'],
      ['Gift it', 'Anyone who scans opens your content instantly. Want to change it later? Update it from your owner link.'],
    ],
    usesKicker: 'Who is it for?',
    usesTitle: 'Every memory has a voice',
    uses: [
      ['💐', 'Mom & Dad', 'Even far away, your voice is always with them.'],
      ['💍', 'Your partner', 'The song from your first date, the words you never said.'],
      ['👶', "Baby's first sounds", 'First word, first laugh, the ultrasound video.'],
      ['🕊️', 'In loving memory', "A loved one's voice and photos — always close."],
      ['🐾', 'Pet ID tag', 'If your pet gets lost, the finder can reach you instantly.'],
      ['🎓', 'Graduation & farewells', 'Voice messages from friends in a single QR.'],
    ],
    gbKicker: 'New · Audio & Video Guestbook',
    gbTitle: "Keep your wedding guests' voices forever",
    gbDesc:
      'One QR on your tables lets guests leave voice messages, videos, photos and notes. You approve and keep them, and replay them for years. A fraction of the cost of rental audio-guestbook phones.',
    gbPoints: ['No app — guests just scan', 'Full control with approval & PIN', 'Printable table cards included'],
    gbCta: 'Explore the guestbook',
    nfcKicker: 'NFC',
    nfcTitle: 'Tap. Listen.',
    nfcDesc:
      "With NFC models you don't even need the camera: just hold a phone near the necklace or keychain. The QR is there as a backup for phones without NFC.",
    nfcCta: 'See NFC products',
    videoTitle: 'QRNot in 30 seconds',
    faqKicker: 'FAQ',
    faq: [
      ['Do I need an app?', 'No. Scanning the QR with the phone camera (or tapping NFC models) is enough. Content opens in the browser.'],
      [
        'Can I change the content later?',
        'Yes. When you first set up the QR you get a private owner link. Use it to change your voice, video and photos any time.',
      ],
      ['How long is my content kept?', 'Your content stays until you delete it; there is no renewal fee for your QR code and page.'],
      ['What if I lose my owner link?', 'Use the 8-character recovery code from setup to get a new owner link. Lost that too? Message us on WhatsApp.'],
      [
        'Can anyone who scans see my content?',
        'Yes — anyone who scans sees the content, so add what you want to share with the recipient. Only you can change it.',
      ],
      ['Shipping & returns?', 'Orders ship within 1-3 business days. Unused items can be returned within 14 days.'],
    ],
    b2bKicker: 'Business',
    b2bTitle: 'QR solutions for businesses',
    b2bDesc: 'Dedicated panels for hotels, education, healthcare, factories, retail and logistics. Bulk production and marketplace integrations.',
    sectors: [
      ['🏨', 'Hotels', '/hotel'],
      ['🎓', 'Education', '/education'],
      ['🏥', 'Healthcare', '/health'],
      ['🏭', 'Factories', '/factory'],
      ['🛍️', 'Retail', '/retail'],
      ['🚚', 'Logistics', '/logistics'],
    ],
    b2bCta: 'Get a business quote',
    partner: 'Marketplace partnership',
    finalTitle: 'Give someone you love the gift of your voice.',
    finalCta: 'Order now',
  },
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">{children}</p>
}

export default async function Home({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = await getRequestLang((await searchParams).lang)
  const c = C[lang]
  const featured = PRODUCTS.filter((p) => p.physical)
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'QRNot',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    sameAs: ['https://www.instagram.com/qrnotcom'],
  }

  return (
    <WarmPage lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([faqLd, orgLd]) }} />

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div>
          <span className="w-chip">{c.heroChip}</span>
          <h1 className="font-display mt-5 text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            {c.heroTitle} <span className="text-coral">{c.heroAccent}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">{c.heroDesc}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={withLang('/shop', lang)} className="w-btn w-btn-primary px-7 py-4 text-base">
              {c.ctaShop}
            </Link>
            <Link href={withLang('/account', lang)} className="w-btn w-btn-ghost px-7 py-4 text-base">
              {c.ctaFree}
            </Link>
          </div>
          <ul className="mt-8 grid max-w-lg grid-cols-2 gap-2 text-sm text-ink-2">
            {c.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-sage">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <ProductArt kind="necklace" variant="neon-pink" className="w-card aspect-square w-full -rotate-2" />
            <ProductArt kind="keychain" nfc variant="neon-green" className="w-card mt-10 aspect-square w-full rotate-2" />
          </div>
          <div className="w-card relative -mt-10 mx-auto max-w-sm p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{c.demoTitle}</p>
            <VoicePlayer src="/demo-voice.wav" title={c.demoLabel} lang={lang} />
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kicker>{c.productsKicker}</Kicker>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.productsTitle}</h2>
          </div>
          <Link href={withLang('/shop', lang)} className="w-link">
            {c.productsAll}
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="nasil-calisir" className="scroll-mt-24 bg-paper py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Kicker>{c.howKicker}</Kicker>
          <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.howTitle}</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {c.how.map(([title, desc], index) => (
              <li key={title} className="w-card-soft p-6">
                <span className="font-display text-4xl font-semibold text-coral">{index + 1}</span>
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* USES */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Kicker>{c.usesKicker}</Kicker>
        <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.usesTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.uses.map(([icon, title, desc]) => (
            <div key={title} className="w-card flex gap-4 p-5">
              <span className="text-3xl" aria-hidden="true">
                {icon}
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-2">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GUESTBOOK */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid items-center gap-10 overflow-hidden rounded-4xl bg-ink p-8 text-white sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{c.gbKicker}</p>
            <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">{c.gbTitle}</h2>
            <p className="mt-4 leading-relaxed text-white/75">{c.gbDesc}</p>
            <ul className="mt-6 space-y-2">
              {c.gbPoints.map((point) => (
                <li key={point} className="flex items-center gap-2 text-white/90">
                  <span className="text-gold">✓</span> {point}
                </li>
              ))}
            </ul>
            <Link href={withLang('/guestbook', lang)} className="w-btn w-btn-primary mt-8">
              {c.gbCta} →
            </Link>
          </div>
          <ProductArt kind="guestbook" className="mx-auto w-full max-w-xs rounded-3xl" />
        </div>
      </section>

      {/* NFC */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="w-card grid items-center gap-8 p-8 sm:p-12 md:grid-cols-[1fr_1.3fr]">
          <ProductArt kind="necklace" nfc variant="neon-blue" className="mx-auto w-full max-w-xs rounded-3xl" />
          <div>
            <Kicker>📶 {c.nfcKicker}</Kicker>
            <h2 className="font-display mt-2 text-4xl font-semibold">{c.nfcTitle}</h2>
            <p className="mt-4 leading-relaxed text-ink-2">{c.nfcDesc}</p>
            <Link href={withLang('/nfc', lang)} className="w-btn w-btn-dark mt-6">
              {c.nfcCta} →
            </Link>
          </div>
        </div>
      </section>

      {/* VIDEO */}
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="font-display mb-5 text-center text-2xl font-semibold">{c.videoTitle}</h2>
        <video className="w-card aspect-video w-full bg-ink object-cover" controls playsInline preload="metadata" src="/qrnot-intro.mp4" />
      </section>

      {/* FAQ */}
      <section id="sss" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20">
        <Kicker>{c.faqKicker}</Kicker>
        <div className="mt-6 space-y-3">
          {c.faq.map(([q, a]) => (
            <details key={q} className="w-card group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-coral transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* B2B */}
      <section id="kurumsal" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10">
        <div className="w-card-soft p-8 sm:p-10">
          <Kicker>{c.b2bKicker}</Kicker>
          <h2 className="font-display mt-2 text-3xl font-semibold">{c.b2bTitle}</h2>
          <p className="mt-3 max-w-2xl text-ink-2">{c.b2bDesc}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {c.sectors.map(([icon, label, href]) => (
              <Link key={href} href={withLang(href, lang)} className="rounded-2xl border border-line bg-paper p-4 text-center font-semibold hover:border-ink-2">
                <span className="block text-2xl">{icon}</span>
                <span className="mt-1 block text-sm">{label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={whatsappHref(lang === 'en' ? 'Hello QRNot, I would like a business quote.' : 'Merhaba QRNot, kurumsal teklif almak istiyorum.')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-btn w-btn-dark"
            >
              {c.b2bCta}
            </a>
            <Link href={withLang('/partnerlik', lang)} className="w-btn w-btn-ghost">
              {c.partner}
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="font-display text-4xl font-semibold sm:text-5xl">{c.finalTitle}</h2>
        <Link href={withLang('/shop', lang)} className="w-btn w-btn-primary mt-8 px-8 py-4 text-base">
          {c.finalCta} →
        </Link>
      </section>
    </WarmPage>
  )
}
