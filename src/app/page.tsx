import type { Metadata } from 'next'
import Link from 'next/link'
import ProductArt from '@/components/warm/ProductArt'
import ProductCard from '@/components/warm/ProductCard'
import { WarmPage } from '@/components/warm/SiteChrome'
import VoicePlayer from '@/components/warm/VoicePlayer'
import { PRODUCTS } from '@/lib/commerce/catalog'
import { getRequestLang } from '@/lib/i18n.server'
import { withLang, type Lang } from '@/lib/i18n'
import { MARKETPLACES, SITE_URL, whatsappHref } from '@/lib/site'
import { pageMeta } from '@/lib/seo'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  return pageMeta((await searchParams).lang, "/", {
    tr: { title: "QRNot — Hediyene Bir Ses Ver | Sesli Kolye ve Anahtarlık", description: "QR ve NFC'li kolye ve anahtarlıklara sesli mesaj, video ve fotoğraf ekle. Uygulama gerekmez, mesajını sonradan güncelle. Düğünler için dijital anı defteri." },
    en: { title: "QRNot — Give Your Gift a Voice | Voice Message Necklace & Keychain", description: "Add voice messages, video and photos to QR and NFC necklaces and keychains. No app needed, update your message anytime. Digital audio guestbook for weddings." },
  })
}

