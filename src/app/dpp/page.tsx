import type { Metadata } from 'next'
import Link from 'next/link'
import { WarmPage } from '@/components/warm/SiteChrome'
import { DEMO_PASSPORT_ID } from '@/lib/dpp/demo'
import { getRequestLang } from '@/lib/i18n.server'
import { withLang, type Lang } from '@/lib/i18n'
import { whatsappHref } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Dijital Ürün Pasaportu (DPP) — AB ESPR’e hazırlık',
  description:
    'Ürünleriniz için AB Dijital Ürün Pasaportu: QR / NFC ile açılan, 8 dilli, sürümlü, GS1 Digital Link uyumlu pasaportlar. Tekstil, mobilya, elektronik ve batarya üreticileri için.',
  alternates: { canonical: '/dpp', languages: { 'tr-TR': '/dpp', 'en-US': '/dpp?lang=en' } },
}

const C = {
  tr: {
    kicker: 'AB ESPR · Dijital Ürün Pasaportu',
    title: 'Ürünlerinizi AB’nin dijital ürün pasaportuna',
    accent: 'bugünden hazırlayın.',
    desc: 'Avrupa’ya ihracat yapan üreticiler için: her ürün modeline ya da tekil ürüne QR / NFC ile açılan, 8 dilde, sürümlü ve denetime hazır bir dijital pasaport. Veriyi bir kez girin; etiketleri basın, gerisini QRNot yönetsin.',
    ctaDemo: 'Örnek pasaportu incele',
    ctaQuote: 'Teklif al',
    ctaPanel: 'Panel girişi',
    quoteMsg: 'Merhaba QRNot, Dijital Ürün Pasaportu (DPP) hakkında bilgi ve teklif almak istiyorum.',
    whatKicker: 'DPP nedir?',
    whatTitle: 'Ürünün dijital kimlik kartı',
    whatDesc:
      'AB’nin Sürdürülebilir Ürünler için Ekotasarım Tüzüğü (ESPR) ile AB pazarındaki ürünlere kademeli olarak dijital ürün pasaportu zorunlu hale geliyor. Pasaport; ürünün malzemesini, menşeini, çevresel etkisini, bakım ve onarım bilgisini, geri dönüşüm talimatını ve uygunluk belgelerini, ürünün üzerindeki bir veri taşıyıcı (QR kod, NFC) üzerinden tüketiciye, denetim kurumlarına ve geri dönüşüm tesislerine sunar.',
    timelineTitle: 'Takvim',
    timeline: [
      ['Temmuz 2024', 'ESPR yürürlüğe girdi. Ürün grupları için ayrıntılı kurallar ikincil düzenlemelerle belirleniyor.'],
      ['2026', 'AB merkezi DPP kayıt sisteminin kurulması planlanıyor.'],
      ['Şubat 2027', 'AB Pil Tüzüğü kapsamında elektrikli araç, hafif taşıt ve büyük endüstriyel bataryalar için batarya pasaportu.'],
      ['2027 ve sonrası', 'Tekstil, demir-çelik, mobilya ve diğer öncelikli gruplar; tarihler ilgili düzenlemelerle kesinleşir.'],
    ],
    timelineNote: 'Tarihler ürün grubuna göre değişir. Sizin ürünleriniz için geçerli takvimi teklif aşamasında birlikte netleştiriyoruz.',
    featKicker: 'QRNot DPP',
    featTitle: 'Pasaport için gereken her şey tek panelde',
    features: [
      ['🧾', 'Model ve tekil ürün pasaportu', 'Model düzeyinde tek QR ya da her ürün için seri numaralı pasaport: seri no, parti ve üretim tarihiyle.'],
      ['🌍', '8 dil, otomatik çeviri', 'Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Felemenkçe, Arapça, Rusça. Metinleri yapay zekâ ile tek tıkla çevirin, kontrol edip yayınlayın.'],
      ['🏷️', 'GS1 Digital Link', 'GTIN girdiğiniz ürünlerde standart /01/{GTIN}/21/{seri} adresi doğrudan pasaportu açar.'],
      ['🕓', 'Sürümlü yayın', 'Her yayın değiştirilemez bir sürüm olarak saklanır. QR adresi hiç değişmez; etiketleri yeniden basmazsınız.'],
      ['🔒', 'Yetkili erişim', 'Tedarikçi, tesis ve sökme bilgileri gibi hassas veriler sadece denetim ve geri dönüşüm için verdiğiniz anahtarla görünür.'],
      ['📄', 'Belgeler ve sertifikalar', 'Uygunluk beyanı, test raporu, OEKO-TEX, GOTS gibi belgeleri PDF olarak ekleyin; herkese açık ya da kısıtlı.'],
      ['🖨️', 'Etiket ve üretim', 'QR etiketlerini doğrudan yazdırın ya da CSV’yi lazer / etiket yazılımınıza verin. Aynı pasaport adresi NFC etiketlere de yazılabilir.'],
      ['🤖', 'Makine okunur veri', 'Her pasaport JSON olarak da sunulur; denetim yazılımları ve entegrasyonlar doğrudan okuyabilir.'],
      ['📊', 'Okutma analizi', 'Hangi ürün, hangi ülkede, hangi dilde okutuluyor: 30 günlük panel.'],
      ['👥', 'Ekip ve roller', 'Yönetici, editör ve izleyici rolleri. Toplu ürün yükleme için CSV içe aktarma.'],
      ['🤝', 'Tedarikçi veri portalı', 'Tedarikçinize bir link gönderin; malzeme, sertifika, tesis ve SVHC bilgilerini kendi dilinde doldursun, belgelerini yüklesin. İnceleyip tek tıkla ürüne aktarın.'],
      ['🌱', 'Karbon tahmini yardımcısı', 'Malzeme oranları ve ağırlıktan hammadde aşaması için kaynaklı bir karbon aralığı hesaplayın. Pasaportta açıkça “tahmin” olarak gösterilir.'],
    ],
    howKicker: 'Nasıl çalışır?',
    howTitle: '4 adımda pasaport',
    how: [
      ['Firma hesabı', 'Firmanızı açıyoruz, panel girişinizi iletiyoruz.'],
      ['Ürün verisi', 'Malzeme, menşe, çevre, bakım, onarım ve belgeleri panelden girin ya da CSV ile toplu yükleyin.'],
      ['Yayın', 'Yayınla’ya basın; pasaport 8 dilde yayına girer, her güncelleme yeni bir sürüm olur.'],
      ['Etiket', 'QR / NFC etiketlerini ürüne, etikete ya da ambalaja uygulayın.'],
    ],
    sectorsTitle: 'Kimler için?',
    sectors: ['👕 Tekstil ve hazır giyim', '👟 Ayakkabı', '🛋️ Mobilya', '🔋 Pil ve batarya', '🔌 Elektronik ve beyaz eşya', '🧸 Oyuncak', '🏗️ Yapı malzemesi', '⚙️ Demir-çelik ve metal'],
    plansKicker: 'Paketler',
    plansTitle: 'Ürün sayınıza göre',
    plans: [
      ['Pilot', '10 ürün modeline kadar', 'İlk ürünlerle başlayın, süreci deneyin.'],
      ['Başlangıç', '50 ürün modeline kadar', 'Küçük ve orta ölçekli üreticiler için.'],
      ['Büyüme', '200 ürün modeline kadar', 'Büyüyen koleksiyonlar ve çok tedarikçili üretim için.'],
      ['İşletme', '500 ürün modeline kadar', 'Geniş koleksiyonlu markalar için.'],
      ['Kurumsal', 'Sınırsız', 'Entegrasyon, özel alan adı ve öncelikli destek.'],
    ],
    plansNote: 'Tüm paketlerde sınırsız seri numarası, 8 dil, belgeler ve etiket baskısı vardır. Fiyat ürün sayısına ve hizmet kapsamına göre belirlenir.',
    honestTitle: 'Açık konuşalım',
    honest:
      'QRNot DPP, pasaport verinizi bugünden toplamanız, yayınlamanız ve ürünlerinize uygulamanız için hazır bir altyapıdır. AB’nin teknik standartları ve ürün grubu kuralları kesinleştikçe veri modelini güncelliyoruz. Ürününüzün ilgili mevzuata uygunluğunun sorumluluğu üreticidedir; biz bu süreci kolaylaştırıyoruz.',
    securityLink: 'Güvenlik ve veri işleme (KVKK / GDPR) →',
    ctaTrial: 'Ücretsiz demo (14 gün)',
    faqKicker: 'Sık sorulan sorular',
    faq: [
      ['Ürün başına ayrı QR mı gerekiyor?', 'İkisi de mümkün. Bazı ürün grupları model düzeyinde, bazıları parti ya da tekil ürün düzeyinde pasaport isteyecek. Panelden model QR’ı ya da her ürün için seri numaralı QR üretebilirsiniz.'],
      ['Bilgileri güncellersem etiketler değişir mi?', 'Hayır. Pasaport adresi sabittir; her güncelleme yeni bir sürüm olarak yayınlanır, eski sürümler kayıtta kalır.'],
      ['Hangi diller destekleniyor?', 'Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Felemenkçe, Arapça ve Rusça. Ziyaretçi dilini seçer; metinleri otomatik çevirip kontrol edebilirsiniz.'],
      ['Mevcut barkodumu (GTIN) kullanabilir miyim?', 'Evet. GTIN girdiğiniz ürünlerde GS1 Digital Link adresi de pasaportu açar.'],
      ['Verilerim nerede saklanıyor?', 'Veritabanı ve dosyalar ABD’deki bulut altyapısında (Neon / AWS us-east-1 ve Vercel) şifreli bağlantıyla, firmanıza ayrılmış alanda tutulur; KVKK / GDPR için veri işleme sözleşmesi imzalıyoruz. Yayınlanmış pasaportlar ürün ömrü boyunca erişilebilir kalacak şekilde silinemez, sadece arşivlenebilir. Ayrıntılar: Güvenlik ve veri işleme sayfası.'],
    ],
    finalTitle: 'İhracatınız için ilk pasaportu birlikte hazırlayalım.',
  },
  en: {
    kicker: 'EU ESPR · Digital Product Passport',
    title: 'Get your products ready for the EU',
    accent: 'Digital Product Passport today.',
    desc: 'For manufacturers exporting to Europe: a versioned, audit-ready digital passport in 8 languages that opens via QR / NFC for every product model or individual item. Enter the data once, print the labels, and let QRNot handle the rest.',
    ctaDemo: 'See a sample passport',
    ctaQuote: 'Get a quote',
    ctaPanel: 'Panel login',
    quoteMsg: 'Hello QRNot, I would like information and a quote for the Digital Product Passport (DPP).',
    whatKicker: 'What is a DPP?',
    whatTitle: 'A digital ID card for every product',
    whatDesc:
      'Under the EU Ecodesign for Sustainable Products Regulation (ESPR), digital product passports are being phased in for products placed on the EU market. The passport shares a product’s materials, origin, environmental impact, care and repair information, recycling instructions and compliance documents with consumers, authorities and recyclers through a data carrier on the product (QR code, NFC).',
    timelineTitle: 'Timeline',
    timeline: [
      ['July 2024', 'ESPR entered into force. Detailed rules per product group are set by delegated acts.'],
      ['2026', 'The EU central DPP registry is planned to be set up.'],
      ['February 2027', 'Battery passport under the EU Battery Regulation for EV, light-transport and large industrial batteries.'],
      ['2027 onwards', 'Textiles, iron and steel, furniture and other priority groups; dates are fixed by the relevant acts.'],
    ],
    timelineNote: 'Dates vary by product group. We confirm the timeline that applies to your products during the quote.',
    featKicker: 'QRNot DPP',
    featTitle: 'Everything a passport needs, in one panel',
    features: [
      ['🧾', 'Model and item-level passports', 'One QR per model, or a serialised passport per item with serial number, batch and production date.'],
      ['🌍', '8 languages, auto-translate', 'Turkish, English, German, French, Spanish, Dutch, Arabic, Russian. Translate with AI in one click, review and publish.'],
      ['🏷️', 'GS1 Digital Link', 'For products with a GTIN, the standard /01/{GTIN}/21/{serial} URL opens the passport directly.'],
      ['🕓', 'Versioned publishing', 'Every publication is stored as an immutable version. The QR URL never changes, so you never reprint labels.'],
      ['🔒', 'Authorised access', 'Sensitive data such as suppliers, facility and dismantling notes is visible only with the key you give authorities and recyclers.'],
      ['📄', 'Documents and certificates', 'Attach declarations of conformity, test reports, OEKO-TEX, GOTS and more as PDFs, public or restricted.'],
      ['🖨️', 'Labels and production', 'Print QR labels directly or feed the CSV to your laser / label software. The same passport URL can also be written to NFC tags.'],
      ['🤖', 'Machine-readable data', 'Every passport is also served as JSON for compliance tools and integrations.'],
      ['📊', 'Scan analytics', 'Which product is scanned, in which country and language: a 30-day dashboard.'],
      ['👥', 'Team and roles', 'Owner, editor and viewer roles. CSV import for bulk product upload.'],
      ['🤝', 'Supplier data portal', 'Send your supplier a link to fill in materials, certificates, facility and SVHC details in their own language and upload documents. Review and copy into the product in one click.'],
      ['🌱', 'Carbon estimate helper', 'Calculate a sourced carbon range for the raw-material stage from material shares and weight. It is clearly labelled as an “estimate” in the passport.'],
    ],
    howKicker: 'How it works',
    howTitle: 'A passport in 4 steps',
    how: [
      ['Company account', 'We open your company and send your panel login.'],
      ['Product data', 'Enter materials, origin, environment, care, repair and documents in the panel, or bulk-upload via CSV.'],
      ['Publish', 'Press Publish; the passport goes live in 8 languages and every update becomes a new version.'],
      ['Label', 'Apply QR / NFC labels to the product, tag or packaging.'],
    ],
    sectorsTitle: 'Who is it for?',
    sectors: ['👕 Textiles and apparel', '👟 Footwear', '🛋️ Furniture', '🔋 Batteries', '🔌 Electronics and appliances', '🧸 Toys', '🏗️ Construction products', '⚙️ Iron, steel and metals'],
    plansKicker: 'Plans',
    plansTitle: 'Sized to your catalogue',
    plans: [
      ['Pilot', 'Up to 10 product models', 'Start with your first products and try the process.'],
      ['Starter', 'Up to 50 product models', 'For small and mid-sized manufacturers.'],
      ['Growth', 'Up to 200 product models', 'For growing collections and multi-supplier production.'],
      ['Business', 'Up to 500 product models', 'For brands with large collections.'],
      ['Enterprise', 'Unlimited', 'Integrations, custom domain and priority support.'],
    ],
    plansNote: 'All plans include unlimited serial numbers, 8 languages, documents and label printing. Pricing depends on product count and service scope.',
    honestTitle: 'In plain terms',
    honest:
      'QRNot DPP is ready-made infrastructure to collect, publish and apply your passport data today. We update the data model as EU technical standards and product-group rules are finalised. The manufacturer remains responsible for the product’s compliance; we make the process easier.',
    securityLink: 'Security and data processing (GDPR / KVKK) →',
    ctaTrial: 'Free demo (14 days)',
    faqKicker: 'FAQ',
    faq: [
      ['Do I need a separate QR per item?', 'Both are possible. Some product groups will require model-level passports, others batch or item level. Generate a model QR or serialised QR codes per item from the panel.'],
      ['If I update the data, do labels change?', 'No. The passport URL is permanent; each update is published as a new version and earlier versions stay on record.'],
      ['Which languages are supported?', 'Turkish, English, German, French, Spanish, Dutch, Arabic and Russian. Visitors pick their language; you can auto-translate and review.'],
      ['Can I use my existing barcode (GTIN)?', 'Yes. For products with a GTIN, the GS1 Digital Link URL also opens the passport.'],
      ['Where is my data stored?', 'The database and files are kept on cloud infrastructure in the USA (Neon / AWS us-east-1 and Vercel) over encrypted connections, in a space reserved for your company; we sign a data processing agreement for GDPR / KVKK. Published passports cannot be deleted, only archived, so they stay available for the product’s lifetime. Details: Security and data processing page.'],
    ],
    finalTitle: 'Let’s prepare the first passport for your exports together.',
  },
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">{children}</p>
}

