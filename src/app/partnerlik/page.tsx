import Link from 'next/link'
import type { Metadata } from 'next'

type Lang = 'tr' | 'en'

const whatsappBase = 'https://wa.me/905433929230?text='

export const metadata: Metadata = {
  title: 'QRNote Pazaryeri Partnerliği',
  description:
    'ÇiçekSepeti, Trendyol, Hepsiburada, N11 ve benzeri platformlar için QRNote büyüme ortaklığı sayfası.',
}

function encodeWhatsApp(text: string) {
  return `${whatsappBase}${encodeURIComponent(text)}`
}

const PARTNER_COPY: Record<Lang, {
  home: string
  meeting: string
  badge: string
  hero: string
  heroAccent: string
  heroDesc: string
  targetImpact: string
  basketImpact: string
  returnImpact: string
  conversionBoost: string
  premiumAddon: string
  returnDrop: string
  solveTitle: string
  solveDesc: string
  platformGain: string
  sellerGain: string
  userGain: string
  platformOffers: string
  perMarketplace: string
  askProposal: string
  startPilot: string
  plan90: string
  measurable: string
  week1: string
  week2: string
  week3: string
  week4: string
  closingA: string
  closingB: string
  closingDesc: string
  waPilot: string
  backHome: string
}> = {
  tr: {
    home: 'Ana sayfa',
    meeting: 'Toplantı Planla',
    badge: '2026 Stratejik İş Ortaklığı',
    hero: 'Pazaryerlerinde hediye kategorisini',
    heroAccent: 'deneyim ürününe dönüştürelim',
    heroDesc: 'QRNote, fiziksel hediyelere ses, video, görsel ve bağlantı katmanı ekleyerek platformlara daha yüksek dönüşüm, daha yüksek sepet tutarı ve daha düşük iade riski sağlar.',
    targetImpact: 'Hedef Etki',
    basketImpact: 'Sepet Etkisi',
    returnImpact: 'İade Etkisi',
    conversionBoost: 'Kategori dönüşüm artışı',
    premiumAddon: 'Premium add-on modeli',
    returnDrop: 'Kişiselleştirme kaynaklı düşüş',
    solveTitle: 'Neyi çözüyoruz?',
    solveDesc: 'Hediyelik kategorilerde fiyat rekabeti çok yoğun. QRNote ürünü "sadece fiziksel ürün" olmaktan çıkarıp "duygusal ve dijital deneyim" ürününe taşır. Böylece platform, satıcı ve son kullanıcı aynı anda kazanır.',
    platformGain: 'Platform Kazanımı',
    sellerGain: 'Satıcı Kazanımı',
    userGain: 'Kullanıcı Kazanımı',
    platformOffers: 'Platform Bazlı Teklifler',
    perMarketplace: 'Her pazaryeri için ayrı ticari senaryo',
    askProposal: 'Teklif Dosyası İste',
    startPilot: 'Pilotunu Başlat',
    plan90: '90 Günlük Pilot Planı',
    measurable: 'Ölçülebilir, kontrollü, hızlı ölçeklenebilir',
    week1: 'Hafta 1-2',
    week2: 'Hafta 3-6',
    week3: 'Hafta 7-10',
    week4: 'Hafta 11-12',
    closingA: 'Bugün ürün satılıyor,',
    closingB: 'yarın deneyim satılacak',
    closingDesc: 'Hazırsanız 90 günlük pilotu başlatalım. QRNote ekibi teknik kurulum, KPI takibi ve ticari ölçekleme sürecini uçtan uca yönetir.',
    waPilot: 'WhatsApp ile Pilot Başlat',
    backHome: 'Ana Sayfaya Dön',
  },
  en: {
    home: 'Home',
    meeting: 'Schedule Meeting',
    badge: '2026 Strategic Partnership',
    hero: 'Let us transform gift categories',
    heroAccent: 'into experience products',
    heroDesc: 'QRNote adds audio, video, visual and link layers to physical gifts, helping platforms drive higher conversion, higher basket value and lower return risk.',
    targetImpact: 'Target Impact',
    basketImpact: 'Basket Impact',
    returnImpact: 'Return Impact',
    conversionBoost: 'Category conversion uplift',
    premiumAddon: 'Premium add-on model',
    returnDrop: 'Drop driven by personalization',
    solveTitle: 'What problem do we solve?',
    solveDesc: 'Gift categories face intense price competition. QRNote transforms the product from a "physical item only" into an "emotional and digital experience", so platform, seller and end user all win together.',
    platformGain: 'Platform Gain',
    sellerGain: 'Seller Gain',
    userGain: 'User Gain',
    platformOffers: 'Platform-specific Offers',
    perMarketplace: 'A unique commercial scenario for each marketplace',
    askProposal: 'Request Proposal Deck',
    startPilot: 'Start Pilot',
    plan90: '90-Day Pilot Plan',
    measurable: 'Measurable, controlled, and rapidly scalable',
    week1: 'Week 1-2',
    week2: 'Week 3-6',
    week3: 'Week 7-10',
    week4: 'Week 11-12',
    closingA: 'Today products are sold,',
    closingB: 'tomorrow experiences will be sold',
    closingDesc: 'If you are ready, let us launch the 90-day pilot. The QRNote team manages technical setup, KPI tracking and commercial scaling end-to-end.',
    waPilot: 'Launch Pilot via WhatsApp',
    backHome: 'Back to Home',
  },
}