const C = {
  tr: {
    heroChip: '🎁 Anneler Günü, yıldönümü ve doğum günleri için',
    heroTitle: 'Hediyene',
    heroAccent: 'bir ses ver.',
    heroDesc:
      "Kolyenin ya da anahtarlığın arkasındaki QR'ı okutan, senin sesini duyar, videonu izler, fotoğraflarını görür. Uygulama gerekmez; mesajını sonradan güncelleyebilirsin (3 kayıt dahil).",
    ctaShop: 'Ürünleri gör',
    ctaFree: 'Dijital QR al',
    trust: ['Uygulama gerekmez', 'iPhone & Android', 'Sonradan güncellenebilir içerik', 'Hediye kutusunda gönderim'],
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
    featKicker: 'Yeni özellikler',
    featTitle: 'Bir QR’dan çok daha fazlası',
    featDesc: 'Hediyen verildikten sonra da yaşamaya devam eder. Hepsi uygulama gerektirmeden, telefonun tarayıcısında çalışır.',
    featBadge: { premium: 'Premium', guestbook: 'Anı defteri', new: 'Yeni' },
    features: [
      ['⏳', 'Zaman kapsülü', 'İçeriğin seçtiğin tarihe kadar kilitli kalır: “18 yaşına girince açılsın.” O güne kadar okutan geri sayımı görür.', 'new'],
      ['🔔', 'Okutulma bildirimi', 'Hediyen her açıldığında haberin olur. Bildirimler hesabına ve istersen telefonuna gelir.', 'new'],
      ['💬', 'Cevap ver', 'Hediyeyi alan kişi sana sesli ya da yazılı teşekkür bırakır. Cevapları sadece sen görürsün.', 'new'],
      ['👨‍👩‍👧', 'Grup hediyesi', 'Tek davet linkiyle ailen ve arkadaşların kendi mesajlarını aynı QR’a ekler. Sen onaylamadan hiçbiri görünmez.', 'new'],
      ['📍', 'Kayıp modu', 'Anahtarlık ya da evcil hayvan künyesi kaybolursa, bulan kişi izin verirse konumunu ve notunu tek dokunuşla sana gönderir.', 'new'],
      ['🌍', 'Yapay zekâ altyazı ve çeviri', 'Sesli mesajın yazıya dökülür; dinleyen kişi 8 dilde altyazıyla okur. Yurt dışındaki sevdiklerin için ideal.', 'premium'],
      ['🎬', 'Anı filmi', 'Misafirlerinin bıraktığı tüm anılar tam ekran bir filme dönüşür. Düğünün ertesi günü ailenle TV’de izle.', 'guestbook'],
      ['📺', 'Canlı anı duvarı', 'Etkinlik sırasında gelen anılar salondaki ekrana ya da projeksiyona canlı düşer, köşedeki QR yeni misafirleri davet eder.', 'guestbook'],
    ],
    premiumTitle: 'QRNot Premium',
    premiumDesc: 'Sınırsız içerik güncelleme ve yapay zekâ altyazı / çeviri. Tüm QR’ların için geçerli.',
    premiumPrice: '199 TL / yıl',
    premiumCta: 'Premium’u incele',
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
    gbPoints: ['Uygulama yok, misafir sadece okutur', 'Onay ve PIN ile tam kontrol', 'Yazdırılabilir masa kartları dahil', 'Canlı anı duvarı ve anı filmi'],
    gbCta: 'Anı defterini incele',
    nfcKicker: 'NFC',
    nfcTitle: 'Dokun, dinle.',
    nfcDesc:
      'NFC modellerinde kamerayı açmaya bile gerek yok: telefonu kolyeye ya da anahtarlığa yaklaştırmak yeterli. QR yedekte, NFC olmayan telefonlar da açabilir.',
    nfcCta: 'NFC ürünleri gör',
    previewKicker: 'Hediyeyi alan ne görür?',
    previewTitle: 'Okutur, sesini duyar.',
    previewDesc: 'QR okutulduğunda telefonda uygulama gerektirmeyen sade bir sayfa açılır. Sağdaki örneği şimdi dinleyebilirsin.',
    previewPoints: [
      ['🎙️', 'Sesin ilk sırada', 'Kaydettiğin mesaj tek dokunuşla çalar.'],
      ['🖼️', 'Fotoğraf ve video', 'Aynı sayfada anılarınız sekmeler halinde durur.'],
      ['💬', 'Sana cevap bırakır', 'Hediyeyi alan kişi sesli ya da yazılı teşekkür edebilir.'],
    ],
    previewPhone: {
      title: 'Annemin sesi ❤️',
      opened: '24 kez açıldı',
      tabs: ['Ses', 'Fotoğraf', 'Video'],
      note: '“Doğum günün kutlu olsun canım kızım. Uzakta olsam da sesim hep yanında.”',
      reply: 'Cevap bırak',
    },
    faqKicker: 'Sık sorulan sorular',
    faq: [
      ['Uygulama indirmek gerekiyor mu?', "Hayır. Telefonun kamerasıyla QR'ı okutmak (ya da NFC modellerde dokundurmak) yeterli. İçerik tarayıcıda açılır."],
      [
        'İçeriği sonradan değiştirebilir miyim?',
        "Evet. QR'ı ilk hazırladığında sana özel bir sahip linki verilir. Bu linkle sesini, videonu ve fotoğraflarını değiştirebilirsin: ilk kayıt dahil 3 içerik kaydı hakkın var, başlık ve iletişim bilgileri ise sınırsız güncellenir. Daha fazlası için bize yazabilirsin.",
      ],
      ['Ses ve video ne kadar süre saklanıyor?', 'İçeriğin sen silmediğin sürece saklanır; QR kodun ve sayfan için yenileme ücreti alınmaz.'],
      [
        'Premium üyelik ne sağlıyor?',
        'Premium (199 TL / yıl) ile tüm QR’larında içerik güncelleme sınırı kalkar ve sesli mesajların için yapay zekâ altyazı ve 8 dilde çeviri açılır. Zaman kapsülü, okutulma bildirimi, cevap, grup hediyesi ve kayıp modu ise tüm QR’larda ücretsizdir.',
      ],
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
        'Siparişler 1-3 iş gününde kargoya verilir. Kargo alıcı ödemelidir; kargo ücreti teslimatta kargo firmasına ödenir. Kullanılmamış ürünlerde 14 gün içinde iade hakkın var.',
      ],
    ],
    storesKicker: 'Mağazalarımız',
    storesTitle: 'QRNot pazaryerlerinde de',
    storesDesc: 'Alışveriş alışkanlığın hangisiyse oradan sipariş et. Tüm ürünler aynı QRNot hesabınla çalışır.',
    storesCta: 'Mağazaya git:',
    b2bKicker: 'Kurumsal',
    b2bTitle: 'İşletmeler için QR çözümleri',
    b2bDesc:
      'Her sektöre özel yönetim paneli: QR\'ları toplu üretirsin, içeriklerini tek yerden güncellersin, gelen talepleri ve kayıtları canlı izlersin. Okutan kişinin uygulama indirmesi gerekmez.',
    sectorQuote: 'Teklif al',
    sectorLogin: 'Panel girişi',
    sectorQuoteMsg: 'Merhaba QRNot, {sector} için QR çözümünüz hakkında bilgi ve teklif almak istiyorum.',
    b2bExtra: 'Toplu QR / NFC üretimi, logo baskısı ve pazaryeri sipariş entegrasyonu için bizimle iletişime geç.',
    sectors: [
      {
        icon: '🏨',
        name: 'Otel',
        href: '/hotel',
        desc: 'Her odaya bir QR: misafir resepsiyonu aramadan talebini iletir.',
        uses: ['Oda servisi siparişi', 'Temizlik, teknik ve concierge talebi', 'Canlı operasyon paneli, toplu oda QR üretimi'],
      },
      {
        icon: '🎓',
        name: 'Eğitim',
        href: '/education',
        desc: 'Sınıf kapısına, kitaba ya da panoya QR: öğrenci tek okutmayla ulaşır.',
        uses: ['QR ile sınıf yoklaması', 'Ders materyali, ses ve video anlatım', 'Ödev / quiz, duyuru ve destek talebi'],
      },
      {
        icon: '🏥',
        name: 'Sağlık',
        href: '/health',
        desc: 'Hasta ve personel için doğru bilgi, doğru yerde.',
        uses: ['İlaç ve tıbbi cihaz kullanım talimatı', 'Klinik yönlendirme, randevu ve taburculuk bilgisi', 'Hijyen denetimi ve acil durum protokolü'],
      },
      {
        icon: '🏭',
        name: 'Fabrika & üretim',
        href: '/factory',
        desc: 'Makinenin ya da ürettiğin ürünün üzerine QR: kılavuz hep elinin altında.',
        uses: [
          'Kullanım kılavuzu ve montaj videosu (video, görsel ya da PDF bağlantısı)',
          'İş güvenliği akışı, bakım ve arıza bildirimi',
          'Operatör eğitimi, kalite kontrol, bant ürün sayımı',
        ],
      },
      {
        icon: '🛍️',
        name: 'Perakende',
        href: '/retail',
        desc: 'Raf etiketindeki QR ürünü anlatır, mağaza ekibini düzenler.',
        uses: ['Ürün hikâyesi: tanıtım videosu, içerik, menşe', 'Fiyat ve kampanya kontrolü', 'Mağaza kontrol listesi, personel görevleri, müşteri anketi'],
      },
      {
        icon: '🚚',
        name: 'Lojistik',
        href: '/logistics',
        desc: 'Kolide, araçta ve depoda QR: her adım kayıt altında.',
        uses: ['Teslimat kanıtı ve hasar bildirimi', 'Araç kontrolü, rota devri, soğuk zincir takibi', 'Depo girişi, stok sayımı, gümrük evrakı'],
      },
    ],
    dppKicker: 'Yeni · AB ihracatı',
    dppTitle: 'Dijital Ürün Pasaportu (DPP)',
    dppDesc: 'AB’nin ESPR düzenlemesiyle ürünlere kademeli olarak dijital pasaport zorunlu hale geliyor. Tekstil, mobilya, elektronik ve batarya üreticileri için 8 dilli, sürümlü, QR / NFC ile açılan ürün pasaportları.',
    dppCta: 'DPP’yi incele',
    b2bCta: 'Kurumsal teklif al',
    bizCatalog: 'Kurumsal katalog',
    partner: 'Pazaryeri ortaklığı',
    finalTitle: 'Sevdiğin birine sesini hediye et.',
    finalCta: 'Hemen sipariş ver',
  },
  en: {
    heroChip: "🎁 For birthdays, anniversaries & Mother's Day",
    heroTitle: 'Give your gift',
    heroAccent: 'a voice.',
    heroDesc:
      'Whoever scans the QR on the back of the necklace or keychain hears your voice, watches your video, sees your photos. No app needed — and you can update your message later (3 recordings included).',
    ctaShop: 'Shop now',
    ctaFree: 'Get a digital QR',
    trust: ['No app needed', 'iPhone & Android', 'Updatable content', 'Gift-ready packaging'],
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
    featKicker: 'New features',
    featTitle: 'So much more than a QR code',
    featDesc: 'Your gift keeps living long after it is given. Everything runs in the phone browser, no app needed.',
    featBadge: { premium: 'Premium', guestbook: 'Guestbook', new: 'New' },
    features: [
      ['⏳', 'Time capsule', 'Your content stays locked until the date you choose: “open on her 18th birthday.” Until then, whoever scans sees a countdown.', 'new'],
      ['🔔', 'Scan alerts', 'Know every time your gift is opened. Alerts arrive in your account and, if you like, on your phone.', 'new'],
      ['💬', 'Reply', 'The recipient can leave you a voice or written thank-you. Only you can see replies.', 'new'],
      ['👨‍👩‍👧', 'Group gift', 'With one invite link, family and friends add their own messages to the same QR. Nothing shows until you approve it.', 'new'],
      ['📍', 'Lost mode', 'If a keychain or pet tag goes missing, the finder can send you their location and a note in one tap, with their permission.', 'new'],
      ['🌍', 'AI captions & translation', 'Your voice message is transcribed, and listeners can read captions in 8 languages. Perfect for loved ones abroad.', 'premium'],
      ['🎬', 'Memory film', 'Every memory your guests left turns into a full-screen film. Watch it on the TV with family the day after.', 'guestbook'],
      ['📺', 'Live memory wall', 'Memories appear live on the venue screen or projector during the event, and the corner QR invites new guests.', 'guestbook'],
    ],
    premiumTitle: 'QRNot Premium',
    premiumDesc: 'Unlimited content updates plus AI captions and translation, for all your QR codes.',
    premiumPrice: '199 TL / year',
    premiumCta: 'Explore Premium',
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
    gbPoints: ['No app — guests just scan', 'Full control with approval & PIN', 'Printable table cards included', 'Live memory wall and memory film'],
    gbCta: 'Explore the guestbook',
    nfcKicker: 'NFC',
    nfcTitle: 'Tap. Listen.',
    nfcDesc:
      "With NFC models you don't even need the camera: just hold a phone near the necklace or keychain. The QR is there as a backup for phones without NFC.",
    nfcCta: 'See NFC products',
    previewKicker: 'What does the recipient see?',
    previewTitle: 'They scan. They hear you.',
    previewDesc: 'Scanning the QR opens a clean page on the phone, no app needed. You can listen to the example on the right right now.',
    previewPoints: [
      ['🎙️', 'Your voice comes first', 'Your recorded message plays with a single tap.'],
      ['🖼️', 'Photos and video', 'Your memories sit on the same page, in tabs.'],
      ['💬', 'They can reply', 'The recipient can leave you a voice or written thank-you.'],
    ],
    previewPhone: {
      title: "Mom's voice ❤️",
      opened: 'Opened 24 times',
      tabs: ['Voice', 'Photo', 'Video'],
      note: '“Happy birthday, sweetheart. Even far away, my voice is always with you.”',
      reply: 'Leave a reply',
    },
    faqKicker: 'FAQ',
    faq: [
      ['Do I need an app?', 'No. Scanning the QR with the phone camera (or tapping NFC models) is enough. Content opens in the browser.'],
      [
        'Can I change the content later?',
        'Yes. When you first set up the QR you get a private owner link. Use it to change your voice, video and photos: 3 recordings are included (your first plus 2 updates), and the title and contact details can be edited without limit. Need more? Message us.',
      ],
      ['How long is my content kept?', 'Your content stays until you delete it; there is no renewal fee for your QR code and page.'],
      [
        'What does Premium include?',
        'Premium (199 TL / year) removes the content update limit on all your QR codes and unlocks AI captions and translation in 8 languages for your voice messages. Time capsule, scan alerts, replies, group gifts and lost mode are free on every QR.',
      ],
      ['What if I lose my owner link?', 'Use the 8-character recovery code from setup to get a new owner link. Lost that too? Message us on WhatsApp.'],
      [
        'Can anyone who scans see my content?',
        'Yes — anyone who scans sees the content, so add what you want to share with the recipient. Only you can change it.',
      ],
      ['Shipping & returns?', 'Orders ship within 1-3 business days. Shipping is paid by the recipient on delivery. Unused items can be returned within 14 days.'],
    ],
    storesKicker: 'Our stores',
    storesTitle: 'Find QRNot on marketplaces too',
    storesDesc: 'Shop wherever you prefer. Every product works with the same QRNot account.',
    storesCta: 'Visit',
    b2bKicker: 'Business',
    b2bTitle: 'QR solutions for businesses',
    b2bDesc:
      'A dedicated management panel for each industry: produce QR codes in bulk, update their content from one place and follow requests and records live. No app needed for whoever scans.',
    sectorQuote: 'Get a quote',
    sectorLogin: 'Panel login',
    sectorQuoteMsg: 'Hello QRNot, I would like information and a quote for your {sector} QR solution.',
    b2bExtra: 'Contact us for bulk QR / NFC production, logo printing and marketplace order integration.',
    sectors: [
      {
        icon: '🏨',
        name: 'Hotels',
        href: '/hotel',
        desc: 'A QR in every room: guests send requests without calling reception.',
        uses: ['Room service orders', 'Housekeeping, maintenance and concierge requests', 'Live operations panel, bulk room QR production'],
      },
      {
        icon: '🎓',
        name: 'Education',
        href: '/education',
        desc: 'A QR on the classroom door, book or board — one scan away.',
        uses: ['QR class attendance', 'Lesson materials, audio and video explanations', 'Homework / quizzes, announcements and support'],
      },
      {
        icon: '🏥',
        name: 'Healthcare',
        href: '/health',
        desc: 'The right information for patients and staff, in the right place.',
        uses: ['Medication and medical device instructions', 'Clinic wayfinding, appointment and discharge info', 'Hygiene audits and emergency protocols'],
      },
      {
        icon: '🏭',
        name: 'Factories & manufacturing',
        href: '/factory',
        desc: 'A QR on the machine or on the product you make: the manual is always at hand.',
        uses: [
          'User manuals and assembly videos (video, images or a PDF link)',
          'Safety flows, maintenance and fault reports',
          'Operator training, quality checks, conveyor counts',
        ],
      },
      {
        icon: '🛍️',
        name: 'Retail',
        href: '/retail',
        desc: 'The shelf-tag QR tells the product story and organises the store team.',
        uses: ['Product story: intro video, details, origin', 'Price and campaign checks', 'Store checklists, staff tasks, customer surveys'],
      },
      {
        icon: '🚚',
        name: 'Logistics',
        href: '/logistics',
        desc: 'QR on parcels, vehicles and in the warehouse: every step recorded.',
        uses: ['Proof of delivery and damage reports', 'Vehicle checks, route handoffs, cold-chain tracking', 'Warehouse intake, stock counts, customs documents'],
      },
    ],
    dppKicker: 'New · EU exports',
    dppTitle: 'Digital Product Passport (DPP)',
    dppDesc: 'Under the EU ESPR, digital product passports are being phased in. Versioned passports in 8 languages that open via QR / NFC, for textile, furniture, electronics and battery manufacturers.',
    dppCta: 'Explore DPP',
    b2bCta: 'Get a business quote',
    bizCatalog: 'Business catalog',
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
    sameAs: ['https://www.instagram.com/qrnotcom', ...MARKETPLACES.map((m) => m.url)],
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
            <Link href={withLang('/shop/dijital-qr', lang)} className="w-btn w-btn-ghost px-7 py-4 text-base">
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

      {/* MARKETPLACES */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="w-card-soft p-6 sm:p-8">
          <Kicker>{c.storesKicker}</Kicker>
          <h2 className="font-display mt-2 text-2xl font-semibold sm:text-3xl">{c.storesTitle}</h2>
          <p className="mt-2 max-w-2xl text-ink-2">{c.storesDesc}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(lang === 'en' ? [...MARKETPLACES.filter((m) => m.id === 'etsy'), ...MARKETPLACES.filter((m) => m.id !== 'etsy')] : MARKETPLACES).map((store) => (
              <a
                key={store.id}
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl border border-line bg-paper p-5 transition hover:border-ink-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl font-extrabold tracking-tight" style={{ color: store.color }}>
                    {store.name}
                  </span>
                  <span className="w-chip">{store.region[lang]}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-muted">{store.store[lang]}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{store.desc[lang]}</p>
                <span className="mt-auto pt-4 text-sm font-semibold text-ink group-hover:underline">
                  {c.storesCta} {store.name} ↗
                </span>
              </a>
            ))}
          </div>
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

      {/* FEATURES */}
      <section id="ozellikler" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
        <Kicker>{c.featKicker}</Kicker>
        <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.featTitle}</h2>
        <p className="mt-3 max-w-2xl text-ink-2">{c.featDesc}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.map(([icon, title, desc, badge]) => (
            <div key={title} className="w-card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-3xl" aria-hidden="true">
                  {icon}
                </span>
                <span className={`w-chip ${badge === 'premium' ? 'text-coral-2' : ''}`}>{c.featBadge[badge as keyof typeof c.featBadge]}</span>
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-4 rounded-4xl bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">⭐ {c.premiumTitle}</p>
            <p className="mt-2 max-w-xl text-white/80">{c.premiumDesc}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="font-display text-2xl font-semibold">{c.premiumPrice}</span>
            <Link href={withLang('/shop/premium', lang)} className="w-btn w-btn-primary">
              {c.premiumCta} →
            </Link>
          </div>
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

      {/* PREVIEW: alıcının telefonunda açılan sayfa */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div>
            <Kicker>{c.previewKicker}</Kicker>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.previewTitle}</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-ink-2">{c.previewDesc}</p>
            <ul className="mt-8 space-y-5">
              {c.previewPoints.map(([icon, title, desc]) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-2 text-xl" aria-hidden="true">
                    {icon}
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-0.5 text-sm text-ink-2">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-[320px] rounded-[2.75rem] bg-ink p-3 shadow-2xl">
            <div className="overflow-hidden rounded-[2.25rem] bg-cream px-4 pb-6 pt-3">
              <div className="mx-auto mb-5 h-5 w-24 rounded-full bg-ink" aria-hidden="true" />
              <div className="text-center">
                <p className="font-display text-2xl font-semibold">{c.previewPhone.title}</p>
                <p className="mt-1 text-xs text-muted">{c.previewPhone.opened}</p>
              </div>
              <div className="w-card mt-5 space-y-4 p-4">
                <div className="flex flex-wrap gap-1.5" aria-hidden="true">
                  {c.previewPhone.tabs.map((tab, i) => (
                    <span
                      key={tab}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${i === 0 ? 'border-ink bg-ink text-white' : 'border-line-2 bg-paper text-ink-2'}`}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
                <div className="rounded-2xl bg-cream-2 p-3">
                  <VoicePlayer src="/demo-voice.wav" lang={lang} compact />
                </div>
                <p className="text-sm italic leading-relaxed text-ink-2">{c.previewPhone.note}</p>
                <span className="w-btn w-btn-ghost w-btn-sm w-full" aria-hidden="true">
                  💬 {c.previewPhone.reply}
                </span>
              </div>
            </div>
          </div>
        </div>
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
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.sectors.map((sector) => (
              <div key={sector.href} className="flex flex-col rounded-2xl border border-line bg-paper p-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {sector.icon}
                  </span>
                  <h3 className="font-display text-xl font-semibold">{sector.name}</h3>
                </div>
                <p className="mt-3 text-sm text-ink-2">{sector.desc}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                  {sector.uses.map((use) => (
                    <li key={use} className="flex gap-2">
                      <span className="text-sage" aria-hidden="true">
                        ✓
                      </span>
                      <span>{use}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <a
                    href={whatsappHref(c.sectorQuoteMsg.replace('{sector}', sector.name))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-btn w-btn-dark w-btn-sm"
                  >
                    {c.sectorQuote}
                  </a>
                  <Link href={withLang(sector.href, lang)} className="text-xs text-muted hover:underline">
                    {c.sectorLogin} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={withLang('/dpp', lang)}
            className="mt-6 flex flex-col gap-4 rounded-2xl bg-ink p-6 text-white transition hover:opacity-95 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">🛂 {c.dppKicker}</p>
              <p className="font-display mt-2 text-2xl font-semibold">{c.dppTitle}</p>
              <p className="mt-2 max-w-2xl text-sm text-white/75">{c.dppDesc}</p>
            </div>
            <span className="w-btn w-btn-primary shrink-0">{c.dppCta} →</span>
          </Link>
          <p className="mt-6 text-sm text-ink-2">{c.b2bExtra}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={whatsappHref(lang === 'en' ? 'Hello QRNot, I would like a business quote.' : 'Merhaba QRNot, kurumsal teklif almak istiyorum.')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-btn w-btn-dark"
            >
              {c.b2bCta}
            </a>
            <Link href={withLang('/katalog#kurumsal', lang)} className="w-btn w-btn-ghost">
              {c.bizCatalog}
            </Link>
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
