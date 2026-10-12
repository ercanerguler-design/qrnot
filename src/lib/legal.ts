import { COMPANY, SITE_URL } from '@/lib/site'

// Yasal metinler. ÖNEMLİ: Yayına almadan önce bir hukukçuya kontrol ettirin.
// Her blok: [tip, metin] — 'h2' başlık, 'p' paragraf, 'ul' madde listesi (| ile ayrılır)

export type LegalBlock = ['h2' | 'h3' | 'p' | 'ul', string]
export interface LegalDoc {
  slug: string
  lang: 'tr' | 'en'
  title: string
  updated: string
  blocks: LegalBlock[]
}

const UPDATED = '12.10.2026'
const SELLER = `${COMPANY.legalName}, ${COMPANY.address}. E-posta: ${COMPANY.email}, Telefon: ${COMPANY.phone}`

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: 'on-bilgilendirme',
    lang: 'tr',
    title: 'Ön Bilgilendirme Formu',
    updated: UPDATED,
    blocks: [
      [
        'p',
        '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, sipariş onayından önce aşağıdaki bilgiler tüketiciye sunulmaktadır.',
      ],
      ['h2', '1. Satıcı Bilgileri'],
      ['p', SELLER],
      ['h2', '2. Sözleşme Konusu Ürün / Hizmet'],
      [
        'p',
        'Ürünün temel nitelikleri, adedi, vergiler dahil satış fiyatı ve toplam ödeme tutarı sipariş özetinde (sepet ve ödeme sayfasında) gösterilmektedir. Fiziksel ürünlerde kargo alıcı ödemelidir; kargo bedeli satış fiyatına dahil değildir ve teslimat sırasında ALICI tarafından kargo firmasına ödenir. QR/NFC ürünleri, sitedeki dijital içerik sayfasına (ses, video, fotoğraf, bağlantı) erişim hizmeti ile birlikte sunulur.',
      ],
      ['h2', '3. Ödeme ve Teslimat'],
      [
        'ul',
        'Ödeme; kredi/banka kartı (iyzico altyapısı) veya havale/EFT ile yapılır.|Fiziksel ürünler ödemenin onaylanmasından itibaren en geç 3 iş günü içinde kargoya verilir; yasal teslim süresi 30 gündür.|Dijital ürünler (QR hakkı, dijital anı defteri) ödeme onayıyla birlikte üyelik hesabına anında tanımlanır.',
      ],
      ['h2', '4. Cayma Hakkı'],
      [
        'p',
        'Tüketici, fiziksel ürünlerde teslim tarihinden itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma bildirimi ' +
          COMPANY.email +
          ' adresine veya WhatsApp destek hattına yapılabilir. Cayma halinde ürün, faturası ile birlikte ve kullanılmamış şekilde 10 gün içinde iade edilir; bedel iade tarihinden itibaren 14 gün içinde ödeme yöntemine iade edilir.',
      ],
      ['h2', '5. Cayma Hakkının Kullanılamayacağı Haller'],
      [
        'ul',
        'Elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayri maddi mallar (hesaba tanımlanmış ve kullanılmaya başlanmış dijital QR hakkı, dijital anı defteri).|Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan (kişiye özel kazıma vb.) ürünler.',
      ],
      ['h2', '6. Şikâyet ve İtiraz'],
      [
        'p',
        'Tüketici, şikâyet ve itirazlarını Ticaret Bakanlığınca ilan edilen parasal sınırlar dahilinde tüketicinin yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetine ya da Tüketici Mahkemesine iletebilir.',
      ],
    ],
  },
  {
    slug: 'mesafeli-satis',
    lang: 'tr',
    title: 'Mesafeli Satış Sözleşmesi',
    updated: UPDATED,
    blocks: [
      ['h2', 'Madde 1 — Taraflar'],
      ['p', `SATICI: ${SELLER}`],
      ['p', 'ALICI: Sipariş sırasında ad-soyad, e-posta, telefon ve teslimat adresi bilgilerini giren kişi.'],
      ['h2', 'Madde 2 — Konu'],
      [
        'p',
        `İşbu sözleşmenin konusu, ALICI'nın ${SITE_URL} internet sitesi üzerinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürün/hizmetin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.`,
      ],
      ['h2', 'Madde 3 — Ürün, Fiyat ve Ödeme'],
      [
        'p',
        'Ürünlerin cinsi, türü, adedi, satış bedeli, ödeme şekli ve teslimat bilgileri sipariş özetinde ve sipariş onay sayfasında yer alır. Listelenen fiyatlar satış fiyatıdır ve KDV dahildir. Kart bilgileri SATICI tarafından saklanmaz; ödeme altyapısı iyzico tarafından sağlanır.',
      ],
      ['h2', 'Madde 4 — Teslimat'],
      [
        'ul',
        "Fiziksel ürünler ALICI'nın bildirdiği adrese anlaşmalı kargo firmasıyla gönderilir. Teslimat süresi yasal 30 günlük süreyi aşamaz.|Dijital ürünler, ödemenin onaylanmasıyla ALICI'nın üyelik hesabına tanımlanır.|Teslimat sırasında hasarlı paket tutanakla teslim alınmamalıdır.",
      ],
      ['h2', 'Madde 5 — Dijital İçerik Hizmeti'],
      [
        'p',
        "Ürün üzerindeki QR kod ve/veya NFC çip, SATICI'ya ait sitede ALICI'nın eklediği içeriğin görüntülendiği sayfaya yönlendirir. ALICI, eklediği içerikten bizzat sorumludur; hukuka, genel ahlaka ve üçüncü kişilerin haklarına aykırı içerik eklemeyeceğini kabul eder. SATICI, bu nitelikteki içerikleri kaldırma hakkını saklı tutar.",
      ],
      ['h2', 'Madde 6 — Cayma Hakkı'],
      [
        'p',
        "ALICI, fiziksel ürünlerde teslimden itibaren 14 gün içinde cayma hakkını kullanabilir. Cayma bildiriminin SATICI'ya ulaşmasından itibaren 14 gün içinde ürün bedeli iade edilir; ALICI ürünü 10 gün içinde iade etmekle yükümlüdür. Anında ifa edilen dijital hizmetlerde (hesaba tanımlanmış QR hakkı, dijital anı defteri) ALICI'nın onayıyla ifaya başlandığından cayma hakkı bulunmaz.",
      ],
      ['h2', 'Madde 7 — Uyuşmazlık'],
      [
        'p',
        'İşbu sözleşmeden doğan uyuşmazlıklarda Ticaret Bakanlığınca ilan edilen değere kadar Tüketici Hakem Heyetleri, üzerindeki uyuşmazlıklarda Tüketici Mahkemeleri yetkilidir.',
      ],
      ['h2', 'Madde 8 — Yürürlük'],
      [
        'p',
        'ALICI, sipariş sırasında bu sözleşmeyi elektronik ortamda onayladığında sözleşme yürürlüğe girer. Onay kaydı (tarih, IP) SATICI tarafından saklanır.',
      ],
    ],
  },
  {
    slug: 'iade',
    lang: 'tr',
    title: 'İptal ve İade Koşulları',
    updated: UPDATED,
    blocks: [
      [
        'ul',
        'Fiziksel ürünlerde teslimattan itibaren 14 gün içinde koşulsuz iade hakkın vardır.|İade için ' +
          COMPANY.email +
          ' adresine ya da WhatsApp destek hattına sipariş numaranla yazman yeterli.|Ürün kullanılmamış, hasarsız ve orijinal kutusunda olmalıdır.|İade onaylandığında ücret 14 gün içinde ödeme yaptığın karta / hesaba iade edilir.|Hasarlı veya hatalı ürünlerde kargo ücreti bize aittir.|Hesaba tanımlanmış ve kullanılmaya başlanmış dijital ürünlerde (QR hakkı, anı defteri) cayma hakkı bulunmaz; teknik bir sorun olursa çözüm ya da iade için bize yaz.|Kargoya verilmemiş siparişler ücretsiz iptal edilebilir.',
      ],
    ],
  },
  {
    slug: 'gizlilik',
    lang: 'tr',
    title: 'Gizlilik Politikası',
    updated: UPDATED,
    blocks: [
      [
        'p',
        `${COMPANY.legalName} ("QRNot") olarak kişisel verilerinin güvenliğine önem veriyoruz. Bu politika, ${SITE_URL} üzerinden hangi verileri neden işlediğimizi açıklar.`,
      ],
      ['h2', 'Topladığımız veriler'],
      [
        'ul',
        'Hesap verileri: e-posta adresi ve şifrenin (geri döndürülemez şekilde) özeti.|Sipariş verileri: ad-soyad, telefon, teslimat adresi, sipariş içeriği.|QR içerikleri: yüklediğin ses, video, fotoğraf, başlık ve bağlantılar.|Anı defteri içerikleri: misafirlerin bıraktığı isim, mesaj ve medya.|Teknik veriler: IP adresi (güvenlik ve kötüye kullanımı önleme), görüntülenme sayıları.',
      ],
      ['h2', 'Ödeme bilgileri'],
      ['p', 'Kart bilgilerin QRNot sunucularına ulaşmaz; ödemeler iyzico (Türkiye) veya Stripe (yurt dışı) tarafından işlenir.'],
      ['h2', 'Verilerin saklandığı yerler'],
      [
        'p',
        'Veriler Vercel (barındırma ve dosya depolama) ve Neon (veritabanı) altyapılarında, yurt dışındaki sunucularda saklanır. Bu aktarım, hizmetin sunulabilmesi için gereklidir ve açık rızana dayanır.',
      ],
      ['h2', 'İçeriklerin görünürlüğü'],
      ['p', "QR'ına eklediğin içerik, QR kodu okutan veya bağlantıya sahip herkes tarafından görüntülenebilir. Hassas bilgileri eklememeni öneririz."],
      ['h2', 'Haklarınız'],
      ['p', `Verilerine erişme, düzeltme, silme ve işlemeye itiraz etme hakkına sahipsin. Taleplerini ${COMPANY.email} adresine iletebilirsin.`],
    ],
  },
  {
    slug: 'kvkk',
    lang: 'tr',
    title: 'KVKK Aydınlatma Metni',
    updated: UPDATED,
    blocks: [
      ['p', `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla ${COMPANY.legalName} tarafından hazırlanmıştır.`],
      ['h2', 'İşlenen kişisel veriler ve amaçlar'],
      [
        'ul',
        'Kimlik ve iletişim verileri: sipariş, teslimat, faturalandırma ve müşteri desteği.|Müşteri işlem verileri: sipariş geçmişi, ödeme durumu (kart bilgisi hariç).|Görsel ve işitsel kayıtlar: kullanıcının QR sayfasına kendi isteğiyle yüklediği ses, video ve fotoğraflar.|İşlem güvenliği verileri: IP adresi, oturum bilgileri.',
      ],
      ['h2', 'Hukuki sebepler'],
      [
        'p',
        'Sözleşmenin kurulması ve ifası (KVKK m.5/2-c), hukuki yükümlülüklerin yerine getirilmesi (m.5/2-ç), meşru menfaat (m.5/2-f) ve yurt dışına aktarım ile pazarlama iletişimi için açık rıza (m.5/1, m.9).',
      ],
      ['h2', 'Aktarım'],
      [
        'p',
        'Kişisel veriler; ödeme kuruluşları (iyzico, Stripe), kargo firmaları, barındırma ve depolama hizmet sağlayıcıları (Vercel, Neon) ve yasal olarak yetkili kamu kurumlarıyla, yukarıdaki amaçlarla sınırlı olarak paylaşılabilir.',
      ],
      ['h2', 'Haklarınız (KVKK m.11)'],
      [
        'p',
        `Kişisel verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme, aktarıldığı üçüncü kişileri bilme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsin. Başvurularını ${COMPANY.email} adresine iletebilirsin; en geç 30 gün içinde yanıtlanır.`,
      ],
    ],
  },
  {
    slug: 'cerez',
    lang: 'tr',
    title: 'Çerez Politikası',
    updated: UPDATED,
    blocks: [
      ['p', 'QRNot yalnızca sitenin çalışması için zorunlu çerezleri ve tarayıcı depolamasını kullanır. Reklam veya üçüncü taraf takip çerezi kullanılmaz.'],
      [
        'ul',
        'qrnote_auth: oturum çerezi — giriş yapmış kalmanı sağlar.|qrnote_lang: dil tercihi.|Tarayıcı depolaması (localStorage): sepet içeriği ve QR sahip anahtarı (içeriğini bu cihazdan yönetebilmen için).',
      ],
      ['p', 'Tarayıcı ayarlarından çerezleri silebilirsin; bu durumda yeniden giriş yapman gerekir.'],
    ],
  },
  {
    slug: 'kullanim',
    lang: 'tr',
    title: 'Kullanım Koşulları',
    updated: UPDATED,
    blocks: [
      [
        'ul',
        "QRNot'u kullanarak bu koşulları kabul etmiş olursun.|QR sayfana eklediğin içerikten yalnızca sen sorumlusun. Hukuka aykırı, nefret söylemi içeren, müstehcen, başkalarının telif veya kişilik haklarını ihlal eden içerik eklenemez.|Bu tür içerikler bildirim üzerine veya tespit edildiğinde önceden haber verilmeksizin kaldırılabilir; hesap askıya alınabilir.|Sahip linki ve kurtarma kodunun güvenliğinden sen sorumlusun; bunlara sahip olan herkes içeriği değiştirebilir.|Hizmetin kesintisiz olması için azami özen gösterilir; bakım ve mücbir sebeplerden doğan kesintilerden QRNot sorumlu tutulamaz.|Anı defteri sahibi, misafirlerin bıraktığı içerikleri yayınlamadan önce onaylamakla ve gerekli izinleri almakla yükümlüdür.|Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir.",
      ],
    ],
  },
  {
    slug: 'terms',
    lang: 'en',
    title: 'Terms of Use',
    updated: UPDATED,
    blocks: [
      ['p', `These terms govern your use of ${SITE_URL}, operated by ${COMPANY.legalName}, ${COMPANY.address}, Türkiye (${COMPANY.email}).`],
      [
        'ul',
        'You are solely responsible for the content you add to your QR page. Illegal, hateful, obscene or infringing content is not allowed and may be removed without notice.|Keep your owner link and recovery code safe — anyone who has them can change your content.|Guestbook owners are responsible for approving guest content and obtaining any permissions needed before sharing it.|We make every reasonable effort to keep the service available but are not liable for interruptions due to maintenance or force majeure.|Digital products (QR credits, guestbooks) are delivered instantly to your account.|These terms are governed by the laws of the Republic of Türkiye.',
      ],
    ],
  },
  {
    slug: 'privacy',
    lang: 'en',
    title: 'Privacy Policy',
    updated: UPDATED,
    blocks: [
      ['h2', 'What we collect'],
      [
        'ul',
        'Account data: email address and a one-way hash of your password.|Order data: name, phone, shipping address and order contents.|Content you upload: voice, video, photos, titles and links.|Guestbook content left by guests: name, message and media.|Technical data: IP address (security and abuse prevention), view counts.',
      ],
      ['h2', 'Payments'],
      ['p', 'Card details never reach QRNot servers; payments are processed by Stripe or iyzico.'],
      ['h2', 'Where data is stored'],
      ['p', 'Data is hosted on Vercel (hosting and file storage) and Neon (database). We do not sell personal data and do not use advertising trackers.'],
      ['h2', 'Visibility'],
      ['p', 'Content on your QR page can be seen by anyone who scans the QR or has the link. Please do not add sensitive information.'],
      ['h2', 'Your rights'],
      [
        'p',
        `You may request access, correction or deletion of your data, or object to processing, at ${COMPANY.email}. EU/UK residents have the rights granted under the GDPR.`,
      ],
    ],
  },
  {
    slug: 'refund',
    lang: 'en',
    title: 'Refund Policy',
    updated: UPDATED,
    blocks: [
      [
        'ul',
        'Shipping is paid by the recipient to the carrier on delivery and is not included in the product price.|Physical products can be returned within 14 days of delivery, unused and in original packaging.|Email ' +
          COMPANY.email +
          " or message us on WhatsApp with your order number to start a return.|Refunds are issued to the original payment method within 14 days of approval.|If an item arrives damaged or defective, we cover return shipping or send a replacement.|Digital products that have been delivered to your account and used are non-refundable; if you have a technical problem, contact us and we will fix it or refund you.|Etsy purchases follow Etsy's order and refund process — please contact us through Etsy messages.",
      ],
    ],
  },
  {
    slug: 'cookies',
    lang: 'en',
    title: 'Cookie Policy',
    updated: UPDATED,
    blocks: [
      [
        'p',
        'QRNot only uses cookies and browser storage that are strictly necessary for the site to work. No advertising or third-party tracking cookies are used.',
      ],
      [
        'ul',
        'qrnote_auth: session cookie that keeps you signed in.|qrnote_lang: language preference.|localStorage: cart contents and your QR owner key (so you can manage your content from this device).',
      ],
    ],
  },
]

export function getLegalDoc(slug: string) {
  return LEGAL_DOCS.find((doc) => doc.slug === slug) || null
}