export default async function DppLanding({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = await getRequestLang((await searchParams).lang)
  const c = C[lang]
  const demoHref = `/p/${DEMO_PASSPORT_ID}${lang === 'en' ? '?lang=en' : ''}`
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }

  return (
    <WarmPage lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
        <div>
          <span className="w-chip">🛂 {c.kicker}</span>
          <h1 className="font-display mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            {c.title} <span className="text-coral">{c.accent}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">{c.desc}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={demoHref} target="_blank" className="w-btn w-btn-primary px-7 py-4 text-base">
              {c.ctaDemo} ↗
            </a>
            <a href={whatsappHref(c.quoteMsg)} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-dark px-7 py-4 text-base">
              {c.ctaQuote}
            </a>
            <Link href={withLang('/dpp/demo', lang)} className="w-btn w-btn-ghost px-7 py-4 text-base">
              🧪 {c.ctaTrial}
            </Link>
            <Link href="/dpp/panel" className="w-btn w-btn-ghost px-7 py-4 text-base">
              {c.ctaPanel}
            </Link>
          </div>
        </div>
        <PassportMock lang={lang} />
      </section>

      <section className="bg-paper py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Kicker>{c.whatKicker}</Kicker>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.whatTitle}</h2>
            <p className="mt-4 leading-relaxed text-ink-2">{c.whatDesc}</p>
          </div>
          <div className="w-card p-6">
            <h3 className="font-semibold">{c.timelineTitle}</h3>
            <ol className="mt-4 space-y-4">
              {c.timeline.map(([when, what]) => (
                <li key={when} className="grid grid-cols-[7.5rem_1fr] gap-3 text-sm">
                  <span className="font-semibold text-coral">{when}</span>
                  <span className="text-ink-2">{what}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">{c.timelineNote}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <Kicker>{c.featKicker}</Kicker>
        <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.featTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.map(([icon, title, desc]) => (
            <div key={title} className="w-card p-5">
              <span className="text-3xl" aria-hidden>
                {icon}
              </span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-paper py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Kicker>{c.howKicker}</Kicker>
          <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.howTitle}</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-4">
            {c.how.map(([title, desc], i) => (
              <li key={title} className="w-card-soft p-6">
                <span className="font-display text-4xl font-semibold text-coral">{i + 1}</span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{desc}</p>
              </li>
            ))}
          </ol>
          <h3 className="mt-14 font-semibold">{c.sectorsTitle}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.sectors.map((s) => (
              <span key={s} className="rounded-full border border-line bg-white px-4 py-2 text-sm">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <Kicker>{c.plansKicker}</Kicker>
        <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.plansTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {c.plans.map(([name, limit, desc], i) => (
            <div key={name} className={`w-card flex flex-col p-6 ${i === 1 ? 'ring-2 ring-coral' : ''}`}>
              <h3 className="font-display text-2xl font-semibold">{name}</h3>
              <p className="mt-1 font-semibold text-coral">{limit}</p>
              <p className="mt-3 flex-1 text-sm text-ink-2">{desc}</p>
              <a href={whatsappHref(`${c.quoteMsg} (${name})`)} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-dark w-btn-sm mt-5">
                {c.ctaQuote}
              </a>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-ink-2">{c.plansNote}</p>
        <Link href={withLang('/dpp/demo', lang)} className="w-btn w-btn-primary mt-5 inline-flex px-6 py-3">
          🧪 {c.ctaTrial} →
        </Link>
        <div className="mt-10 rounded-3xl border border-line bg-paper p-6">
          <h3 className="font-semibold">{c.honestTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{c.honest}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-10">
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
        <Link href={withLang('/dpp/guvenlik', lang)} className="mt-5 inline-block text-sm font-semibold text-coral hover:underline">
          {c.securityLink}
        </Link>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{c.finalTitle}</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={whatsappHref(c.quoteMsg)} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-primary px-8 py-4 text-base">
            {c.ctaQuote} →
          </a>
          <a href={demoHref} target="_blank" className="w-btn w-btn-ghost px-8 py-4 text-base">
            {c.ctaDemo} ↗
          </a>
        </div>
        <p className="mt-6 text-sm text-muted">
          <Link href={withLang('/', lang)} className="hover:underline">
            QRNot
          </Link>{' '}
          · 0850 888 1 889
        </p>
      </section>
    </WarmPage>
  )
}

/** Sayfa başındaki pasaport önizlemesi (statik görsel kart). */
function PassportMock({ lang }: { lang: Lang }) {
  const en = lang === 'en'
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[#d8ecf7] to-[#fde3d6] blur-2xl" aria-hidden />
      <div className="overflow-hidden rounded-[2rem] border border-[#dde3ea] bg-white shadow-xl">
        <div className="flex items-center gap-2 border-b border-[#eef2f6] px-5 py-3 text-xs font-semibold text-[#0f1b2d]">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[#0f3d5e] text-[9px] font-bold text-white">DPP</span>
          {en ? 'Digital Product Passport' : 'Dijital Ürün Pasaportu'}
          <span className="ml-auto">🌐 {en ? 'EN' : 'TR'}</span>
        </div>
        <div className="space-y-4 p-5 text-[#0f1b2d]">
          <div>
            <p className="inline-block rounded-full bg-[#e6f4ec] px-2 py-0.5 text-[10px] font-semibold text-[#1d6b45]">✓ {en ? 'Published by the manufacturer' : 'Üretici tarafından yayınlanmıştır'}</p>
            <p className="mt-2 text-lg font-bold">{en ? 'Organic Cotton Basic T-shirt' : 'Organik Pamuk Basic Tişört'}</p>
            <p className="text-xs text-[#4a5b70]">Anatolia Wear · TS-ORG-01 · 🇹🇷 {en ? 'Türkiye' : 'Türkiye'}</p>
          </div>
          <div className="grid grid-cols-3 rounded-xl bg-[#f8fafc] text-[10px]">
            {[
              [en ? 'Serial' : 'Seri no', 'TS24-000127'],
              [en ? 'Batch' : 'Parti', 'L-2410'],
              [en ? 'Made' : 'Üretim', '10/2026'],
            ].map(([k, v]) => (
              <div key={k} className="px-2 py-2">
                <p className="text-[#6b7b8f]">{k}</p>
                <p className="font-mono font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-xs">
            {[
              [en ? 'Organic cotton' : 'Organik pamuk', 95],
              [en ? 'Elastane' : 'Elastan', 5],
            ].map(([name, pct]) => (
              <div key={String(name)}>
                <div className="flex justify-between">
                  <span>{name}</span>
                  <span className="font-semibold">{en ? `${pct}%` : `%${pct}`}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[#eef2f6]">
                  <div className="h-full rounded-full bg-[#2f7fb3]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            {[
              [en ? '2.1 kg' : '2,1 kg', 'CO₂e'],
              [en ? '30%' : '%30', en ? 'recycled' : 'geri dönüşüm'],
              ['24 ' + (en ? 'mo' : 'ay'), en ? 'warranty' : 'garanti'],
            ].map(([v, k]) => (
              <div key={k} className="rounded-xl bg-[#f3f8f4] py-2">
                <p className="text-sm font-bold text-[#1d4d33]">{v}</p>
                <p className="text-[#4f6b58]">{k}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {['CE', 'OEKO-TEX', 'GOTS', 'REACH'].map((x) => (
              <span key={x} className="rounded-lg border border-[#dde3ea] px-2 py-1 font-semibold">
                {x}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