export default async function PartnerlikPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const lang: Lang = params.lang === 'en' ? 'en' : 'tr'
  const copy = PARTNER_COPY[lang]
  const isEn = lang === 'en'

  const platformCards = isEn
    ? [
        { name: 'ÇiçekSepeti', tone: 'from-rose-500/30 via-orange-400/20 to-transparent', border: 'border-rose-400/30', text: 'In flower + gift flow, voice/video note options increase emotional product value.', kpis: ['Conversion +%3.0 - +%6.5', 'Basket +%7 - +%14', 'Returns -%12 - -%28'], message: 'Hello QRNote, we want to evaluate the 90-day pilot partnership deck for ÇiçekSepeti.' },
        { name: 'Trendyol', tone: 'from-orange-500/30 via-amber-400/20 to-transparent', border: 'border-orange-400/30', text: 'Creates premium product differentiation with personalization badges in a wide catalog.', kpis: ['Conversion +%2.2 - +%5.4', 'Basket +%5 - +%11', 'Returns -%10 - -%22'], message: 'Hello QRNote, we want to discuss seller tool + checkout add-on model for Trendyol gift categories.' },
        { name: 'Hepsiburada', tone: 'from-orange-400/30 via-lime-400/20 to-transparent', border: 'border-lime-300/30', text: 'Improves review quality and customer satisfaction through premium gifting experience.', kpis: ['Conversion +%2.5 - +%5.8', 'Basket +%6 - +%12', 'Returns -%11 - -%24'], message: 'Hello QRNote, we want to launch the digital message gift pilot for Hepsiburada.' },
        { name: 'N11', tone: 'from-cyan-500/25 via-blue-500/20 to-transparent', border: 'border-cyan-300/30', text: 'Creates fast revenue impact with a low-cost add-on during campaign periods.', kpis: ['Conversion +%2.0 - +%4.8', 'Basket +%4 - +%9', 'Returns -%8 - -%18'], message: 'Hello QRNote, we want to discuss phased rollout for N11 campaign periods.' },
      ]
    : [
        { name: 'ÇiçekSepeti', tone: 'from-rose-500/30 via-orange-400/20 to-transparent', border: 'border-rose-400/30', text: 'Çiçek + hediye akışında sesli/video not opsiyonu ile ürünün duygusal değerini büyütür.', kpis: ['Dönüşüm +%3.0 - +%6.5', 'Sepet +%7 - +%14', 'İade -%12 - -%28'], message: 'Merhaba QRNote, ÇiçekSepeti için 90 günlük pilot ortaklık sunumunu değerlendirmek istiyoruz.' },
        { name: 'Trendyol', tone: 'from-orange-500/30 via-amber-400/20 to-transparent', border: 'border-orange-400/30', text: 'Geniş katalog içinde kişiselleştirme rozetleri ile premium ürün ayrışması oluşturur.', kpis: ['Dönüşüm +%2.2 - +%5.4', 'Sepet +%5 - +%11', 'İade -%10 - -%22'], message: 'Merhaba QRNote, Trendyol hediye kategorileri için seller tool + checkout add-on modelini konuşmak istiyoruz.' },
        { name: 'Hepsiburada', tone: 'from-orange-400/30 via-lime-400/20 to-transparent', border: 'border-lime-300/30', text: 'Premium hediye deneyimiyle yorum kalitesini ve müşteri memnuniyetini birlikte artırır.', kpis: ['Dönüşüm +%2.5 - +%5.8', 'Sepet +%6 - +%12', 'İade -%11 - -%24'], message: 'Merhaba QRNote, Hepsiburada için dijital mesajlı hediye pilotunu başlatmak istiyoruz.' },
        { name: 'N11', tone: 'from-cyan-500/25 via-blue-500/20 to-transparent', border: 'border-cyan-300/30', text: 'Kampanya dönemlerinde düşük maliyetli add-on ile hızlı ciro etkisi üretir.', kpis: ['Dönüşüm +%2.0 - +%4.8', 'Sepet +%4 - +%9', 'İade -%8 - -%18'], message: 'Merhaba QRNote, N11 kampanya dönemleri için kademeli rollout planını görüşmek istiyoruz.' },
      ]

  return (
    <div className="min-h-screen bg-neutral-950 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-44 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-52 w-[520px] h-[520px] bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-44 w-[520px] h-[520px] bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900/70 p-1">
            <Link href="/partnerlik?lang=tr" className={`px-2 py-1 text-xs rounded ${lang === 'tr' ? 'bg-cyan-500/30 text-cyan-100' : 'text-neutral-400 hover:text-white'}`}>
              TR
            </Link>
            <Link href="/partnerlik?lang=en" className={`px-2 py-1 text-xs rounded ${lang === 'en' ? 'bg-cyan-500/30 text-cyan-100' : 'text-neutral-400 hover:text-white'}`}>
              EN
            </Link>
          </div>
          <Link
            href={`/?lang=${lang}`}
            className="text-neutral-400 hover:text-white text-sm transition-colors"
          >
            {copy.home}
          </Link>
          <a
            href={encodeWhatsApp(
              isEn
                ? 'Hello QRNote, I want to schedule a meeting for the marketplace partnership deck.'
                : 'Merhaba QRNote, pazaryeri ortaklik sunumu icin toplanti planlamak istiyorum.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold px-4 py-2 rounded-xl border border-neutral-700 transition-all"
          >
            {copy.meeting}
          </a>
        </div>
      </nav>

      <header className="relative z-10 max-w-6xl mx-auto px-4 pt-14 pb-12">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/30 rounded-full px-4 py-1.5 text-cyan-300 text-sm font-medium mb-8">
          {copy.badge}
        </div>
        <h1 className="text-5xl sm:text-7xl font-black text-white leading-[0.95] tracking-tight max-w-5xl">
          {copy.hero}
          <span className="block bg-gradient-to-r from-cyan-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">
            {copy.heroAccent}
          </span>
        </h1>
        <p className="text-neutral-300 text-lg sm:text-xl max-w-3xl mt-7 leading-relaxed">
          {copy.heroDesc}
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-10 max-w-4xl">
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4">
            <p className="text-neutral-500 text-xs mb-1">{copy.targetImpact}</p>
            <p className="text-white text-2xl font-black">+%2 ila +%6</p>
            <p className="text-neutral-400 text-sm">{copy.conversionBoost}</p>
          </div>
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4">
            <p className="text-neutral-500 text-xs mb-1">{copy.basketImpact}</p>
            <p className="text-white text-2xl font-black">+%5 ila +%12</p>
            <p className="text-neutral-400 text-sm">{copy.premiumAddon}</p>
          </div>
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4">
            <p className="text-neutral-500 text-xs mb-1">{copy.returnImpact}</p>
            <p className="text-white text-2xl font-black">-%10 ila -%25</p>
            <p className="text-neutral-400 text-sm">{copy.returnDrop}</p>
          </div>
        </div>
      </header>

      <section className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">{copy.solveTitle}</h2>
          <p className="text-neutral-400 leading-relaxed mb-6">
            {copy.solveDesc}
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: copy.platformGain,
                items: isEn ? ['Category differentiation', 'AOV growth', 'Extra revenue in campaigns'] : ['Kategori farklılaşması', 'AOV büyümesi', 'Kampanya döneminde ek gelir'],
                icon: '🏪',
              },
              {
                title: copy.sellerGain,
                items: isEn ? ['Premium product pricing', 'Stronger product story', 'Higher review quality'] : ['Premium ürün fiyatlama', 'Daha güçlü ürün hikayesi', 'Yorum kalitesi artışı'],
                icon: '🛍️',
              },
              {
                title: copy.userGain,
                items: isEn ? ['Personalized gift', 'Fast no-app usage', 'Freedom to update later'] : ['Kişiselleştirilmiş hediye', 'Uygulamasız hızlı kullanım', 'Sonradan güncelleme özgürlüğü'],
                icon: '💝',
              },
            ].map((block) => (
              <article key={block.title} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
                <p className="text-2xl mb-2">{block.icon}</p>
                <h3 className="text-white font-bold mb-3">{block.title}</h3>
                <div className="space-y-2 text-sm text-neutral-400">
                  {block.items.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-cyan-300 text-xs font-semibold tracking-[0.2em] uppercase mb-2">{copy.platformOffers}</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">{copy.perMarketplace}</h2>
          </div>
          <a
            href={encodeWhatsApp(
              isEn
                ? 'Hello QRNote, could you share the platform-specific proposal deck?'
                : 'Merhaba QRNote, platform bazli teklif dosyasini paylasir misiniz?'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-2xl transition-all"
          >
            {copy.askProposal}
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {platformCards.map((card) => (
            <article
              key={card.name}
              className={`relative overflow-hidden bg-neutral-900/80 border ${card.border} rounded-3xl p-6`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.tone} pointer-events-none`} />
              <div className="relative">
                <h3 className="text-white text-2xl font-black mb-2">{card.name}</h3>
                <p className="text-neutral-300 text-sm leading-relaxed mb-5">{card.text}</p>
                <div className="grid sm:grid-cols-3 gap-2 mb-5">
                  {card.kpis.map((kpi) => (
                    <div key={kpi} className="bg-black/25 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-medium">
                      {kpi}
                    </div>
                  ))}
                </div>
                <a
                  href={encodeWhatsApp(card.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  {card.name} {copy.startPilot}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="bg-gradient-to-r from-cyan-950/40 via-neutral-900 to-orange-950/40 border border-cyan-900/40 rounded-3xl p-6 sm:p-8">
          <p className="text-cyan-300 text-xs font-semibold tracking-[0.2em] uppercase mb-3">{copy.plan90}</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-8">{copy.measurable}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: copy.week1, text: isEn ? 'Category and seller selection, product card copy, KPI tagging.' : 'Kategori ve satıcı seçimi, ürün kartı metni, KPI etiketleme.' },
              { step: copy.week2, text: isEn ? 'Pilot launch, A/B tests, daily performance tracking.' : 'Pilot yayını, A/B test, günlük performans takibi.' },
              { step: copy.week3, text: isEn ? 'Conversion optimization, seller trainings, creative improvements.' : 'Dönüşüm optimizasyonu, satıcı eğitimleri, kreatif iyileştirme.' },
              { step: copy.week4, text: isEn ? 'ROI report, executive presentation and scale decision.' : 'ROI raporu, yönetici sunumu ve ölçekleme kararı.' },
            ].map((item) => (
              <article key={item.step} className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4">
                <p className="text-cyan-300 font-semibold mb-2">{item.step}</p>
                <p className="text-sm text-neutral-300 leading-relaxed">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-20 text-center">
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">
            {copy.closingA}
            <span className="block bg-gradient-to-r from-cyan-300 via-emerald-300 to-orange-300 bg-clip-text text-transparent">
              {copy.closingB}
            </span>
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-8">
            {copy.closingDesc}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href={encodeWhatsApp(
                isEn
                  ? 'Hello QRNote, we want to start the marketplace pilot this month. Let us plan a meeting.'
                  : 'Merhaba QRNote, pazaryeri pilotunu bu ay baslatmak istiyoruz. Toplanti planlayalim.'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all"
            >
              {copy.waPilot}
            </a>
            <Link
              href={`/?lang=${lang}`}
              className="inline-flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-7 py-3.5 rounded-2xl border border-neutral-700 transition-all"
            >
              {copy.backHome}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
