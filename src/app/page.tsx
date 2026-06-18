import Link from 'next/link'
import HeroDemoAudioPlayer from '@/components/HeroDemoAudioPlayer'

type Lang = 'tr' | 'en'

const promoVideoSrc = '/qrnot-intro.mp4'

function waHref(text: string) {
  return `https://wa.me/905433929230?text=${encodeURIComponent(text)}`
}

const HOME_COPY: Record<Lang, {
  navHow: string
  navSolutions: string
  navMarketplace: string
  navLogin: string
  heroBadge: string
  heroTitle: string
  heroAccent: string
  heroDesc: string
  heroDescStrong: string
  heroDescTail: string
  promoTag: string
  promoTitle: string
}> = {
  tr: {
    navHow: 'Nasıl çalışır?',
    navSolutions: 'Kurumsal Çözümler',
    navMarketplace: 'Pazaryeri Partnerliği',
    navLogin: 'Giriş',
    heroBadge: '🎧 QRNot deneyimi: Fiziksel ürün + dijital merak etkisi',
    heroTitle: 'Hediyene',
    heroAccent: 'bir ses ver',
    heroDesc: 'QR kodlu anahtarlık, bileklik veya sticker.',
    heroDescStrong: 'Tarayanlar anında ses, video, resim ve linklerine ulaşır.',
    heroDescTail: 'Uygulama indirmeleri gerekmez. İstediğin zaman güncelle.',
    promoTag: 'QRNot Tanıtım',
    promoTitle: 'Kısa Video: Tek QR ile Duyguyu Ulaştır',
  },
  en: {
    navHow: 'How it works',
    navSolutions: 'Business Solutions',
    navMarketplace: 'Marketplace Partnership',
    navLogin: 'Login',
    heroBadge: '🎧 QRNot experience: Physical product + digital curiosity',
    heroTitle: 'Give your gift',
    heroAccent: 'a voice',
    heroDesc: 'QR-enabled keychains, wristbands, or stickers.',
    heroDescStrong: 'Scanners instantly access audio, video, images, and links.',
    heroDescTail: 'No app download required. Update anytime.',
    promoTag: 'QRNot Intro',
    promoTitle: 'Short Video: Deliver Emotion with a Single QR',
  },
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const lang: Lang = params.lang === 'en' ? 'en' : 'tr'
  const copy = HOME_COPY[lang]
  const isEn = lang === 'en'
  const whatsappOrderHref = waHref(
    isEn
      ? 'Hello QRNot, I want to place an individual QR order for 149 TL.'
      : 'Merhaba QRNot, 149 TL bireysel QR siparisi vermek istiyorum.'
  )
  const whatsappContactHref = waHref(
    isEn
      ? 'Hello QRNot, I would like to discuss your business solutions.'
      : 'Merhaba QRNot, kurumsal cozumler icin sizinle gorusmek istiyorum.'
  )
  const whatsappDirectHref = waHref(
    isEn
      ? 'Hello SCE Innovation, I want information about QRNot.'
      : 'Merhaba SCE Innovation, QRNot hakkinda bilgi almak istiyorum.'
  )

  const text = {
    vibe: isEn ? 'Scan once and trigger voice, video, story and brand impact together.' : 'Tek tarama ile ses, video, hikâye ve marka etkisini aynı anda hissettir.',
    chips: isEn ? ['🎙️ Voice Memory', '🎬 Video Message', '🔗 Smart Link', '🧠 Curiosity Effect'] : ['🎙️ Sesli Anı', '🎬 Video Mesaj', '🔗 Akıllı Link', '🧠 Merak Etkisi'],
    ctaCreate: isEn ? 'Create Free Account' : 'Ücretsiz Hesap Aç',
    ctaHow: isEn ? 'How it works? →' : 'Nasıl çalışır? →',
    ctaOffer: isEn ? 'Get Offer Now' : 'Hemen Teklif Al',
    scanPlay: isEn ? 'Scan & play' : 'Tara ve oynat',
    momVoice: isEn ? 'My Mom\'s Voice ❤️' : 'Annemin Sesi ❤️',
    listens: isEn ? '2 hours ago · 47 listens' : '2 saat önce · 47 dinleme',
    noApp: isEn ? '✓ No app required' : '✓ Uygulama gerekmez',
    alwaysUpdated: isEn ? 'Always up to date' : 'Her zaman güncel',
    mp4Public: isEn ? 'MP4 / Public' : 'MP4 / Public',
    videoFallback: isEn ? 'Your browser does not support the video tag.' : 'Tarayıcınız video etiketini desteklemiyor.',
    individualTitle: isEn ? 'Try Demo First, Then Buy' : 'Önce Demo, Sonra Satın Al',
    individualTag: isEn ? 'Individual User' : 'Bireysel Kullanıcı',
    individualDesc: isEn ? 'Individual users first create a free account and test with 1 real QR credit. After purchase, new credits are added to the same account.' : 'Bireysel kullanıcı önce ücretsiz hesap açar ve 1 gerçek QR hakkı ile sistemi test eder. Satın alma yapıldığında aynı hesaba yeni hak eklenir ve aynı kullanıcı üzerinden devam eder.',
    packageTitle: isEn ? 'Individual Package' : 'Bireysel Paket',
    packageDesc: isEn ? 'Create account, generate 1 free QR, scan, claim and test your voice. Then top up credits on the same account.' : 'Önce hesap aç, 1 ücretsiz QR oluştur, okut, sahiplen ve sesini dene. Sonra aynı hesaba yeni hak eklet.',
    packagePrice: isEn ? '1 QR = 149 TL. After free credit ends, purchased credits are added to your balance.' : '1 QR = 149 TL. Ücretsiz hak bittiğinde satın alma sonrası hak bakiyesi artar.',
    startFlow: isEn ? 'Start with Free Account' : 'Ücretsiz Hesapla Başla',
    corpTag: isEn ? 'Corporate Production' : 'Kurumsal Üretim',
    corpTitle: isEn ? 'Bulk QR production for partners only' : 'Toplu QR üretimi sadece iş ortakları için',
    corpDesc: isEn ? 'Bulk QR production is managed through the admin panel. Labeling, delivery and operation planning are designed together.' : 'Çoklu QR üretimi admin panelinden yönetilir. Kurumsal akışta etiketleme, teslim ve operasyon planı birlikte kurgulanır.',
    freeMember: isEn ? 'Free Membership' : 'Ücretsiz Üyelik',
    freeTitle: isEn ? 'Open account and test with 1 free real QR' : 'Hesap aç, 1 ücretsiz gerçek QR ile sistemi test et',
    freeDesc: isEn ? 'Create your account, generate QR, scan, leave first voice message and see claim link. Continue by adding credits to same account.' : 'Hesabını oluştur, QR üret, okut, ilk ses kaydını bırak ve sahip linkini gör. Ücretsiz hak bittiğinde aynı hesaba yeni hak satın alarak devam edebilirsin.',
    openFlow: isEn ? 'Open Account Flow' : 'Hesap Akışını Aç',
    freeRules: isEn ? 'Free Usage Rules' : 'Ücretsiz Kullanım Kuralları',
    freeItems: isEn ? ['1 free QR per account', 'Credits are tied to user account', 'Real claim and management flow enabled', 'After purchase, credits are added to same account'] : ['Her hesap için 1 ücretsiz QR', 'Haklar kullanıcı hesabına bağlıdır', 'Gerçek claim ve yönetim akışı açık', 'Satın alma sonrası aynı hesaba hak eklenir'],
    stats: isEn ? ['Updatable', 'App required', 'Load time'] : ['Güncellenebilir', 'Uygulama gerekli', 'Yükleme süresi'],
    ready3: isEn ? 'Ready in 3 steps' : '3 adımda hazır',
    noTech: isEn ? 'No technical knowledge needed.' : 'Teknik bilgi gerekmez. Ciddi hiçbir şey gerekmez.',
    whoFor: isEn ? 'Who is it for?' : 'Kim için?',
    magic: isEn ? 'Physical product + voice = magic.' : 'Fiziksel bir ürün + ses = sihir.',
    newFeatures: isEn ? 'New Features' : 'Yeni Özellikler',
    mediaExp: isEn ? 'Multi-media QR Experience' : 'Çoklu Medya QR Deneyimi',
    mediaDesc: isEn ? 'Now you can publish audio, video, image and platform links in a single QR.' : 'Artık tek bir QR içinde ses, video, resim ve platform bağlantılarını birlikte yayınlayabilirsin.',
    livePreview: isEn ? 'Live Preview' : 'Canlı Önizleme',
    livePreviewDesc: isEn ? 'This is how media cards appear after scan.' : 'QR tarandığında medya kartları bu şekilde görünür',
    activeCard: isEn ? 'Active Card: Voice Message' : 'Aktif Kart: Ses Mesajı',
    partnerFor: isEn ? 'For Partners' : 'İş Ortakları İçin',
    b2bTitleA: isEn ? 'Add voice to' : 'Ürünlerinize',
    b2bTitleB: isEn ? 'your products' : 'ses katın',
    contactMail: isEn ? 'Contact us: sce@scegrup.com' : 'Bizimle iletişime geç mail: sce@scegrup.com',
    marketplaceDeck: isEn ? 'View Marketplace Deck' : 'Pazaryeri Sunumunu İncele',
    corpPack: isEn ? 'Corporate Package' : 'Kurumsal Paket',
    corpPlan: isEn ? 'Corporate Plan' : 'Kurumsal Plan',
    contactPay: isEn ? 'Contact & Payment Information' : 'İletişim & Ödeme Bilgileri',
    buySupport: isEn ? 'Reach us via channels below for slot purchase or support.' : 'Slot satın almak veya destek almak için aşağıdaki kanallardan ulaşın.',
    privacy: isEn ? 'Privacy Policy' : 'Gizlilik Politikası',
    terms: isEn ? 'Terms of Use' : 'Kullanım Koşulları',
    contact: isEn ? 'Contact' : 'İletişim',
    finalA: isEn ? 'It\'s time for your keychain' : 'Anahtarlığın',
    finalB: isEn ? 'to speak' : 'konuşma vakti',
    finalDesc: isEn ? 'Physical products can now carry digital voices.' : 'Fiziksel ürünler artık dijital sesler taşıyabilir.',
    footerTag: isEn ? 'Voice memories, permanent QR codes' : 'Sesli anılar, kalıcı QR kodlar',
    waSupport: isEn ? 'WhatsApp Support' : 'WhatsApp Destek',
    foundedBy: isEn ? 'Founded by SCE Group' : 'SCE Grup kuruluşudur',
  }

  const corporateSectors = isEn
    ? [
        { icon: '🏨', title: 'Hotel Solutions', desc: 'Room-based QR with housekeeping/technical/taxi requests and real-time operations.', href: `/hotel?lang=${lang}` },
        { icon: '🏥', title: 'Healthcare Solutions', desc: 'Patient info, in-clinic guidance and device instructions in one QR.', href: `/health?lang=${lang}` },
        { icon: '🎓', title: 'Education Solutions', desc: 'Faster announcements, materials and media delivery for schools and courses.', href: `/education?lang=${lang}` },
        { icon: '🏭', title: 'Factory Solutions', desc: 'Standardize safety, machine instructions and maintenance flow on production lines.', href: `/factory?lang=${lang}` },
        { icon: '🛍️', title: 'Retail Solutions', desc: 'Merge product story, campaigns and customer experience in one physical-digital layer.', href: `/retail?lang=${lang}` },
        { icon: '🚚', title: 'Logistics Solutions', desc: 'Quick-access QR labeling flow for warehouse, shipment and delivery processes.', href: `/logistics?lang=${lang}` },
      ]
    : [
        { icon: '🏨', title: 'Otel Çözümleri', desc: 'Oda bazlı QR, housekeeping/teknik/taksi talepleri ve anlık operasyon yönetimi.', href: `/hotel?lang=${lang}` },
        { icon: '🏥', title: 'Sağlık Çözümleri', desc: 'Hasta bilgilendirme, klinik içi yönlendirme ve cihaz kullanım talimatlarını tek QR\'da sunar.', href: `/health?lang=${lang}` },
        { icon: '🎓', title: 'Eğitim Çözümleri', desc: 'Okul ve kurslar için duyuru, materyal ve sesli/video içerik dağıtımını hızlandırır.', href: `/education?lang=${lang}` },
        { icon: '🏭', title: 'Fabrika Çözümleri', desc: 'Üretim hatlarında iş güvenliği, cihaz talimatı ve bakım akışını standartlaştırır.', href: `/factory?lang=${lang}` },
        { icon: '🛍️', title: 'Perakende Çözümleri', desc: 'Ürün hikayesi, kampanya ve müşteri deneyimini fiziksel ürünle dijitalde birleştirir.', href: `/retail?lang=${lang}` },
        { icon: '🚚', title: 'Lojistik Çözümleri', desc: 'Depo, sevkiyat ve teslimat süreçlerinde hızlı erişimli QR etiket akışı kurar.', href: `/logistics?lang=${lang}` },
      ]

  const mediaItems = [
    ...(isEn
      ? [
          { name: 'Voice', badge: 'Audio', logo: <span className="text-2xl" aria-hidden>🎙️</span>, desc: 'Record or upload an audio file' },
          { name: 'Video', badge: 'Video', logo: <span className="text-2xl" aria-hidden>🎬</span>, desc: 'Stronger storytelling with video' },
          { name: 'Image', badge: 'Image', logo: <span className="text-2xl" aria-hidden>🖼️</span>, desc: 'Upload photo or visual' },
        ]
      : [
          { name: 'Ses', badge: 'Audio', logo: <span className="text-2xl" aria-hidden>🎙️</span>, desc: 'Kayıt al veya ses dosyası yükle' },
          { name: 'Video', badge: 'Video', logo: <span className="text-2xl" aria-hidden>🎬</span>, desc: 'Video kaydı ile daha güçlü anlatım' },
          { name: 'Resim', badge: 'Image', logo: <span className="text-2xl" aria-hidden>🖼️</span>, desc: 'Fotoğraf veya görsel yükle' },
        ]),
    {
      name: 'YouTube',
      badge: 'Embed',
      logo: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" />
          <path d="M10 9l6 3-6 3V9z" fill="white" />
        </svg>
      ),
      desc: isEn ? 'Show video content as cards' : 'Video içeriklerini kart olarak göster',
    },
    {
      name: 'Spotify',
      badge: 'Embed',
      logo: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="11" fill="#1DB954" />
          <path d="M7 10.2c3.4-1 6.9-.7 10 .8" stroke="#0A0A0A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M7.9 12.7c2.8-.8 5.6-.6 8.1.6" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M8.8 15c2-.5 4-.4 5.8.4" stroke="#0A0A0A" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>
      ),
      desc: isEn ? 'Open playlists and tracks with one tap' : 'Playlist ve şarkıları tek dokunuşla aç',
    },
    { name: 'Link', badge: 'External', logo: <span className="text-2xl" aria-hidden>🔗</span>, desc: isEn ? 'Extra page, catalog or campaign link' : 'Ek sayfa, katalog veya kampanya bağlantısı' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden">

      <section className="relative z-10 px-4 pt-6 max-w-5xl mx-auto">
        <div className="headline-glass rounded-2xl px-5 py-3 text-center text-sm text-neutral-100">
          <span className="font-semibold text-cyan-200">QRNot Global Vibe:</span> {text.vibe}
        </div>
      </section>

      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-700/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-violet-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-end px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-end">
          <a href="#nasil-calisir" className="text-neutral-500 hover:text-neutral-300 text-xs sm:text-sm transition-colors">
            {copy.navHow}
          </a>
          <a href="#kurumsal-cozumler" className="text-neutral-500 hover:text-neutral-300 text-xs sm:text-sm transition-colors">
            {copy.navSolutions}
          </a>
          <Link href={`/partnerlik?lang=${lang}`} className="text-neutral-500 hover:text-neutral-300 text-xs sm:text-sm transition-colors">
            {copy.navMarketplace}
          </Link>
          <div className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900/70 p-1">
            <Link href="/?lang=tr" className={`px-2 py-1 text-xs rounded ${lang === 'tr' ? 'bg-cyan-500/30 text-cyan-100' : 'text-neutral-400 hover:text-white'}`}>
              TR
            </Link>
            <Link href="/?lang=en" className={`px-2 py-1 text-xs rounded ${lang === 'en' ? 'bg-cyan-500/30 text-cyan-100' : 'text-neutral-400 hover:text-white'}`}>
              EN
            </Link>
          </div>
          <Link
            href="/account"
            className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-cyan-300/40 shadow-lg shadow-fuchsia-900/40"
          >
            {copy.navLogin}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 text-center px-4 pt-20 pb-24 max-w-5xl mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-300/30 rounded-full px-4 py-1.5 text-cyan-200 text-sm font-medium mb-10 curiosity-glow">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse inline-block" />
          {copy.heroBadge}
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.95] tracking-tight curiosity-glow">
          {copy.heroTitle}<br />
          <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
            {copy.heroAccent}
          </span>
        </h1>

        <p className="text-neutral-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          {copy.heroDesc}{' '}
          <span className="text-white">{copy.heroDescStrong}</span>{' '}
          {copy.heroDescTail}
        </p>

        <div className="flex items-center justify-center gap-3 mb-8 text-sm text-neutral-200 flex-wrap">
          {text.chips.map((chip) => (
            <span key={chip} className="rounded-full border border-cyan-300/35 bg-cyan-950/40 px-3 py-1">{chip}</span>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap mb-20">
          <Link
            href="/account"
            className="bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-8 py-4 rounded-2xl transition-all active:scale-95 text-base shadow-2xl"
          >
            {text.ctaCreate}
          </Link>
          <a
            href="#nasil-calisir"
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all active:scale-95 text-base shadow-2xl shadow-violet-900/50"
          >
            {text.ctaHow}
          </a>
          <a
            href={whatsappOrderHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 px-6 py-4 text-base transition-colors"
          >
            {text.ctaOffer}
          </a>
        </div>

        {/* Visual — phone mockup */}
        <div className="flex justify-center items-end gap-6 sm:gap-10">

          {/* Left card — keychain */}
          <div className="hidden sm:flex flex-col items-center gap-3 opacity-60 mb-4">
            <div className="w-16 h-28 bg-neutral-800 rounded-2xl border border-neutral-700 flex items-center justify-center">
              <span className="text-3xl">🔑</span>
            </div>
            <div className="bg-white rounded-lg p-1.5 shadow-xl">
              <div className="w-10 h-10 grid grid-cols-5 gap-px">
                {[1,1,1,1,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,0,0,1, 1,1,1,1,1].map((v,i) => (
                  <div key={i} className={`rounded-sm ${v ? 'bg-neutral-900' : 'bg-white'}`} />
                ))}
              </div>
            </div>
            <p className="text-neutral-600 text-xs">{text.scanPlay}</p>
          </div>

          {/* Center — phone */}
          <div className="relative">
            <div className="w-60 sm:w-72 bg-neutral-900 rounded-[2.5rem] border border-neutral-700/60 p-3 shadow-2xl shadow-black/60 wow-ring">
              {/* Phone notch */}
              <div className="flex justify-center mb-2">
                <div className="w-20 h-1.5 bg-neutral-700 rounded-full" />
              </div>
              {/* App screen */}
              <div className="bg-neutral-950 rounded-[2rem] px-5 py-8 text-center">
                <div className="w-14 h-14 bg-violet-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                  <span className="text-2xl">🎙️</span>
                </div>
                <p className="text-white font-semibold text-sm mb-1">{text.momVoice}</p>
                <p className="text-neutral-600 text-xs mb-5">{text.listens}</p>

                <HeroDemoAudioPlayer />

                <p className="text-neutral-700 text-xs mt-4">qrnot.com/q/xK9mP2</p>
              </div>
            </div>

            {/* QR badge floating */}
            <div className="absolute -top-3 -right-3 bg-white rounded-xl p-2 shadow-2xl shadow-black/50 curiosity-glow">
              <div className="w-12 h-12 grid grid-cols-5 gap-px">
                {[1,1,1,1,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,0,0,1, 1,1,1,1,1].map((v,i) => (
                  <div key={i} className={`rounded-sm ${v ? 'bg-neutral-900' : 'bg-white'}`} />
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -bottom-2 -left-10 bg-green-950 border border-green-800 rounded-xl px-3 py-1.5 text-green-400 text-xs font-medium whitespace-nowrap">
              {text.noApp}
            </div>
          </div>

          {/* Right card — sticker */}
          <div className="hidden sm:flex flex-col items-center gap-3 opacity-60 mb-4">
            <div className="w-16 h-28 bg-neutral-800 rounded-2xl border border-neutral-700 flex items-center justify-center">
              <span className="text-3xl">🎁</span>
            </div>
            <div className="bg-white rounded-lg p-1.5 shadow-xl">
              <div className="w-10 h-10 grid grid-cols-5 gap-px">
                {[1,1,1,1,1, 1,0,1,0,1, 1,1,0,1,1, 1,0,1,0,1, 1,1,1,1,1].map((v,i) => (
                  <div key={i} className={`rounded-sm ${v ? 'bg-neutral-900' : 'bg-white'}`} />
                ))}
              </div>
            </div>
            <p className="text-neutral-600 text-xs">{text.alwaysUpdated}</p>
          </div>

        </div>
      </section>

      <section className="relative z-10 px-4 pb-10 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-cyan-500/30 bg-neutral-900/70 p-5 sm:p-6 wow-ring">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-cyan-300 text-xs font-semibold tracking-[0.18em] uppercase">{copy.promoTag}</p>
              <h2 className="text-white text-xl sm:text-2xl font-black mt-1">{copy.promoTitle}</h2>
            </div>
            <span className="hidden sm:inline-flex rounded-full border border-fuchsia-400/40 bg-fuchsia-900/25 px-3 py-1 text-[11px] text-fuchsia-200">{text.mp4Public}</span>
          </div>

          <div className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-neutral-700 bg-black">
            <video
              className="w-full h-auto"
              controls
              preload="metadata"
              playsInline
              muted
            >
              <source src={promoVideoSrc} type="video/mp4" />
              {text.videoFallback}
            </video>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-10 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 wow-ring">
            <p className="text-violet-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">{text.individualTag}</p>
            <h2 className="text-white text-2xl font-black mb-3">{text.individualTitle}</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-5">
              {text.individualDesc}
            </p>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 mb-5">
              <p className="text-white font-semibold mb-1">{text.packageTitle}</p>
              <p className="text-neutral-500 text-sm mb-3">{text.packageDesc}</p>
              <p className="text-violet-400 text-sm font-medium">{text.packagePrice}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/account"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-6 py-3 rounded-2xl transition-all active:scale-95"
              >
                {text.startFlow}
              </Link>
              <a
                href={whatsappOrderHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-2xl transition-all active:scale-95"
              >
                {text.ctaOffer}
              </a>
            </div>
          </div>

          <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 wow-ring">
            <p className="text-green-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">{text.corpTag}</p>
            <h2 className="text-white text-2xl font-black mb-3">{text.corpTitle}</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-5">
              {text.corpDesc}
            </p>
            <a
              href={whatsappContactHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-2xl transition-all active:scale-95"
            >
              {text.ctaOffer}
            </a>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-8 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-violet-950/60 border border-emerald-800/30 rounded-3xl p-8 sm:p-10 wow-ring">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">{text.freeMember}</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">{text.freeTitle}</h2>
              <p className="text-neutral-400 leading-relaxed mb-6">
                {text.freeDesc}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-7 py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  {text.openFlow}
                </Link>
                <a
                  href={whatsappOrderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  {text.ctaOffer}
                </a>
              </div>
            </div>
            <div className="bg-black/20 border border-white/10 rounded-3xl p-6">
              <p className="text-white font-semibold mb-3">{text.freeRules}</p>
              <div className="space-y-3 text-sm text-neutral-300">
                {text.freeItems.map((item) => <p key={item}>{item}</p>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="relative z-10 border-y border-neutral-800/60 bg-neutral-900/30 py-6">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          {[
            { n: '∞', label: text.stats[0] },
            { n: '0', label: text.stats[1] },
            { n: isEn ? '< 3s' : '< 3 sn', label: text.stats[2] },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-black text-violet-400">{s.n}</p>
              <p className="text-neutral-600 text-xs sm:text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="nasil-calisir" className="relative z-10 px-4 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">{text.ready3}</h2>
          <p className="text-neutral-500 text-lg">{text.noTech}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {(isEn
            ? [
                { n: '01', icon: '📦', title: 'Get Your QR Product', desc: 'Keychain, wristband, sticker, or any physical item with a unique QR code.', color: 'from-violet-600/20 to-transparent' },
                { n: '02', icon: '🎙️', title: 'Claim on First Scan', desc: 'The first scanner records the voice. Even 10 seconds is enough. Claim link is generated automatically.', color: 'from-purple-600/20 to-transparent' },
                { n: '03', icon: '🔊', title: 'Everyone Hears It', desc: 'Anyone scanning this QR hears your voice. Update the note anytime; QR code stays the same.', color: 'from-fuchsia-600/20 to-transparent' },
              ]
            : [
                { n: '01', icon: '📦', title: 'QR Ürünü Al', desc: 'Anahtarlık, bileklik, sticker veya herhangi bir fiziksel ürün. Üzerinde senin için oluşturulmuş benzersiz bir QR kodu var.', color: 'from-violet-600/20 to-transparent' },
                { n: '02', icon: '🎙️', title: 'İlk Taramada Sahiplen', desc: 'QR kodu ilk tarayan kişi sesini kaydeder. 10 saniye bile yeterli. Sahip linki otomatik oluşur, kaybetme.', color: 'from-purple-600/20 to-transparent' },
                { n: '03', icon: '🔊', title: 'Herkes Duyar', desc: 'Artık bu QR\'ı tarayan herkes sesini duyar. Notu güncellersen eski ses silinir, yenisi yerine geçer. QR kodu hiç değişmez.', color: 'from-fuchsia-600/20 to-transparent' },
              ]).map(step => (
            <div key={step.n} className={`bg-gradient-to-b ${step.color} bg-neutral-900 border border-neutral-800 rounded-3xl p-7 relative overflow-hidden`}>
              <span className="absolute top-5 right-5 text-neutral-800/80 text-5xl font-black select-none">{step.n}</span>
              <div className="text-4xl mb-5">{step.icon}</div>
              <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <h2 className="text-center text-3xl sm:text-4xl font-black text-white mb-4">{text.whoFor}</h2>
        <p className="text-center text-neutral-500 mb-12">{text.magic}</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(isEn
            ? [
                { emoji: '🔑', title: 'Keychain', desc: 'A personal voice message for your loved one.' },
                { emoji: '🎁', title: 'Gift', desc: 'A gift with surprise voice.' },
                { emoji: '👶', title: 'Baby Memory', desc: 'First words, first laughs.' },
                { emoji: '💍', title: 'Special Moments', desc: 'Proposal, engagement, anniversary.' },
              ]
            : [
                { emoji: '🔑', title: 'Anahtarlık', desc: 'Sevdiğine kişisel sesli mesaj.' },
                { emoji: '🎁', title: 'Hediye', desc: 'Sürpriz sesi olan hediye.' },
                { emoji: '👶', title: 'Bebek Anısı', desc: 'İlk kelimeler, ilk gülüşler.' },
                { emoji: '💍', title: 'Özel Anlar', desc: 'Söz, nişan, yıldönümü.' },
              ]).map(uc => (
            <div
              key={uc.title}
              className="group bg-neutral-900/60 border border-neutral-800 hover:border-violet-700/50 rounded-2xl p-5 text-center transition-all hover:bg-neutral-900"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{uc.emoji}</div>
              <h3 className="text-white font-semibold mb-1">{uc.title}</h3>
              <p className="text-neutral-600 text-sm">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <p className="text-violet-400 text-xs font-semibold tracking-[0.18em] uppercase mb-3">{text.newFeatures}</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">{text.mediaExp}</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto text-sm sm:text-base">
              {text.mediaDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-6 gap-3 mb-8">
            {mediaItems.map((item) => (
              <div key={item.name} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
                <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto mb-3">
                  {item.logo}
                </div>
                <p className="text-white font-semibold text-sm">{item.name}</p>
                <p className="text-neutral-500 text-xs mt-1">{item.desc}</p>
                <span className="inline-flex mt-3 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] uppercase tracking-[0.16em]">
                  {item.badge}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                  <p className="text-white font-semibold text-sm">{text.livePreview}</p>
                  <p className="text-neutral-500 text-xs">{text.livePreviewDesc}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/25 px-3 py-1 text-[11px] text-violet-300">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                QR / Live View
              </span>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr] gap-4 items-start">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="bg-white rounded-xl p-2 w-24 mx-auto mb-3 shadow-lg">
                  <div className="w-20 h-20 grid grid-cols-5 gap-px">
                    {[1,1,1,1,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,0,0,1, 1,1,1,1,1].map((v,i) => (
                      <div key={i} className={`rounded-sm ${v ? 'bg-neutral-900' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-center text-white text-sm font-medium">{isEn ? 'Family Message' : 'Aile Mesajım'}</p>
                <p className="text-center text-neutral-500 text-xs mt-1">xK9mP2</p>
              </div>

              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {[
                    { icon: '🎙️', title: isEn ? 'Voice Message' : 'Ses Mesajı', style: 'bg-violet-600/15 border-violet-500/35 text-violet-200' },
                    { icon: '🎬', title: isEn ? 'Video Record' : 'Video Kaydı', style: 'bg-rose-600/15 border-rose-500/35 text-rose-200' },
                    { icon: '▶️', title: 'YouTube', style: 'bg-red-600/15 border-red-500/35 text-red-200' },
                    { icon: '🎵', title: 'Spotify', style: 'bg-green-600/15 border-green-500/35 text-green-200' },
                  ].map((item) => (
                    <div key={item.title} className={`border rounded-xl px-3 py-2.5 ${item.style}`}>
                      <p className="text-xs font-semibold flex items-center gap-2">
                        <span>{item.icon}</span>
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-sm font-semibold">{text.activeCard}</p>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 uppercase tracking-[0.16em]">Preview</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <button className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center">▶</button>
                      <div className="flex-1 h-1.5 rounded-full bg-neutral-700 overflow-hidden">
                        <div className="h-full w-2/5 bg-violet-500" />
                      </div>
                      <span className="text-xs text-neutral-500">1:23</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
              {(isEn
                ? [
                    { icon: '📱', title: 'One QR, multiple content', desc: 'After scan, media cards open: Voice, Video, YouTube, Spotify, Link.' },
                    { icon: '⚙️', title: 'Owner panel management', desc: 'Title, media and links are updated from one panel. QR stays constant.' },
                    { icon: '⏱️', title: 'Video duration control', desc: 'Default video limit is 2 minutes on standard accounts; can be extended in enterprise.' },
                    { icon: '🛡️', title: 'Platform validation', desc: 'YouTube and Spotify links are domain-validated to protect content quality.' },
                  ]
                : [
              {
                icon: '📱',
                title: 'Tek QR, çok içerik',
                desc: 'Kullanıcı tarayınca medya kartları açılır: Ses, Video, YouTube, Spotify, Link.',
              },
              {
                icon: '⚙️',
                title: 'Sahip panelinden yönetim',
                desc: 'Başlık, medya ve bağlantılar tek panelden güncellenir. QR kodu değişmez.',
              },
              {
                icon: '⏱️',
                title: 'Video süre kontrolü',
                desc: 'Standart hesapta varsayılan video limiti 2 dakikadır. Kurumsalda proje bazlı artırılabilir.',
              },
              {
                icon: '🛡️',
                title: 'Platform doğrulama',
                desc: 'YouTube ve Spotify linkleri domain kontrolünden geçer, içerik kalitesi korunur.',
              },
              ]).map(f => (
              <div key={f.title} className="flex items-start gap-4 p-5 rounded-2xl hover:bg-neutral-800/40 transition-colors">
                <span className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B SECTION */}
      <section id="kurumsal-cozumler" className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-violet-950/50 via-neutral-900 to-purple-950/50 border border-violet-800/30 rounded-3xl p-8 sm:p-12">
          <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-8 items-start">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-violet-600/15 border border-violet-500/20 rounded-full px-3 py-1 text-violet-400 text-xs font-medium mb-6">
              {text.partnerFor}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 leading-tight">
              {text.b2bTitleA}<br />{text.b2bTitleB}
            </h2>
            <p className="text-neutral-400 mb-6 leading-relaxed">
              {isEn
                ? 'Instead of keychains, wristbands, stickers, postcards or manuals, place speaking QR codes on products. Customers scan and instantly listen to voice explanations. For enterprise packages, production planning starts from 100 units.'
                : 'Anahtarlık, bileklik, sticker, kartpostal ya da kullanım kılavuzu yerine ürün üstünde konuşan QR kodlar. Müşteriniz QR\'ı tarar ve ürünün sesli anlatımını anında dinler. Kurumsal paketlerde minimum 100 adet ile üretim planı açıyoruz.'}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-7">
              {corporateSectors.map((sector) => (
                <Link
                  key={sector.title}
                  href={sector.href}
                  className="bg-neutral-950/70 border border-neutral-800 hover:border-violet-500/40 rounded-2xl p-4 transition-colors"
                >
                  <p className="text-2xl mb-2">{sector.icon}</p>
                  <p className="text-white font-semibold mb-1">{sector.title}</p>
                  <p className="text-neutral-500 text-xs leading-relaxed">{sector.desc}</p>
                </Link>
              ))}
            </div>

            {/* E‑Commerce Stores */}
            <div className="mb-6">
              <p className="text-sm text-emerald-400 font-semibold uppercase mb-3">{isEn ? 'Our E-Commerce Stores' : 'E‑Ticaret Mağazalarımız'}</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.hepsiburada.com/magaza/sce-innovation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 hover:border-violet-500/40 text-white rounded-2xl px-4 py-2 text-sm"
                >
                  <span className="text-lg">🛒</span>
                  {isEn ? 'Hepsiburada Store' : 'Hepsiburada'}
                </a>

                <a
                  href="https://www.trendyol.com/magaza/sce-innovation-m-1128695?channelId=1&sst=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 hover:border-violet-500/40 text-white rounded-2xl px-4 py-2 text-sm"
                >
                  <span className="text-lg">🛍️</span>
                  {isEn ? 'Trendyol Store' : 'Trendyol'}
                </a>
              </div>
            </div>

            <ul className="space-y-2 mb-8">
              {(isEn
                ? [
                    'Product storytelling, setup instructions and voice usage guide',
                    'Each QR has a unique permanent URL',
                    'No customer support needed — fully autonomous',
                    'Fast setup and support via WhatsApp',
                  ]
                : [
                    'Ürün anlatımı, kurulum talimatı ve sesli kullanım kılavuzu',
                    'Her QR benzersiz ve kalıcı URL',
                    'Müşteri destek gerektirmiyor — tam otonom',
                    'WhatsApp üzerinden hızlı kurulum ve destek',
                  ]).map(item => (
                <li key={item} className="flex items-center gap-2 text-neutral-400 text-sm">
                  <span className="text-violet-500 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:sce@scegrup.com?subject=QRNot%20Kurumsal%20%C3%87%C3%B6z%C3%BCmler"
                className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-7 py-3.5 rounded-2xl transition-all active:scale-95"
              >
                {text.contactMail}
              </a>
              <Link
                href={`/partnerlik?lang=${lang}`}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-violet-950/40"
              >
                {text.marketplaceDeck}
              </Link>
            </div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-3xl p-6 lg:p-7">
            <p className="text-violet-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">{text.corpPack}</p>
            <h3 className="text-white text-3xl font-black mb-2">{text.corpPlan}</h3>
            <p className="text-neutral-500 text-sm mb-4">{isEn ? 'Project-based planning is offered for producers, in-box manuals and voice-led product narration.' : 'Ureticiler, kutu ici kullanim kilavuzlari ve sesli urun anlatimi icin proje bazli planlama yapilir.'}</p>
            <div className="space-y-3 mb-6 text-sm text-neutral-300">
              <p>{isEn ? 'QR production and delivery workflow' : 'QR üretim ve teslim akışı'}</p>
              <p>{isEn ? 'Fixed voice explanation infrastructure per product' : 'Ürün başına sabit sesli anlatım altyapısı'}</p>
              <p>{isEn ? 'Recording duration can be extended if needed' : 'İstenirse kayıt süresi artırılabilir'}</p>
            </div>
            <a
              href={whatsappDirectHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-3.5 rounded-2xl transition-all active:scale-95"
            >
              Hemen Teklif Al
            </a>
          </div>
        </div>
      </div>
      </section>

      <section id="iletisim" className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">{text.contactPay}</h2>
            <p className="text-neutral-500">{text.buySupport}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <div className="inline-flex items-center gap-2 bg-violet-600/15 border border-violet-500/25 rounded-full px-3 py-1 text-violet-300 text-xs font-semibold mb-4">
                📬 {text.contact}
              </div>
              <h3 className="text-white font-bold text-lg mb-1">SCE INNOVATION LTD. ŞTİ.</h3>
              <p className="text-neutral-500 text-xs mb-5">Software Circuit Engineer</p>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-neutral-500 text-xs mb-1">📍 {isEn ? 'Address' : 'Adres'}</p>
                  <p className="text-white leading-relaxed">Çetin Emeç Bulvarı 25/3<br />Çankaya / Ankara</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-xs mb-1">✉️ {isEn ? 'Email' : 'E-posta'}</p>
                  <a href="mailto:sce@scegrup.com" className="text-violet-300 hover:text-violet-200 transition-colors">sce@scegrup.com</a>
                </div>
                <div>
                  <p className="text-neutral-500 text-xs mb-1">📞 {isEn ? 'Phone' : 'Telefon'}</p>
                  <a href="tel:+908508881889" className="text-white hover:text-neutral-300 transition-colors">+90 0850 888 1 889</a>
                </div>
                <div>
                  <p className="text-neutral-500 text-xs mb-1">💬 WhatsApp</p>
                  <p className="text-white">+90 543 392 92 30</p>
                </div>
              </div>

              <a
                href={whatsappDirectHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-3.5 rounded-2xl transition-all active:scale-95"
              >
                {text.ctaOffer}
              </a>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 lg:col-span-2">
              <div className="text-3xl mb-4">🏦</div>
              <h3 className="text-white font-bold text-lg mb-2">{isEn ? 'Bank / Transfer Information' : 'Banka / Havale Bilgileri'}</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-600 mb-1">{isEn ? 'Company Name' : 'Şirket Adı'}</p>
                  <p className="text-white font-medium">SCE Innovation Ltd.Şti</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">{isEn ? 'Bank' : 'Banka'}</p>
                  <p className="text-white font-medium">Türkiye Garanti Bankası</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">IBAN</p>
                  <p className="text-white font-medium break-all">TR48 0006 2000 7740 0006 2930 33</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">{isEn ? 'Account No' : 'Hesap No'}</p>
                  <p className="text-white font-medium">774-6293033</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">{isEn ? 'Branch' : 'Şube'}</p>
                  <p className="text-white font-medium">Etlik Şubesi</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">{isEn ? 'Card Payment' : 'Kart Ödeme'}</p>
                  <p className="text-white font-medium">VISA</p>
                </div>
              </div>
              <div className="mt-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <p className="text-neutral-400 text-sm">
                  {isEn
                    ? 'After payment, you can share your receipt and order details via WhatsApp. All collections are made on behalf of SCE Innovation Ltd.Şti.'
                    : 'Ödeme sonrası dekontunuzu ve sipariş detayınızı WhatsApp üzerinden paylaşabilirsiniz. Tüm tahsilatlar SCE Innovation Ltd.Şti adına alınır.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-8 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a href="#gizlilik-politikasi" className="bg-neutral-900 border border-neutral-800 hover:border-violet-700/50 text-white rounded-2xl px-4 py-3 text-sm font-semibold transition-colors">
            🔒 {text.privacy}
          </a>
          <a href="#kullanim-kosullari" className="bg-neutral-900 border border-neutral-800 hover:border-violet-700/50 text-white rounded-2xl px-4 py-3 text-sm font-semibold transition-colors">
            📋 {text.terms}
          </a>
          <a href="#kvkk" className="bg-neutral-900 border border-neutral-800 hover:border-violet-700/50 text-white rounded-2xl px-4 py-3 text-sm font-semibold transition-colors">
            🛡️ {isEn ? 'Data Protection (KVKK)' : 'KVKK'}
          </a>
          <a href="#iletisim" className="bg-neutral-900 border border-neutral-800 hover:border-violet-700/50 text-white rounded-2xl px-4 py-3 text-sm font-semibold transition-colors">
            📬 {text.contact}
          </a>
        </div>
      </section>

      <section id="gizlilik-politikasi" className="relative z-10 px-4 py-6 max-w-5xl mx-auto">
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 sm:p-8">
          <h3 className="text-white text-xl font-black mb-3">🔒 {text.privacy}</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            {isEn
              ? 'QRNot processes user data only for service delivery, security and legal obligations. Technical and administrative safeguards are applied to prevent unauthorized access, loss and misuse.'
              : 'QRNot, kullanıcı verilerini yalnızca hizmetin sunulması, güvenlik ve yasal yükümlülüklerin yerine getirilmesi amacıyla işler. Yetkisiz erişim, kayıp ve kötüye kullanımı önlemek için teknik ve idari güvenlik önlemleri uygulanır.'}
          </p>
        </div>
      </section>

      <section id="kullanim-kosullari" className="relative z-10 px-4 py-6 max-w-5xl mx-auto">
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 sm:p-8">
          <h3 className="text-white text-xl font-black mb-3">📋 {text.terms}</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            {isEn
              ? 'Users are responsible for the content entered while using the platform. Access may be limited or terminated in cases violating usage policies for security, continuity and quality standards.'
              : 'Platformun kullanımı sırasında girilen içeriklerden kullanıcı sorumludur. Hizmetin güvenliği, sürekliliği ve kalite standartları için kullanım politikalarına aykırı durumlarda erişim sınırlandırılabilir veya sonlandırılabilir.'}
          </p>
        </div>
      </section>

      <section id="kvkk" className="relative z-10 px-4 py-6 max-w-5xl mx-auto">
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 sm:p-8">
          <h3 className="text-white text-xl font-black mb-3">🛡️ {isEn ? 'Data Protection (KVKK)' : 'KVKK'}</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            {isEn
              ? 'Personal data is processed in accordance with explicit consent, contractual necessity and legal obligations under Law No. 6698 (KVKK). Data subjects can submit access, correction, deletion and objection requests via sce@scegrup.com.'
              : 'Kişisel veriler, 6698 sayılı KVKK kapsamında açık rıza, sözleşmesel gereklilik ve yasal yükümlülük ilkeleri doğrultusunda işlenir. Veri sahibi, erişim, düzeltme, silme ve itiraz haklarına ilişkin taleplerini sce@scegrup.com üzerinden iletebilir.'}
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 px-4 py-24 text-center max-w-3xl mx-auto">
        <div className="text-6xl mb-6">🎙️</div>
        <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
          {text.finalA}<br />
          <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent curiosity-glow">
            {text.finalB}
          </span>
        </h2>
        <p className="text-neutral-500 text-lg mb-10">
          {text.finalDesc}
        </p>
        <a
          href={whatsappOrderHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 py-5 rounded-2xl transition-all active:scale-95 text-lg shadow-2xl shadow-violet-900/50"
        >
          {text.ctaOffer}
        </a>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-neutral-900 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-700 text-sm">
          <div className="flex items-center gap-2">
            <span>🎙️</span>
            <span className="font-semibold text-neutral-600">QRNot</span>
          </div>
          <p>{text.footerTag}</p>
          <div className="flex items-center gap-4">
            <a href={whatsappOrderHref} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">
              {text.waSupport}
            </a>
            <a href="https://x.com/scegrup" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">
              X: @scegrup
            </a>
            <a href="https://instagram.com/qrnotcom/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">
              Instagram: @qrnotcom
            </a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-4 text-center text-neutral-600 text-sm">
          {text.foundedBy}{' '}
          <a href="https://scegrup.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-400 transition-colors">
            scegrup.com
          </a>
        </div>
      </footer>

    </div>
  )
}


