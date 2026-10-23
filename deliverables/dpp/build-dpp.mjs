// QRNot Dijital Ürün Pasaportu (DPP) tanıtım materyallerini üretir (Türkçe ve İngilizce ayrı):
//   node deliverables/dpp/build-dpp.mjs
// Çıktı:
//   deliverables/dpp/katalog/<tr|en>/NN-sayfa.png  + QRNot-DPP-Katalog-<TR|EN>.pdf   (A4, görüşme sonrası bırakılan broşür)
//   deliverables/dpp/sunum/<tr|en>/NN-slayt.png    + QRNot-DPP-Sunum-<TR|EN>.pdf     (16:9, toplantı / online sunum)
//   deliverables/dpp/sosyal/<tr|en>/NN-post.png                                        (LinkedIn 1080×1350)
// Ekran görüntüleri deliverables/dpp/assets/ içindedir; canlı sistemden örnek verilerle alınmıştır.
// İçerik, kodda gerçekten bulunan özelliklere dayanır (src/lib/dpp, src/app/dpp, src/app/p).

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const require = createRequire(join(ROOT, 'package.json'))
const lucide = require('lucide-static')
const asset = (name) => pathToFileURL(join(HERE, 'assets', name)).href

const icon = (name, size = 28, color = 'currentColor', stroke = 1.8) =>
  lucide[name]
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .replace(/stroke="currentColor"/, `stroke="${color}"`)
    .replace(/stroke-width="2"/, `stroke-width="${stroke}"`)

const COMPANY = { site: 'qrnot.com/dpp', demo: 'qrnot.com/p/ornekpasaport', email: 'sce@scegrup.com', whatsapp: '+90 543 392 92 30', support: '0850 888 1 889' }
const C = { navy: '#0f3d5e', navy2: '#0a2b43', ink: '#0f1b2d', green: '#1f9d6b', mint: '#3fd29a', sky: '#2f7fb3', amber: '#e8a33d', paper: '#f4f7f9', line: '#dde3ea', muted: '#5b6b80' }

// ---------------------------------------------------------------------------------------------
// İçerik (TR / EN)
// ---------------------------------------------------------------------------------------------
const T = {
  tr: {
    lang: 'tr',
    product: 'Dijital Ürün Pasaportu',
    catalog: 'DPP Kataloğu',
    deck: 'DPP Sunumu',
    year: '2026',
    page: 'Sayfa',
    coverKicker: 'AB ESPR · Dijital Ürün Pasaportu',
    coverTitle: ['Ürünleriniz', 'Avrupa’ya', 'pasaportuyla gitsin.'],
    coverLead: 'İhracatçı üreticiler için QR / NFC ile açılan, 8 dilli, sürümlü ve denetime hazır dijital ürün pasaportu. Veriyi bir kez girin; etiketleri basın; gerisini QRNot yönetsin.',
    coverPills: ['8 dil', 'Model ve seri numarası düzeyi', 'GS1 Digital Link', 'Tedarikçi veri portalı', 'Karbon tahmini', 'Sürümlü yayın'],
    whatKicker: 'DPP nedir?',
    whatTitle: 'Ürünün dijital kimlik kartı',
    whatLead:
      'AB’nin Sürdürülebilir Ürünler için Ekotasarım Tüzüğü (ESPR) ile AB pazarındaki ürünlere kademeli olarak dijital ürün pasaportu zorunlu hale geliyor. Pasaport; ürünün malzemesini, menşeini, çevresel etkisini, bakım–onarım bilgisini ve geri dönüşüm talimatını, ürünün üzerindeki bir QR kod ya da NFC etiketi üzerinden sunar.',
    audienceTitle: 'Pasaportu kim, neden okur?',
    audience: [
      ['ShoppingBag', 'Tüketici', 'Malzeme, bakım, onarım ve geri dönüşüm bilgisini kendi dilinde görür.'],
      ['ShieldCheck', 'Denetim kurumları', 'Uygunluk belgelerine ve kısıtlı bilgilere yetkili erişimle ulaşır.'],
      ['Recycle', 'Geri dönüşüm tesisleri', 'Ayrıştırma ve tehlikeli bileşen bilgisini doğru kaynaktan alır.'],
    ],
    timelineTitle: 'Takvim',
    timeline: [
      ['Temmuz 2024', 'ESPR yürürlüğe girdi. Ürün gruplarının ayrıntılı kuralları ikincil düzenlemelerle belirleniyor.'],
      ['2026', 'AB merkezi DPP kayıt sisteminin kurulması planlanıyor.'],
      ['Şubat 2027', 'AB Pil Tüzüğü kapsamında elektrikli araç, hafif taşıt ve büyük endüstriyel bataryalar için batarya pasaportu.'],
      ['2027 ve sonrası', 'Tekstil, demir-çelik, mobilya ve diğer öncelikli gruplar; tarihler ilgili düzenlemelerle kesinleşir.'],
    ],
    timelineNote: 'Tarihler ürün grubuna göre değişir; sizin ürünleriniz için geçerli takvimi teklif aşamasında birlikte netleştiriyoruz.',
    contentTitle: 'Bir pasaportta neler var?',
    content: [
      ['Layers', 'Malzeme bileşimi', 'Oranlar, geri dönüştürülmüş içerik, kaynak'],
      ['MapPin', 'Menşe ve operatörler', 'Üretici ve AB sorumlu ekonomik operatör'],
      ['Leaf', 'Çevresel veriler', 'Karbon, su, enerji, geri dönüştürülebilirlik'],
      ['Shirt', 'Kullanım ve bakım', 'Yıkama, temizlik, kullanım talimatı'],
      ['Wrench', 'Onarım ve garanti', 'Garanti, yedek parça, onarılabilirlik puanı'],
      ['Recycle', 'Kullanım ömrü sonu', 'Ayrıştırma ve geri dönüşüm talimatı'],
      ['BadgeCheck', 'Uygunluk', 'Sertifikalar, beyanlar, test raporları'],
      ['TriangleAlert', 'Güvenlik', 'Uyarılar ve endişe verici maddeler (SVHC)'],
    ],
    consumerKicker: 'Tüketici deneyimi',
    consumerTitle: 'Okutan herkes, kendi dilinde.',
    consumerLead: 'Uygulama yok. Telefon kamerasıyla QR okutulur ya da NFC etikete dokunulur; pasaport tarayıcıda açılır. Ziyaretçi dilini seçer; Arapça sağdan sola gösterilir.',
    consumerPoints: [
      ['Languages', '8 dil', 'TR · EN · DE · FR · ES · NL · AR · RU'],
      ['Hash', 'Tekil ürün bilgisi', 'Seri no, parti ve üretim tarihi'],
      ['FileText', 'Belgeler', 'Herkese açık PDF sertifikalar'],
      ['Printer', 'Yazdır / PDF', 'Pasaport tek tıkla yazdırılır'],
    ],
    panelKicker: 'Firma paneli',
    panelTitle: 'Tüm pasaportlarınız tek panelde.',
    panelLead: 'Ürün verisini sekmeli düzenleyicide girin, belgeleri yükleyin, ekibinizle birlikte çalışın. Panel, yayın öncesi eksikleri gösterir: malzeme oranları %100 değilse yayına izin vermez.',
    panelFeatures: [
      ['LayoutDashboard', 'Genel bakış', '30 günlük okutma, ülke ve ürün analizi'],
      ['PencilRuler', 'Sekmeli düzenleyici', 'Malzeme, çevre, bakım, uygunluk, operatörler'],
      ['Languages', 'Otomatik çeviri', 'Yapay zekâ ile 7 dile çevir, kontrol et, yayınla'],
      ['FileUp', 'Belgeler', 'PDF / görsel; herkese açık ya da kısıtlı'],
      ['Upload', 'CSV içe aktarma', 'Yüzlerce ürünü tek dosyayla taslak olarak ekle'],
      ['Users', 'Ekip, roller, 8 dilli panel', 'Yönetici, editör, izleyici · panel 8 dilde kullanılabilir'],
    ],
    prodKicker: 'Üretimden rafa',
    prodTitle: 'Etiketi bir kez basın.',
    prodLead: 'Model düzeyinde tek QR ya da her ürün için seri numaralı pasaport. Seri numaralarını panelde üretin; QR etiketlerini doğrudan yazdırın ya da CSV’yi lazer / etiket yazılımınıza verin.',
    prodSteps: [
      ['Hash', 'Seri no üret', 'Ön ek, başlangıç no, parti ve üretim tarihiyle tek seferde 2.000 adede kadar'],
      ['Printer', 'Etiket bas', '25–50 mm QR etiket sayfası ya da CSV dışa aktarma'],
      ['Tag', 'Ürüne uygula', 'Ürün, etiket, yıkama talimatı ya da ambalaj'],
      ['ScanLine', 'Okut', 'Tekil pasaport seri no, parti ve tarihle açılır'],
    ],
    gs1Title: 'GS1 Digital Link uyumlu',
    gs1Lead: 'GTIN girilen ürünlerde standart adres doğrudan pasaportu açar:',
    gs1Example: 'qrnot.com/01/{GTIN}/21/{seri}',
    nfcNote: 'Aynı pasaport adresi NFC etiketlere de yazılabilir.',
    trustKicker: 'Güven altyapısı',
    trustTitle: 'Denetime hazır, kalıcı, kontrollü.',
    trust: [
      ['History', 'Sürümlü yayın', 'Her yayın değiştirilemez bir sürüm olarak saklanır. QR adresi hiç değişmez; etiket yeniden basılmaz.'],
      ['Lock', 'Yetkili erişim', 'Tedarikçi, tesis ve sökme bilgileri sadece denetim ve geri dönüşüm için verdiğiniz anahtarla görünür.'],
      ['Archive', 'Silinmez, arşivlenir', 'Yayınlanmış pasaport silinemez; ürün üretimden kalksa da “artık üretilmiyor” notuyla erişilebilir kalır.'],
      ['Braces', 'Makine okunur veri', 'Her pasaport JSON olarak da sunulur; denetim yazılımları ve entegrasyonlar doğrudan okur.'],
      ['EyeOff', 'Taslak ve yayın ayrı', 'Taslakta yaptığınız değişiklik, “Yayınla” demeden ziyaretçiye görünmez.'],
      ['ShieldCheck', 'Kayıt ve yedek', 'Her değişiklik işlem kaydına yazılır, tüm veri her gün yedeklenir, silinen dosya 30 gün geri alınabilir. Firmalar birbirinin verisini göremez.'],
    ],
    honestTitle: 'Açık konuşalım',
    honest:
      'QRNot DPP, pasaport verinizi bugünden toplamanız, yayınlamanız ve ürünlerinize uygulamanız için hazır bir altyapıdır. AB’nin teknik standartları ve ürün grubu kuralları kesinleştikçe veri modelini güncelliyoruz. Ürünün mevzuata uygunluğunun sorumluluğu üreticidedir; biz süreci kolaylaştırıyoruz.',
    plansKicker: 'Paketler',
    plansTitle: 'Ürün sayınıza göre',
    plans: [
      ['Pilot', '10 ürün modeli', 'İlk ürünlerle başlayın, süreci deneyin.'],
      ['Başlangıç', '50 ürün modeli', 'Küçük ve orta ölçekli üreticiler.'],
      ['İşletme', '500 ürün modeli', 'Geniş koleksiyonlu markalar.'],
      ['Kurumsal', 'Sınırsız', 'Entegrasyon ve öncelikli destek.'],
    ],
    plansNote: 'Tüm paketlerde sınırsız seri numarası, 8 dil, belgeler ve etiket baskısı vardır. Fiyat ürün sayısına ve hizmet kapsamına göre teklifle belirlenir.',
    startTitle: 'Nasıl başlarız?',
    start: [
      ['MessagesSquare', 'Tanışma', 'Ürün gruplarınızı ve ihracat pazarlarınızı konuşuruz.'],
      ['FlaskConical', 'Pilot', 'Birkaç ürünle pasaportları birlikte hazırlarız.'],
      ['Printer', 'Etiket', 'QR / NFC etiketleri üretim hattınıza uyarlarız.'],
      ['Rocket', 'Yaygınlaştırma', 'Koleksiyonun tamamını CSV ile aktarırız.'],
    ],
    versionLabels: {
      title: 'Yayın geçmişi',
      qrSame: 'QR adresi aynı',
      live: 'Yayında',
      archived: 'Kayıtta',
      rows: [
        [3, '12 Kasım 2026', 'Onarım bilgisi ve yeni sertifika eklendi'],
        [2, '28 Ekim 2026', 'Almanca ve Fransızca çeviri yayınlandı'],
        [1, '1 Ekim 2026', 'İlk yayın'],
      ],
    },
    supKicker: 'Tedarikçi veri portalı',
    supTitle: 'Veriyi tedarikçiniz doldursun.',
    supLead: 'Pasaportun en zor kısmı tedarik zincirindeki bilgiyi toplamak. Tedarikçinize bir link gönderin; giriş yapmadan, kendi dilinde malzeme, sertifika, tesis ve SVHC bilgisini girsin, belgelerini yüklesin. Siz inceleyip seçtiğiniz bölümleri tek tıkla ürüne aktarın.',
    supSteps: [
      ['Send', 'Link gönderin', 'WhatsApp ya da e-posta ile; süreli ve tahmin edilemez link'],
      ['ClipboardList', 'Tedarikçi doldursun', '8 dilde form, belge yükleme, doğruluk beyanı'],
      ['CheckCheck', 'İnceleyin ve aktarın', 'Onayınız olmadan hiçbir şey ürüne geçmez'],
    ],
    carbonKicker: 'Karbon tahmini yardımcısı',
    carbonTitle: 'Karbon değeriniz yok mu? Kaynaklı bir tahminle başlayın.',
    carbonLead: 'Malzeme oranları ve ürün ağırlığından hammadde (lif) aşaması için bir aralık hesaplanır; her değerin kaynağı gösterilir. Pasaportta açıkça “tahmin” olarak yazılır. LCA’nız varsa kendi değerinizi beyan olarak girersiniz.',
    safetyKicker: 'Verileriniz güvende',
    safety: [
      ['ScrollText', 'İşlem kaydı', 'Kim, neyi, ne zaman değiştirdi; silinen kaydın kopyası dahil'],
      ['DatabaseBackup', 'Günlük yedek', 'Tüm pasaport verisi her gün otomatik yedeklenir'],
      ['Users', 'Çakışma koruması', 'İki kişi aynı ürünü düzenlerse değişiklik ezilmez'],
      ['FileLock', 'KVKK / GDPR', 'Veri işleme sözleşmesi ve açık güvenlik sayfası'],
    ],
    whyTitle: 'Neden QRNot?',
    why: [
      ['Factory', 'QR / NFC üretim deneyimi', 'Fiziksel QR ve NFC ürünlerini kendimiz üretiyor, etiket baskısını biliyoruz.'],
      ['Zap', 'Hızlı kurulum', 'Firma hesabınız dakikalar içinde açılır; pilot hemen başlar.'],
      ['Headset', 'Türkçe destek', 'Türkiye’de geliştirildi; panel Türkçe, destek hattı Türkiye’de.'],
    ],
    contactTitle: 'Teklif ve demo',
    demoLine: `Örnek pasaport: ${COMPANY.demo}`,
    supportLine: `Mevcut müşteriler için destek hattı: ${COMPANY.support}`,
    footerNote: 'Ekran görüntüleri gerçek sistemden, örnek verilerle alınmıştır. Görseller temsilidir.',
    // Sunum
    s2Kicker: 'Değişen kural',
    s2Title: 'AB pazarında ürünler artık dijital bir pasaportla dolaşacak.',
    s2Points: [
      'ESPR ile dijital ürün pasaportu ürün gruplarına kademeli olarak zorunlu hale geliyor.',
      'İlk somut adım: Şubat 2027’den itibaren belirli bataryalar için batarya pasaportu.',
      'Tekstil, demir-çelik, mobilya ve diğer öncelikli gruplar sırada.',
      'Pasaport, ürün üzerindeki QR kod ya da NFC ile açılmalı ve ürün ömrü boyunca erişilebilir olmalı.',
    ],
    s3Kicker: 'Kimleri etkiliyor?',
    s3Title: 'AB’ye ürün satan her üretici, ithalatçı ve marka.',
    s3Lead: 'Türkiye’den AB’ye ihracat yapan üreticiler için pasaport verisini toplamak, doğru biçimde yayınlamak ve etikete basmak yeni bir iş yükü demek. Erken başlayan, müşterisine “hazırız” diyebilen firma öne geçer.',
    sectors: ['Tekstil ve hazır giyim', 'Ayakkabı', 'Mobilya', 'Pil ve batarya', 'Elektronik ve beyaz eşya', 'Oyuncak', 'Yapı malzemesi', 'Demir-çelik ve metal'],
    s5Kicker: 'Çözüm',
    s5Title: 'QRNot DPP: veriyi girin, yayınlayın, etiketleyin.',
    pillars: [
      ['PencilRuler', 'Girin', 'Sekmeli panel, CSV ile toplu yükleme, tedarikçiden link ile veri, karbon tahmini.'],
      ['Globe', 'Yayınlayın', '8 dil, sürümlü yayın, yetkili erişim, makine okunur veri.'],
      ['QrCode', 'Etiketleyin', 'Model / seri no QR’ı, etiket baskısı, GS1 Digital Link, NFC.'],
    ],
    thanksTitle: 'İhracatınız için ilk pasaportu birlikte hazırlayalım.',
    thanksLead: 'Pilot ile başlayın: birkaç ürünle pasaportlarınızı hazırlayalım, etiketlerinizi üretim hattınıza uyarlayalım.',
    // Sosyal
    social: [
      { kicker: 'AB’ye ihracat yapanlar için', title: 'Dijital Ürün Pasaportu geliyor. Hazır mısınız?', lead: 'AB pazarındaki ürünler için kademeli olarak zorunlu hale geliyor. QR’ı okutan herkes ürünün malzemesini, menşeini, bakım ve geri dönüşüm bilgisini görecek.', cta: 'qrnot.com/dpp' },
      { kicker: 'Bir QR, 8 dil', title: 'Okutan herkes ürününüzü kendi dilinde tanır.', lead: 'Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Felemenkçe, Arapça, Rusça. Uygulama gerekmez.', cta: 'Örnek pasaport: qrnot.com/p/ornekpasaport' },
      { kicker: 'Etiketi bir kez basın', title: 'Bilgi güncellenir, QR hiç değişmez.', lead: 'Her güncelleme yeni bir sürüm olarak yayınlanır; eski sürümler kayıtta kalır. Etiketleri yeniden basmanız gerekmez.', cta: 'qrnot.com/dpp' },
      { kicker: 'Pilot programı', title: 'İlk pasaportlarınızı birlikte hazırlayalım.', lead: 'Birkaç ürünle başlayın: verileri birlikte girelim, etiketleri üretim hattınıza uyarlayalım, AB’deki müşterinize “hazırız” deyin.', cta: `WhatsApp ${COMPANY.whatsapp}` },
      { kicker: 'Tedarikçi veri portalı', title: 'Bilgiyi tedarikçinizden bir linkle alın.', lead: 'Tedarikçiniz giriş yapmadan, kendi dilinde malzeme, sertifika ve tesis bilgisini doldurur, belgesini yükler. Siz inceleyip tek tıkla ürüne aktarırsınız.', cta: 'qrnot.com/dpp' },
      { kicker: 'Karbon tahmini', title: 'Karbon değeriniz yoksa kaynaklı bir tahminle başlayın.', lead: 'Malzeme oranı ve ağırlıktan hammadde aşaması için bir aralık hesaplanır; pasaportta açıkça “tahmin” olarak gösterilir.', cta: 'qrnot.com/dpp' },
    ],
  },
  en: {
    lang: 'en',
    product: 'Digital Product Passport',
    catalog: 'DPP Catalogue',
    deck: 'DPP Presentation',
    year: '2026',
    page: 'Page',
    coverKicker: 'EU ESPR · Digital Product Passport',
    coverTitle: ['Send your products', 'to Europe with', 'their passport.'],
    coverLead: 'For exporting manufacturers: a versioned, audit-ready digital product passport in 8 languages that opens via QR / NFC. Enter the data once, print the labels and let QRNot handle the rest.',
    coverPills: ['8 languages', 'Model and serial level', 'GS1 Digital Link', 'Supplier data portal', 'Carbon estimate', 'Versioned publishing'],
    whatKicker: 'What is a DPP?',
    whatTitle: 'A digital ID card for every product',
    whatLead:
      'Under the EU Ecodesign for Sustainable Products Regulation (ESPR), digital product passports are being phased in for products on the EU market. The passport shares a product’s materials, origin, environmental impact, care and repair information and recycling instructions through a QR code or NFC tag on the product.',
    audienceTitle: 'Who reads the passport, and why?',
    audience: [
      ['ShoppingBag', 'Consumers', 'See materials, care, repair and recycling information in their own language.'],
      ['ShieldCheck', 'Authorities', 'Reach compliance documents and restricted information with authorised access.'],
      ['Recycle', 'Recyclers', 'Get dismantling and hazardous-component information from the right source.'],
    ],
    timelineTitle: 'Timeline',
    timeline: [
      ['July 2024', 'ESPR entered into force. Detailed rules per product group are set by delegated acts.'],
      ['2026', 'The EU central DPP registry is planned to be set up.'],
      ['February 2027', 'Battery passport under the EU Battery Regulation for EV, light-transport and large industrial batteries.'],
      ['2027 onwards', 'Textiles, iron and steel, furniture and other priority groups; dates are fixed by the relevant acts.'],
    ],
    timelineNote: 'Dates vary by product group; we confirm the timeline that applies to your products during the quote.',
    contentTitle: 'What is in a passport?',
    content: [
      ['Layers', 'Material composition', 'Shares, recycled content, source'],
      ['MapPin', 'Origin and operators', 'Manufacturer and EU responsible operator'],
      ['Leaf', 'Environmental data', 'Carbon, water, energy, recyclability'],
      ['Shirt', 'Use and care', 'Washing, cleaning, instructions'],
      ['Wrench', 'Repair and warranty', 'Warranty, spare parts, repairability score'],
      ['Recycle', 'End of life', 'Sorting and recycling instructions'],
      ['BadgeCheck', 'Compliance', 'Certificates, declarations, test reports'],
      ['TriangleAlert', 'Safety', 'Warnings and substances of concern (SVHC)'],
    ],
    consumerKicker: 'Consumer experience',
    consumerTitle: 'Everyone reads it in their own language.',
    consumerLead: 'No app. Scan the QR with the phone camera or tap the NFC tag; the passport opens in the browser. Visitors pick their language; Arabic is shown right-to-left.',
    consumerPoints: [
      ['Languages', '8 languages', 'TR · EN · DE · FR · ES · NL · AR · RU'],
      ['Hash', 'Item-level data', 'Serial number, batch and production date'],
      ['FileText', 'Documents', 'Public PDF certificates'],
      ['Printer', 'Print / PDF', 'Print the passport in one click'],
    ],
    panelKicker: 'Company panel',
    panelTitle: 'All your passports in one panel.',
    panelLead: 'Enter product data in a tabbed editor, upload documents and work as a team. The panel flags what is missing before publishing: if material shares do not add up to 100%, it will not publish.',
    panelFeatures: [
      ['LayoutDashboard', 'Overview', '30-day scans by country and product'],
      ['PencilRuler', 'Tabbed editor', 'Materials, environment, care, compliance, operators'],
      ['Languages', 'Auto-translation', 'Translate into 7 languages with AI, review, publish'],
      ['FileUp', 'Documents', 'PDF / images, public or restricted'],
      ['Upload', 'CSV import', 'Add hundreds of products as drafts in one file'],
      ['Users', 'Team, roles, 8-language panel', 'Owner, editor, viewer · the panel itself works in 8 languages'],
    ],
    prodKicker: 'From line to shelf',
    prodTitle: 'Print the label once.',
    prodLead: 'One QR per model, or a serialised passport per item. Generate serial numbers in the panel; print QR labels directly or feed the CSV to your laser / label software.',
    prodSteps: [
      ['Hash', 'Generate serials', 'Prefix, start number, batch and date — up to 2,000 at a time'],
      ['Printer', 'Print labels', '25–50 mm QR label sheets or CSV export'],
      ['Tag', 'Apply', 'On the product, care label or packaging'],
      ['ScanLine', 'Scan', 'The item passport opens with serial, batch and date'],
    ],
    gs1Title: 'GS1 Digital Link ready',
    gs1Lead: 'For products with a GTIN, the standard URL opens the passport directly:',
    gs1Example: 'qrnot.com/01/{GTIN}/21/{serial}',
    nfcNote: 'The same passport URL can also be written to NFC tags.',
    trustKicker: 'Trust infrastructure',
    trustTitle: 'Audit-ready, permanent, controlled.',
    trust: [
      ['History', 'Versioned publishing', 'Every publication is stored as an immutable version. The QR URL never changes; no reprinting.'],
      ['Lock', 'Authorised access', 'Suppliers, facility and dismantling notes are visible only with the key you give authorities and recyclers.'],
      ['Archive', 'Archived, never deleted', 'Published passports cannot be deleted; discontinued products stay available with a notice.'],
      ['Braces', 'Machine-readable data', 'Every passport is also served as JSON for compliance tools and integrations.'],
      ['EyeOff', 'Draft vs. published', 'Changes in a draft stay invisible to visitors until you press Publish.'],
      ['ShieldCheck', 'Audit trail and backups', 'Every change is logged, all data is backed up daily and deleted files can be restored for 30 days. Companies never see each other’s data.'],
    ],
    honestTitle: 'In plain terms',
    honest:
      'QRNot DPP is ready-made infrastructure to collect, publish and apply your passport data today. We update the data model as EU technical standards and product-group rules are finalised. The manufacturer remains responsible for compliance; we make the process easier.',
    plansKicker: 'Plans',
    plansTitle: 'Sized to your catalogue',
    plans: [
      ['Pilot', '10 product models', 'Start with your first products.'],
      ['Starter', '50 product models', 'Small and mid-sized manufacturers.'],
      ['Business', '500 product models', 'Brands with large collections.'],
      ['Enterprise', 'Unlimited', 'Integrations and priority support.'],
    ],
    plansNote: 'All plans include unlimited serial numbers, 8 languages, documents and label printing. Pricing is quoted by product count and service scope.',
    startTitle: 'How we start',
    start: [
      ['MessagesSquare', 'Discovery', 'We discuss your product groups and export markets.'],
      ['FlaskConical', 'Pilot', 'We prepare passports for a few products together.'],
      ['Printer', 'Labels', 'We fit QR / NFC labels to your production line.'],
      ['Rocket', 'Roll-out', 'We import the full collection via CSV.'],
    ],
    versionLabels: {
      title: 'Publication history',
      qrSame: 'Same QR URL',
      live: 'Live',
      archived: 'On record',
      rows: [
        [3, 'November 12, 2026', 'Repair information and a new certificate added'],
        [2, 'October 28, 2026', 'German and French translations published'],
        [1, 'October 1, 2026', 'First publication'],
      ],
    },
    supKicker: 'Supplier data portal',
    supTitle: 'Let your suppliers fill in the data.',
    supLead: 'The hardest part of a passport is collecting information from the supply chain. Send your supplier a link: without logging in, in their own language, they enter materials, certificates, facility and SVHC details and upload documents. You review and copy the sections you choose into the product in one click.',
    supSteps: [
      ['Send', 'Send a link', 'Via WhatsApp or email; time-limited and unguessable'],
      ['ClipboardList', 'Supplier fills it in', 'Form in 8 languages, document upload, declaration'],
      ['CheckCheck', 'Review and copy', 'Nothing reaches the product without your approval'],
    ],
    carbonKicker: 'Carbon estimate helper',
    carbonTitle: 'No carbon figure yet? Start with a sourced estimate.',
    carbonLead: 'A range for the raw-material (fibre) stage is calculated from material shares and product weight, with the source of every value shown. The passport clearly labels it as an “estimate”. If you have an LCA, you enter your own value as a declaration.',
    safetyKicker: 'Your data is safe',
    safety: [
      ['ScrollText', 'Audit trail', 'Who changed what and when, including a copy of deleted records'],
      ['DatabaseBackup', 'Daily backup', 'All passport data is backed up automatically every day'],
      ['Users', 'Conflict protection', 'If two people edit the same product, no change is overwritten'],
      ['FileLock', 'GDPR / KVKK', 'Data processing agreement and a transparent security page'],
    ],
    whyTitle: 'Why QRNot?',
    why: [
      ['Factory', 'QR / NFC production know-how', 'We produce physical QR and NFC products ourselves and know label printing.'],
      ['Zap', 'Fast setup', 'Your company account is opened in minutes; the pilot starts right away.'],
      ['Headset', 'Local support', 'Built in Türkiye, with a Turkish-language panel and support line.'],
    ],
    contactTitle: 'Quotes and demo',
    demoLine: `Sample passport: ${COMPANY.demo}`,
    supportLine: `Support line for existing customers (Turkey): ${COMPANY.support}`,
    footerNote: 'Screenshots are from the live system with sample data. Images are illustrative.',
    s2Kicker: 'A changing rule',
    s2Title: 'Products on the EU market will travel with a digital passport.',
    s2Points: [
      'Under ESPR, digital product passports are being phased in by product group.',
      'First concrete step: a battery passport for certain batteries from February 2027.',
      'Textiles, iron and steel, furniture and other priority groups are next.',
      'The passport must open via a QR code or NFC on the product and stay available for the product’s lifetime.',
    ],
    s3Kicker: 'Who is affected?',
    s3Title: 'Every manufacturer, importer and brand selling into the EU.',
    s3Lead: 'For manufacturers exporting to the EU, collecting passport data, publishing it correctly and printing it on labels is new work. Those who start early and can tell customers “we are ready” get ahead.',
    sectors: ['Textiles and apparel', 'Footwear', 'Furniture', 'Batteries', 'Electronics and appliances', 'Toys', 'Construction products', 'Iron, steel and metals'],
    s5Kicker: 'Solution',
    s5Title: 'QRNot DPP: enter, publish, label.',
    pillars: [
      ['PencilRuler', 'Enter', 'Tabbed panel, CSV bulk import, supplier data via link, carbon estimate.'],
      ['Globe', 'Publish', '8 languages, versioning, authorised access, machine-readable data.'],
      ['QrCode', 'Label', 'Model / serial QR codes, label printing, GS1 Digital Link, NFC.'],
    ],
    thanksTitle: 'Let’s prepare the first passport for your exports together.',
    thanksLead: 'Start with a pilot: we prepare passports for a few products and fit the labels to your production line.',
    social: [
      { kicker: 'Exporting to the EU?', title: 'The Digital Product Passport is coming. Are you ready?', lead: 'It is being phased in for products on the EU market. Anyone who scans the QR will see the product’s materials, origin, care and recycling information.', cta: 'qrnot.com/dpp' },
      { kicker: 'One QR, 8 languages', title: 'Everyone gets to know your product in their own language.', lead: 'Turkish, English, German, French, Spanish, Dutch, Arabic, Russian. No app needed.', cta: 'Sample: qrnot.com/p/ornekpasaport' },
      { kicker: 'Print the label once', title: 'The information updates. The QR never changes.', lead: 'Every update is published as a new version and earlier versions stay on record. No reprinting.', cta: 'qrnot.com/dpp' },
      { kicker: 'Pilot programme', title: 'Let’s prepare your first passports together.', lead: 'Start with a few products: we enter the data together, fit the labels to your line, and you tell your EU customers “we are ready”.', cta: `WhatsApp ${COMPANY.whatsapp}` },
      { kicker: 'Supplier data portal', title: 'Get the data from your supplier with one link.', lead: 'Without logging in, in their own language, your supplier fills in materials, certificates and facility details and uploads documents. You review and copy it into the product in one click.', cta: 'qrnot.com/dpp' },
      { kicker: 'Carbon estimate', title: 'No carbon figure yet? Start with a sourced estimate.', lead: 'A range for the raw-material stage is calculated from material shares and weight, and the passport clearly shows it as an “estimate”.', cta: 'qrnot.com/dpp' },
    ],
  },
}

// ---------------------------------------------------------------------------------------------
// Tasarım
// ---------------------------------------------------------------------------------------------
const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body { font-family: Inter, 'Segoe UI', sans-serif; color: ${C.ink}; -webkit-font-smoothing: antialiased; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1, h2, h3, .head { font-family: Montserrat, 'Segoe UI', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
  .kicker { font-family: Montserrat, sans-serif; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; }
  .muted { color: ${C.muted}; }
  .card { background: #fff; border: 1.5px solid ${C.line}; border-radius: 24px; }
  .soft { background: ${C.paper}; border-radius: 24px; }
  .pill { display: inline-flex; align-items: center; gap: 10px; border-radius: 999px; font-weight: 600; }
  .dark { background: linear-gradient(150deg, ${C.navy} 0%, ${C.navy2} 70%, #071f31 100%); color: #fff; }
  .dark .muted { color: rgba(255,255,255,.72); }
  .dark .card { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.14); }
  .accent { color: ${C.mint}; }
  .ring { border-radius: 18px; display: grid; place-items: center; flex-shrink: 0; }
  .phone { border-radius: 46px; padding: 11px; background: #0d1622; box-shadow: 0 30px 70px rgba(10,30,50,.35), 0 0 0 1.5px rgba(255,255,255,.06); }
  .phone .glass { border-radius: 36px; overflow: hidden; background: #fff; }
  .phone img { display: block; width: 100%; }
  .browser { border-radius: 18px; overflow: hidden; background: #fff; box-shadow: 0 30px 70px rgba(10,30,50,.25); border: 1.5px solid ${C.line}; }
  .browser .bar { height: 38px; background: #eef2f6; display: flex; align-items: center; gap: 8px; padding: 0 16px; border-bottom: 1px solid ${C.line}; }
  .browser .dot { width: 12px; height: 12px; border-radius: 50%; }
  .browser .url { margin-left: 14px; flex: 1; height: 22px; border-radius: 8px; background: #fff; font-size: 12px; color: ${C.muted}; display: flex; align-items: center; padding: 0 10px; }
  .browser img { display: block; width: 100%; }
  .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px); background-size: 56px 56px; mask-image: radial-gradient(circle at 70% 30%, black, transparent 70%); pointer-events: none; }
`

const ringIcon = (name, color, size = 64, bg) => `<div class="ring" style="width:${size}px;height:${size}px;background:${bg || color + '1a'}">${icon(name, size * 0.48, color, 1.9)}</div>`
const logo = (dark, size = 52) =>
  `<div style="display:flex;align-items:center;gap:14px"><div style="width:${size}px;height:${size}px;border-radius:14px;background:${dark ? '#fff' : C.navy};color:${dark ? C.navy : '#fff'};display:grid;place-items:center;font:800 ${size * 0.3}px Montserrat">DPP</div>
   <div><div class="head" style="font-size:${size * 0.56}px;line-height:1;color:${dark ? '#fff' : C.ink}">QRNot <span style="color:${dark ? C.mint : C.green}">DPP</span></div></div></div>`
const phone = (img, width, crop = null) =>
  `<div class="phone" style="width:${width}px"><div class="glass" style="${crop ? `height:${crop}px` : ''}"><img src="${asset(img)}"></div></div>`
const browserCrop = (img, height, url = 'qrnot.com/dpp/panel') =>
  `<div class="browser"><div class="bar"><span class="dot" style="background:#ff6058"></span><span class="dot" style="background:#ffbd2e"></span><span class="dot" style="background:#28c840"></span><span class="url">🔒 ${url}</span></div><div style="height:${height}px;overflow:hidden"><img src="${asset(img)}"></div></div>`
// Dile göre ekran görüntüsü: passport-<set>-<arayüz dili>.png (set = materyalin dili; içerik de o dilde girilmiş ürün)
const P = (t, ui = t.lang) => `passport-${t.lang}-${ui}.png`
const PHONES = (t) => [
  [P(t), t.lang === 'tr' ? 'Türkçe' : 'English'],
  [P(t, 'de'), 'Deutsch'],
  [P(t, 'ar'), 'العربية'],
]

// Basılan QR etiket sayfası (sistemin ürettiği çıktının aynısı; dilden bağımsız)
const qrMarkup = (value, size) =>
  renderToStaticMarkup(React.createElement(QRCodeSVG, { value, size, level: 'M', marginSize: 0, fgColor: '#0b1b2b' }))
const labelSheet = (height, cols = 6) => {
  const qr = 112
  const rowH = qr + 54 // QR + seri no + "DPP" + kenar boşlukları
  const n = Math.max(1, Math.ceil((height - 40) / (rowH + 10))) * cols // son satır kesilebilir: sayfanın devam ettiği görülür
  return `<div style="height:${height}px;overflow:hidden;background:#fff;border-radius:18px;border:1.5px solid ${C.line};padding:20px;display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;align-content:start;box-shadow:0 30px 70px rgba(10,30,50,.18)">
    ${Array.from({ length: n }, (_, i) => `<div style="border:1.5px dashed #c9d3dd;border-radius:8px;padding:8px;text-align:center"><div style="display:flex;justify-content:center">${qrMarkup(`https://qrnot.com/p/${(i * 7919 + 104729).toString(36).padStart(10, 'k')}`, qr)}</div><div style="font:600 ${Math.max(10, qr / 9)}px Consolas, monospace;margin-top:6px">TS24-${String(i + 1).padStart(6, '0')}</div><div style="font-size:9px;color:${C.muted}">DPP</div></div>`).join('')}
  </div>`
}

// Sürüm geçmişi görseli (yayın kayıtları; QR adresi sabit)
const versionGraphic = (t, height) => `<div style="height:${height}px;background:#fff;border-radius:18px;border:1.5px solid ${C.line};padding:28px;display:flex;flex-direction:column;gap:14px;box-shadow:0 30px 70px rgba(10,30,50,.18);overflow:hidden">
  <div style="display:flex;align-items:center;justify-content:space-between"><span class="head" style="font-size:24px">${t.versionLabels.title}</span><span class="pill" style="padding:8px 14px;font-size:15px;background:${C.paper}">${icon('QrCode', 18, C.navy, 2)} ${t.versionLabels.qrSame}</span></div>
  ${t.versionLabels.rows
    .map(([v, date, note], i) => `<div style="display:flex;gap:16px;align-items:center;border:1.5px solid ${i === 0 ? C.green : C.line};border-radius:14px;padding:16px 18px;${i === 0 ? 'background:#effaf4' : ''}">
      <span class="head" style="font-size:26px;color:${i === 0 ? C.green : C.navy};width:56px">v${v}</span>
      <div style="flex:1"><div style="font-size:18px;font-weight:700">${note}</div><div class="muted" style="font-size:15px;margin-top:2px">${date}</div></div>
      ${i === 0 ? `<span class="pill" style="padding:6px 12px;font-size:14px;background:${C.green};color:#fff">${t.versionLabels.live}</span>` : `<span class="muted" style="font-size:14px">${t.versionLabels.archived}</span>`}
    </div>`)
    .join('')}
</div>`

// Makine okunur pasaport (gerçek JSON biçiminden kesit; alan adları şemaya göre İngilizce)
const jsonCard = (height) => `<div style="height:${height}px;background:#0b1b2b;border-radius:18px;padding:24px 28px;overflow:hidden;box-shadow:0 30px 70px rgba(10,30,50,.25);font:15px/1.6 Consolas, monospace;color:#cfe3f5;white-space:pre">${`{
  <b style="color:${C.mint}">"schema"</b>: "qrnot-dpp/1",
  <b style="color:${C.mint}">"id"</b>: "https://qrnot.com/p/…",
  <b style="color:${C.mint}">"version"</b>: 3,
  <b style="color:${C.mint}">"product"</b>: { "gtin": "…", "brand": "Anadolu Wear",
               "category": "textile", "countryOfOrigin": "TR" },
  <b style="color:${C.mint}">"item"</b>: { "serial": "TS24-000127", "batch": "L-2410" },
  <b style="color:${C.mint}">"materials"</b>: [ { "name": "Organic cotton", "percent": 95 }, … ],
  <b style="color:${C.mint}">"environment"</b>: { "carbonKg": 2.1, "recyclablePercent": 95 },
  <b style="color:${C.mint}">"compliance"</b>: [ { "name": "GOTS" }, … ],
  <b style="color:${C.mint}">"documents"</b>: [ … ]
}`}</div>`

const PANEL = (t, name) => `panel-${t.lang}-${name}.png`
const PANEL_SECOND = (t) => (t.lang === 'tr' ? PANEL(t, 'languages') : PANEL(t, 'items'))
const browser = (img, url = 'qrnot.com/dpp/panel') =>
  `<div class="browser"><div class="bar"><span class="dot" style="background:#ff6058"></span><span class="dot" style="background:#ffbd2e"></span><span class="dot" style="background:#28c840"></span><span class="url">🔒 ${url}</span></div><img src="${asset(img)}"></div>`

// ───────────── A4 katalog (1240 × 1754) ─────────────
const AW = 1240
const AH = 1754
const a4 = (body, n, total, t, { dark = false } = {}) => `<section style="position:relative;width:${AW}px;height:${AH}px;overflow:hidden;padding:84px 84px 120px;display:flex;flex-direction:column;page-break-after:always" class="${dark ? 'dark' : ''}">
  ${dark ? '<div class="grid-bg"></div>' : ''}
  <div style="position:relative;display:flex;flex-direction:column;flex:1">${body}</div>
  <div style="position:absolute;left:84px;right:84px;bottom:44px;display:flex;justify-content:space-between;font-size:15px;padding-top:16px;border-top:1px solid ${dark ? 'rgba(255,255,255,.15)' : C.line};color:${dark ? 'rgba(255,255,255,.6)' : C.muted}">
    <span>QRNot · ${t.catalog} ${t.year}</span><span>${COMPANY.site} · ${t.page} ${n} / ${total}</span></div>
</section>`

const catalogPages = (t) => [
  // 1 · Kapak
  { slug: 'kapak', dark: true, body: `
    ${logo(true, 60)}
    <div style="display:grid;grid-template-columns:1fr 360px;gap:50px;margin-top:90px;align-items:start">
      <div>
        <div class="kicker accent" style="font-size:17px">${t.coverKicker}</div>
        <h1 style="font-size:84px;line-height:1.02;margin-top:26px">${t.coverTitle[0]}<br>${t.coverTitle[1]}<br><span class="accent">${t.coverTitle[2]}</span></h1>
        <p class="muted" style="font-size:24px;line-height:1.55;margin-top:34px">${t.coverLead}</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:36px">${t.coverPills.map((p) => `<span class="pill" style="padding:11px 20px;font-size:18px;border:1.5px solid rgba(255,255,255,.25)">${icon('Check', 18, C.mint, 2.6)} ${p}</span>`).join('')}</div>
      </div>
      <div style="margin-top:10px">${phone(P(t), 360, 720)}</div>
    </div>
    <div style="margin-top:auto;margin-bottom:26px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
      ${t.audience.map(([ic, title, desc]) => `<div class="card" style="padding:26px">${ringIcon(ic, C.mint, 58, 'rgba(63,210,154,.14)')}<div class="head" style="font-size:24px;margin-top:18px">${title}</div><div class="muted" style="font-size:17px;margin-top:8px;line-height:1.45">${desc}</div></div>`).join('')}
    </div>` },
  // 2 · DPP nedir
  { slug: 'dpp-nedir', body: `
    ${logo(false)}
    <div class="kicker" style="font-size:17px;color:${C.green};margin-top:64px">${t.whatKicker}</div>
    <h2 style="font-size:62px;margin-top:16px">${t.whatTitle}</h2>
    <p class="muted" style="font-size:22px;line-height:1.6;margin-top:22px">${t.whatLead}</p>
    <div class="soft" style="padding:36px;margin-top:40px">
      <h3 style="font-size:30px">${t.timelineTitle}</h3>
      <div style="margin-top:22px;display:flex;flex-direction:column;gap:18px">
        ${t.timeline.map(([when, what], i) => `<div style="display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:start"><div style="display:flex;align-items:center;gap:12px"><span style="width:14px;height:14px;border-radius:50%;background:${i === 2 ? C.amber : C.sky}"></span><span class="head" style="font-size:22px;color:${C.navy}">${when}</span></div><div style="font-size:19px;line-height:1.5">${what}</div></div>`).join('')}
      </div>
      <p class="muted" style="font-size:15px;margin-top:22px">${t.timelineNote}</p>
    </div>
    <h3 style="font-size:32px;margin-top:44px">${t.contentTitle}</h3>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:22px">
      ${t.content.map(([ic, title, desc], i) => `<div class="card" style="padding:22px">${ringIcon(ic, [C.sky, C.green, C.navy, C.amber][i % 4], 52)}<div style="font-size:19px;font-weight:700;margin-top:14px;line-height:1.25">${title}</div><div class="muted" style="font-size:15px;margin-top:6px;line-height:1.4">${desc}</div></div>`).join('')}
    </div>` },
  // 3 · Tüketici deneyimi
  { slug: 'tuketici', body: `
    ${logo(false)}
    <div class="kicker" style="font-size:17px;color:${C.green};margin-top:64px">${t.consumerKicker}</div>
    <h2 style="font-size:60px;margin-top:16px;line-height:1.08">${t.consumerTitle}</h2>
    <p class="muted" style="font-size:22px;line-height:1.6;margin-top:20px">${t.consumerLead}</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:44px;align-items:end">
      ${PHONES(t).map(([img, label]) => `<div style="text-align:center">${phone(img, 320, 600)}<div class="pill" style="margin-top:18px;padding:8px 18px;font-size:16px;background:${C.paper}">${icon('Globe', 16, C.sky, 2)} ${label}</div></div>`).join('')}
    </div>
    <div style="margin-top:auto;margin-bottom:26px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
      ${t.consumerPoints.map(([ic, title, desc]) => `<div class="soft" style="padding:22px">${ringIcon(ic, C.navy, 50, '#fff')}<div style="font-size:19px;font-weight:700;margin-top:14px">${title}</div><div class="muted" style="font-size:15px;margin-top:6px;line-height:1.4">${desc}</div></div>`).join('')}
    </div>` },
  // 4 · Firma paneli
  { slug: 'firma-paneli', body: `
    ${logo(false)}
    <div class="kicker" style="font-size:17px;color:${C.green};margin-top:64px">${t.panelKicker}</div>
    <h2 style="font-size:60px;margin-top:16px">${t.panelTitle}</h2>
    <p class="muted" style="font-size:21px;line-height:1.6;margin-top:18px">${t.panelLead}</p>
    <div style="margin-top:34px">${browserCrop(PANEL(t, 'overview'), 560)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">${browserCrop(PANEL(t, 'materials'), 250)}${browserCrop(PANEL_SECOND(t), 250)}</div>
    <div style="margin-top:auto;margin-bottom:26px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
      ${t.panelFeatures.map(([ic, title, desc], i) => `<div class="card" style="padding:18px 20px;display:flex;gap:16px;align-items:center">${ringIcon(ic, [C.sky, C.green, C.navy][i % 3], 48)}<div><div style="font-size:18px;font-weight:700">${title}</div><div class="muted" style="font-size:14px;margin-top:4px;line-height:1.35">${desc}</div></div></div>`).join('')}
    </div>` },
  // 5 · Tedarikçi portalı, karbon tahmini, veri güvenliği
  { slug: 'tedarikci-karbon', body: `
    ${logo(false)}
    <div class="kicker" style="font-size:17px;color:${C.green};margin-top:56px">${t.supKicker}</div>
    <h2 style="font-size:54px;margin-top:14px">${t.supTitle}</h2>
    <p class="muted" style="font-size:19px;line-height:1.55;margin-top:14px">${t.supLead}</p>
    <div style="display:grid;grid-template-columns:1fr 250px;gap:26px;margin-top:26px;align-items:start">
      <div>${browserCrop(PANEL(t, 'suppliers'), 470)}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px">${t.supSteps.map(([ic, title, desc], i) => `<div class="soft" style="padding:16px 18px"><div style="display:flex;align-items:center;gap:10px">${ringIcon(ic, C.navy, 40, '#fff')}<span class="head" style="font-size:22px;color:${C.line}">0${i + 1}</span></div><div style="font-size:17px;font-weight:700;margin-top:10px">${title}</div><div class="muted" style="font-size:14px;margin-top:4px;line-height:1.35">${desc}</div></div>`).join('')}</div>
      </div>
      ${phone(`supplier-${t.lang}-form.png`, 250, 540)}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:30px;align-items:start">
      <div><div class="kicker" style="font-size:15px;color:${C.green}">${t.carbonKicker}</div>
        <h3 style="font-size:30px;margin-top:8px;line-height:1.15">${t.carbonTitle}</h3>
        <p class="muted" style="font-size:16px;line-height:1.5;margin-top:10px">${t.carbonLead}</p></div>
      ${browserCrop(PANEL(t, 'carbon'), 300)}
    </div>
    <div class="dark" style="margin-top:auto;margin-bottom:26px;border-radius:24px;padding:24px 28px">
      <div class="kicker accent" style="font-size:15px">${t.safetyKicker}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:14px">${t.safety.map(([ic, title, desc]) => `<div>${icon(ic, 28, C.mint, 2)}<div style="font-size:17px;font-weight:700;margin-top:8px">${title}</div><div class="muted" style="font-size:13.5px;margin-top:4px;line-height:1.35">${desc}</div></div>`).join('')}</div>
    </div>` },
  // 6 · Üretimden rafa
  { slug: 'uretim-etiket', body: `
    ${logo(false)}
    <div class="kicker" style="font-size:17px;color:${C.green};margin-top:64px">${t.prodKicker}</div>
    <h2 style="font-size:60px;margin-top:16px">${t.prodTitle}</h2>
    <p class="muted" style="font-size:21px;line-height:1.6;margin-top:18px">${t.prodLead}</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:34px">
      ${t.prodSteps.map(([ic, title, desc], i) => `<div class="soft" style="padding:22px;position:relative"><span class="head" style="position:absolute;right:20px;top:16px;font-size:34px;color:${C.line}">0${i + 1}</span>${ringIcon(ic, C.navy, 50, '#fff')}<div style="font-size:19px;font-weight:700;margin-top:14px">${title}</div><div class="muted" style="font-size:15px;margin-top:6px;line-height:1.4">${desc}</div></div>`).join('')}
    </div>
    <div style="margin-top:30px">${browserCrop(PANEL(t, 'labels'), 640)}</div>
    <div class="dark" style="margin-top:auto;margin-bottom:26px;border-radius:24px;padding:30px 34px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center">
      <div><div class="head" style="font-size:28px">${t.gs1Title}</div><div class="muted" style="font-size:18px;margin-top:8px">${t.gs1Lead}</div>
        <div style="margin-top:14px;font:600 22px Consolas, monospace;color:${C.mint}">${t.gs1Example}</div>
        <div class="muted" style="font-size:16px;margin-top:12px">${icon('Nfc', 18, C.mint, 2)} ${t.nfcNote}</div></div>
      ${icon('Barcode', 120, C.mint, 1.4)}
    </div>` },
  // 7 · Güven
  { slug: 'guven', body: `
    ${logo(false)}
    <div class="kicker" style="font-size:17px;color:${C.green};margin-top:64px">${t.trustKicker}</div>
    <h2 style="font-size:60px;margin-top:16px">${t.trustTitle}</h2>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:40px">
      ${t.trust.map(([ic, title, desc], i) => `<div class="card" style="padding:28px;display:flex;gap:20px">${ringIcon(ic, [C.navy, C.green, C.amber, C.sky][i % 4], 60)}<div><div class="head" style="font-size:23px">${title}</div><div class="muted" style="font-size:17px;margin-top:8px;line-height:1.5">${desc}</div></div></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 330px;gap:30px;margin-top:36px;align-items:center">
      <div class="soft" style="padding:30px 34px"><div class="head" style="font-size:24px">${icon('MessageSquareQuote', 26, C.green, 2)} ${t.honestTitle}</div><p style="font-size:18px;line-height:1.6;margin-top:12px">${t.honest}</p></div>
      ${phone(`passport-${t.lang}-materials.png`, 330, 470)}
    </div>` },
  // 8 · Paketler ve iletişim
  { slug: 'paketler-iletisim', dark: true, body: `
    ${logo(true)}
    <div class="kicker accent" style="font-size:17px;margin-top:64px">${t.plansKicker}</div>
    <h2 style="font-size:60px;margin-top:16px">${t.plansTitle}</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:34px">
      ${t.plans.map(([name, limit, desc], i) => `<div class="card" style="padding:26px;${i === 1 ? `border-color:${C.mint};box-shadow:0 0 0 2px ${C.mint}` : ''}"><div class="head" style="font-size:28px">${name}</div><div class="accent" style="font-size:18px;font-weight:700;margin-top:6px">${limit}</div><div class="muted" style="font-size:16px;margin-top:12px;line-height:1.45">${desc}</div></div>`).join('')}
    </div>
    <p class="muted" style="font-size:17px;margin-top:18px;line-height:1.5">${t.plansNote}</p>
    <h3 style="font-size:34px;margin-top:46px">${t.startTitle}</h3>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:22px">
      ${t.start.map(([ic, title, desc], i) => `<div class="card" style="padding:24px"><div style="display:flex;justify-content:space-between;align-items:center">${ringIcon(ic, C.mint, 52, 'rgba(63,210,154,.14)')}<span class="head" style="font-size:36px;color:rgba(255,255,255,.25)">0${i + 1}</span></div><div style="font-size:20px;font-weight:700;margin-top:16px">${title}</div><div class="muted" style="font-size:15px;margin-top:6px;line-height:1.45">${desc}</div></div>`).join('')}
    </div>
    <h3 style="font-size:34px;margin-top:46px">${t.whyTitle}</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px">
      ${t.why.map(([ic, title, desc]) => `<div style="display:flex;gap:16px;align-items:flex-start">${ringIcon(ic, C.mint, 52, 'rgba(63,210,154,.14)')}<div><div style="font-size:20px;font-weight:700">${title}</div><div class="muted" style="font-size:15px;margin-top:6px;line-height:1.45">${desc}</div></div></div>`).join('')}
    </div>
    <div class="card" style="margin-top:auto;margin-bottom:26px;padding:38px;border-color:rgba(63,210,154,.5);display:grid;grid-template-columns:1fr 230px;gap:34px;align-items:center">
      <div>
      <h3 style="font-size:40px">${t.contactTitle}</h3>
      <div style="display:flex;flex-wrap:wrap;gap:16px 38px;margin-top:24px">
        ${[['Globe', COMPANY.site], ['Mail', COMPANY.email], ['MessageCircle', `WhatsApp ${COMPANY.whatsapp}`]].map(([ic, text]) => `<div style="display:flex;align-items:center;gap:12px;font-size:21px;font-weight:600">${icon(ic, 26, C.mint, 2)}${text}</div>`).join('')}
      </div>
      <p style="font-size:19px;margin-top:20px">${icon('QrCode', 20, C.mint, 2)} ${t.demoLine}</p>
      <p class="muted" style="font-size:16px;margin-top:14px">${t.supportLine}</p>
      <p style="font-size:14px;margin-top:14px;color:rgba(255,255,255,.45)">${t.footerNote}</p>
      </div>
      <div style="background:#fff;border-radius:22px;padding:16px;text-align:center;color:${C.ink}"><img src="QR_PLACEHOLDER" style="width:100%;display:block"><div style="font-size:14px;font-weight:700;margin-top:8px">${t.lang === 'tr' ? 'Örnek pasaport' : 'Sample passport'}</div></div>
    </div>` },
]

// ───────────── 16:9 sunum (1920 × 1080) ─────────────
const SW = 1920
const SH = 1080
const slide = (body, n, total, t, { dark = false } = {}) => `<section style="position:relative;width:${SW}px;height:${SH}px;overflow:hidden;padding:80px 110px 96px;display:flex;flex-direction:column;page-break-after:always" class="${dark ? 'dark' : ''}">
  ${dark ? '<div class="grid-bg"></div>' : ''}
  <div style="position:relative;display:flex;flex-direction:column;flex:1">${body}</div>
  <div style="position:absolute;left:110px;right:110px;bottom:36px;display:flex;justify-content:space-between;align-items:center;font-size:17px;color:${dark ? 'rgba(255,255,255,.55)' : C.muted}">
    <span style="font-weight:700">QRNot <span style="color:${dark ? C.mint : C.green}">DPP</span></span><span>${n} / ${total}</span></div>
</section>`
const sTitle = (t, kicker, title, dark = false) =>
  `<div class="kicker" style="font-size:20px;color:${dark ? C.mint : C.green}">${kicker}</div><h2 style="font-size:66px;line-height:1.08;margin-top:18px;max-width:1500px">${title}</h2>`

const deckSlides = (t) => [
  { slug: 'kapak', dark: true, body: `
    ${logo(true, 64)}
    <div style="display:grid;grid-template-columns:1fr 400px;gap:80px;margin-top:70px;align-items:center;flex:1">
      <div>
        <div class="kicker accent" style="font-size:22px">${t.coverKicker}</div>
        <h1 style="font-size:104px;line-height:1.02;margin-top:28px">${t.coverTitle[0]} ${t.coverTitle[1]}<br><span class="accent">${t.coverTitle[2]}</span></h1>
        <p class="muted" style="font-size:28px;line-height:1.5;margin-top:34px;max-width:1050px">${t.coverLead}</p>
      </div>
      <div style="margin-top:-40px">${phone(P(t), 380, 760)}</div>
    </div>` },
  { slug: 'degisen-kural', body: `
    ${sTitle(t, t.s2Kicker, t.s2Title)}
    <div style="display:grid;grid-template-columns:1fr 760px;gap:70px;margin-top:56px;flex:1">
      <div style="display:flex;flex-direction:column;gap:22px">${t.s2Points.map((p, i) => `<div style="display:flex;gap:22px;align-items:flex-start"><span class="head" style="font-size:40px;color:${C.green};width:60px">0${i + 1}</span><span style="font-size:28px;line-height:1.45">${p}</span></div>`).join('')}</div>
      <div class="soft" style="padding:40px">
        <div class="head" style="font-size:30px">${t.timelineTitle}</div>
        <div style="margin-top:26px;display:flex;flex-direction:column;gap:22px">${t.timeline.map(([w, x], i) => `<div style="display:grid;grid-template-columns:190px 1fr;gap:18px"><span class="head" style="font-size:22px;color:${i === 2 ? C.amber : C.navy}">${w}</span><span style="font-size:20px;line-height:1.45">${x}</span></div>`).join('')}</div>
      </div>
    </div>` },
  { slug: 'kimleri-etkiliyor', dark: true, body: `
    ${sTitle(t, t.s3Kicker, t.s3Title, true)}
    <p class="muted" style="font-size:30px;line-height:1.5;margin-top:34px;max-width:1450px">${t.s3Lead}</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:auto;margin-bottom:30px">
      ${t.sectors.map((s, i) => `<div class="card" style="padding:28px 30px;display:flex;align-items:center;gap:18px">${ringIcon(['Shirt', 'Footprints', 'Sofa', 'BatteryCharging', 'Plug', 'ToyBrick', 'Building2', 'Factory'][i], C.mint, 56, 'rgba(63,210,154,.14)')}<span style="font-size:24px;font-weight:700">${s}</span></div>`).join('')}
    </div>` },
  { slug: 'pasaport-icerigi', body: `
    ${sTitle(t, t.whatKicker, t.contentTitle)}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:56px">
      ${t.content.map(([ic, title, desc], i) => `<div class="card" style="padding:30px">${ringIcon(ic, [C.sky, C.green, C.navy, C.amber][i % 4], 64)}<div class="head" style="font-size:26px;margin-top:20px">${title}</div><div class="muted" style="font-size:20px;margin-top:8px;line-height:1.4">${desc}</div></div>`).join('')}
    </div>
    <div style="margin-top:auto;margin-bottom:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px">
      ${t.audience.map(([ic, title, desc]) => `<div class="soft" style="padding:24px 28px;display:flex;gap:18px;align-items:center">${ringIcon(ic, C.navy, 54, '#fff')}<div><div style="font-size:22px;font-weight:700">${title}</div><div class="muted" style="font-size:17px;margin-top:4px">${desc}</div></div></div>`).join('')}
    </div>` },
  { slug: 'cozum', dark: true, body: `
    ${sTitle(t, t.s5Kicker, t.s5Title, true)}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:70px">
      ${t.pillars.map(([ic, title, desc], i) => `<div class="card" style="padding:46px 40px"><div style="display:flex;justify-content:space-between;align-items:center">${ringIcon(ic, C.mint, 84, 'rgba(63,210,154,.14)')}<span class="head" style="font-size:64px;color:rgba(255,255,255,.18)">0${i + 1}</span></div><div class="head" style="font-size:44px;margin-top:30px">${title}</div><div class="muted" style="font-size:24px;margin-top:14px;line-height:1.5">${desc}</div></div>`).join('')}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:auto;margin-bottom:24px">${t.coverPills.map((p) => `<span class="pill" style="padding:12px 22px;font-size:20px;border:1.5px solid rgba(255,255,255,.25)">${icon('Check', 20, C.mint, 2.6)} ${p}</span>`).join('')}</div>` },
  { slug: 'tuketici', body: `
    <div style="display:grid;grid-template-columns:640px 1fr;gap:70px;flex:1">
      <div style="display:flex;flex-direction:column">
        ${sTitle(t, t.consumerKicker, t.consumerTitle)}
        <p class="muted" style="font-size:25px;line-height:1.55;margin-top:26px">${t.consumerLead}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:auto;margin-bottom:24px">${t.consumerPoints.map(([ic, title, desc]) => `<div class="soft" style="padding:20px;display:flex;gap:14px;align-items:center">${ringIcon(ic, C.navy, 48, '#fff')}<div><div style="font-size:20px;font-weight:700">${title}</div><div class="muted" style="font-size:15px;margin-top:3px">${desc}</div></div></div>`).join('')}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:26px;align-items:center">
        ${PHONES(t).map(([img]) => phone(img, 300, 640)).join('')}
      </div>
    </div>` },
  { slug: 'firma-paneli', body: `
    <div style="display:grid;grid-template-columns:560px 1fr;gap:60px;flex:1">
      <div style="display:flex;flex-direction:column">
        ${sTitle(t, t.panelKicker, t.panelTitle)}
        <p class="muted" style="font-size:22px;line-height:1.55;margin-top:22px">${t.panelLead}</p>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:auto;margin-bottom:24px">${t.panelFeatures.map(([ic, title, desc], i) => `<div style="display:flex;gap:14px;align-items:center">${ringIcon(ic, [C.sky, C.green, C.navy][i % 3], 44)}<div><span style="font-size:20px;font-weight:700">${title}</span> <span class="muted" style="font-size:17px">· ${desc}</span></div></div>`).join('')}</div>
      </div>
      <div style="position:relative">${browser(PANEL(t, 'overview'))}<div style="position:absolute;width:62%;right:-30px;bottom:-10px">${browser(PANEL(t, 'editor'))}</div></div>
    </div>` },
  { slug: 'tedarikci-portali', body: `
    <div style="display:grid;grid-template-columns:620px 1fr 300px;gap:44px;flex:1">
      <div style="display:flex;flex-direction:column">
        ${sTitle(t, t.supKicker, t.supTitle)}
        <p class="muted" style="font-size:21px;line-height:1.55;margin-top:22px">${t.supLead}</p>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:auto;margin-bottom:24px">${t.supSteps.map(([ic, title, desc], i) => `<div style="display:flex;gap:16px;align-items:center"><span class="head" style="font-size:28px;color:${C.green};width:44px">0${i + 1}</span>${ringIcon(ic, C.navy, 46)}<div><div style="font-size:20px;font-weight:700">${title}</div><div class="muted" style="font-size:16px">${desc}</div></div></div>`).join('')}</div>
      </div>
      <div style="align-self:center">${browserCrop(PANEL(t, 'suppliers'), 560)}</div>
      <div style="padding-top:60px">${phone(`supplier-${t.lang}-form.png`, 300, 650)}</div>
    </div>` },
  { slug: 'karbon-ve-guvenlik', body: `
    <div style="display:grid;grid-template-columns:640px 1fr;gap:60px;flex:1">
      <div style="display:flex;flex-direction:column">
        ${sTitle(t, t.carbonKicker, t.carbonTitle)}
        <p class="muted" style="font-size:21px;line-height:1.55;margin-top:22px">${t.carbonLead}</p>
        <div class="dark" style="border-radius:22px;padding:26px 28px;margin-top:auto;margin-bottom:24px">
          <div class="kicker accent" style="font-size:16px">${t.safetyKicker}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 22px;margin-top:14px">${t.safety.map(([ic, title, desc]) => `<div style="display:flex;gap:12px">${icon(ic, 26, C.mint, 2)}<div><div style="font-size:18px;font-weight:700">${title}</div><div class="muted" style="font-size:14px;margin-top:3px;line-height:1.35">${desc}</div></div></div>`).join('')}</div>
        </div>
      </div>
      <div>${browser(PANEL(t, 'carbon'))}</div>
    </div>` },
  { slug: 'uretim-etiket', body: `
    <div style="display:grid;grid-template-columns:600px 1fr;gap:60px;flex:1">
      <div style="display:flex;flex-direction:column">
        ${sTitle(t, t.prodKicker, t.prodTitle)}
        <p class="muted" style="font-size:22px;line-height:1.55;margin-top:22px">${t.prodLead}</p>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:28px">${t.prodSteps.map(([ic, title, desc], i) => `<div style="display:flex;gap:16px;align-items:center"><span class="head" style="font-size:28px;color:${C.green};width:44px">0${i + 1}</span>${ringIcon(ic, C.navy, 46)}<div><div style="font-size:20px;font-weight:700">${title}</div><div class="muted" style="font-size:16px">${desc}</div></div></div>`).join('')}</div>
        <div class="dark" style="border-radius:20px;padding:22px 26px;margin-top:auto;margin-bottom:24px"><div style="font-size:20px;font-weight:700">${t.gs1Title}</div><div style="font:600 20px Consolas, monospace;color:${C.mint};margin-top:8px">${t.gs1Example}</div></div>
      </div>
      <div>${browser(PANEL(t, 'labels'))}</div>
    </div>` },
  { slug: 'guven', body: `
    ${sTitle(t, t.trustKicker, t.trustTitle)}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:50px">
      ${t.trust.map(([ic, title, desc], i) => `<div class="card" style="padding:32px">${ringIcon(ic, [C.navy, C.green, C.amber, C.sky][i % 4], 62)}<div class="head" style="font-size:26px;margin-top:20px">${title}</div><div class="muted" style="font-size:19px;margin-top:10px;line-height:1.5">${desc}</div></div>`).join('')}
    </div>
    <div class="soft" style="margin-top:auto;margin-bottom:24px;padding:26px 32px;display:flex;gap:18px;align-items:flex-start">${icon('MessageSquareQuote', 30, C.green, 2)}<div><span style="font-size:20px;font-weight:700">${t.honestTitle}.</span> <span style="font-size:19px;line-height:1.5">${t.honest}</span></div></div>` },
  { slug: 'baslangic-paketler', body: `
    ${sTitle(t, t.plansKicker, t.startTitle)}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:46px">
      ${t.start.map(([ic, title, desc], i) => `<div class="soft" style="padding:30px"><div style="display:flex;justify-content:space-between;align-items:center">${ringIcon(ic, C.navy, 60, '#fff')}<span class="head" style="font-size:44px;color:${C.line}">0${i + 1}</span></div><div class="head" style="font-size:28px;margin-top:20px">${title}</div><div class="muted" style="font-size:19px;margin-top:8px;line-height:1.45">${desc}</div></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:34px">
      ${t.plans.map(([name, limit, desc], i) => `<div class="card" style="padding:28px;${i === 1 ? `border-color:${C.green};box-shadow:0 0 0 2px ${C.green}` : ''}"><div class="head" style="font-size:30px">${name}</div><div style="font-size:21px;font-weight:700;color:${C.green};margin-top:6px">${limit}</div><div class="muted" style="font-size:18px;margin-top:10px">${desc}</div></div>`).join('')}
    </div>
    <p class="muted" style="font-size:19px;margin-top:auto;margin-bottom:24px">${t.plansNote}</p>` },
  { slug: 'iletisim', dark: true, body: `
    ${logo(true, 64)}
    <div style="display:grid;grid-template-columns:1fr 380px;gap:80px;margin-top:60px;align-items:center;flex:1">
      <div>
        <h2 style="font-size:78px;line-height:1.06">${t.thanksTitle}</h2>
        <p class="muted" style="font-size:28px;line-height:1.5;margin-top:28px">${t.thanksLead}</p>
        <div style="display:flex;flex-direction:column;gap:18px;margin-top:44px">
          ${[['Globe', COMPANY.site], ['QrCode', t.demoLine], ['Mail', COMPANY.email], ['MessageCircle', `WhatsApp ${COMPANY.whatsapp}`]].map(([ic, text]) => `<div style="display:flex;align-items:center;gap:16px;font-size:28px;font-weight:600">${icon(ic, 32, C.mint, 2)}${text}</div>`).join('')}
        </div>
      </div>
      <div style="background:#fff;border-radius:32px;padding:28px;text-align:center;color:${C.ink}">
        <img src="QR_PLACEHOLDER" style="width:100%;display:block">
        <div style="font-size:20px;font-weight:700;margin-top:12px">${t.lang === 'tr' ? 'Örnek pasaportu okutun' : 'Scan the sample passport'}</div>
      </div>
    </div>` },
]

// ───────────── Sosyal medya ─────────────
// 4:5  → LinkedIn + Instagram akış · 1:1 → Instagram / Facebook kare · 9:16 → Story, Reels, TikTok kapağı
const SOCIAL_FORMATS = [
  { dir: '4x5-linkedin-instagram', w: 1080, h: 1350, visual: 620, title: 60, lead: 25, pad: 76 },
  { dir: '1x1-instagram-facebook', w: 1080, h: 1080, visual: 430, title: 52, lead: 22, pad: 64 },
  { dir: '9x16-story-reels-tiktok', w: 1080, h: 1920, visual: 1000, title: 72, lead: 30, pad: 90 },
]

/** Gönderi görseli: verilen yüksekliğe sığar. Her görsel materyalin kendi dilinde (TR panel görüntüleri sadece TR'de). */
function socialVisual(i, t, h) {
  const ph = (img, w) => phone(img, w, Math.round(h - 22))
  if (i === 0) return `<div style="display:flex;justify-content:center">${ph(P(t), Math.round(h * 0.55))}</div>`
  if (i === 1) return `<div style="display:flex;justify-content:center;gap:18px">${PHONES(t).map(([img]) => ph(img, Math.round(Math.min(h * 0.46, 290)))).join('')}</div>`
  // Dikey (9:16) formatta yatay görüntüler alt alta iki parça olarak dizilir; boşluk kalmaz
  const tall = h >= 900
  const half = Math.round((h - 20) / 2)
  const stack = (a, b) => `<div style="display:flex;flex-direction:column;gap:20px">${a}${b}</div>`
  if (i === 2) return tall ? stack(browserCrop(PANEL(t, 'editor'), half - 40), browserCrop(PANEL(t, 'materials'), half - 40)) : browserCrop(PANEL(t, 'editor'), h - 40)
  if (i === 3) return tall ? stack(browserCrop(PANEL(t, 'labels'), half - 40), browserCrop(PANEL(t, 'items'), half - 40)) : browserCrop(PANEL(t, 'labels'), h - 40)
  // 05: tedarikçi paneli + tedarikçinin telefonda gördüğü form
  if (i === 4) {
    const ph5 = phone(`supplier-${t.lang}-form.png`, Math.round(Math.min(h * 0.46, 300)), Math.round(h - 22))
    return tall ? stack(browserCrop(PANEL(t, 'suppliers'), half - 40), `<div style="display:flex;justify-content:center">${phone(`supplier-${t.lang}-form.png`, 300, half - 40)}</div>`) : `<div style="display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center">${browserCrop(PANEL(t, 'suppliers'), Math.min(h - 40, 500))}${ph5}</div>`
  }
  // 06: karbon tahmini kartı
  return browserCrop(PANEL(t, 'carbon'), h - 40)
}

const socialPost = (p, i, t, fmt) => {
  const dark = i === 0 || i === 3 || i === 5
  return `<section style="position:relative;width:${fmt.w}px;height:${fmt.h}px;overflow:hidden;padding:${fmt.pad}px;display:flex;flex-direction:column" class="${dark ? 'dark' : 'soft'}">
    ${dark ? '<div class="grid-bg"></div>' : ''}
    <div style="position:relative;display:flex;flex-direction:column;flex:1">
      ${logo(dark, fmt.h > 1500 ? 60 : 50)}
      <div class="kicker" style="font-size:${Math.round(fmt.lead * 0.78)}px;margin-top:${fmt.h > 1500 ? 80 : 40}px;color:${dark ? C.mint : C.green}">${p.kicker}</div>
      <h2 style="font-size:${fmt.title}px;line-height:1.08;margin-top:16px">${p.title}</h2>
      <p class="muted" style="font-size:${fmt.lead}px;line-height:1.5;margin-top:20px">${p.lead}</p>
      <div style="margin-top:${fmt.h > 1500 ? 60 : 34}px">${socialVisual(i, t, fmt.visual)}</div>
      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;padding-top:22px;border-top:1px solid ${dark ? 'rgba(255,255,255,.18)' : C.line}">
        <span style="font-size:${Math.round(fmt.lead * 0.96)}px;font-weight:700;color:${dark ? C.mint : C.navy}">${p.cta}</span>
        <span class="muted" style="font-size:${Math.round(fmt.lead * 0.72)}px">${t.product}</span>
      </div>
    </div>
  </section>`
}

// ---------------------------------------------------------------------------------------------
// Üret
// ---------------------------------------------------------------------------------------------
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((x) => existsSync(x))
if (!CHROME) throw new Error('Chrome / Edge bulunamadı')

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`
const doc = (sections, lang, size) =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">${FONTS}<style>${CSS} @page { size: ${size[0]}px ${size[1]}px; margin: 0; }</style></head><body>${sections}</body></html>`

// Son slayttaki örnek pasaport QR'ı (sitenin de kullandığı qrcode.react ile, SVG data URI)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { QRCodeSVG } = require('qrcode.react')
const qrSvg = renderToStaticMarkup(React.createElement(QRCodeSVG, { value: 'https://qrnot.com/p/ornekpasaport', size: 600, level: 'M', marginSize: 1, fgColor: C.navy }))
  .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
const QR_URI = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString('base64')}`

const tmp = join(tmpdir(), 'qrnot-dpp-html')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })

function render(html, file, w, h) {
  const path = join(tmp, `${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(path, html)
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--virtual-time-budget=12000', `--screenshot=${file}`, pathToFileURL(path).href], { stdio: 'ignore' })
}
function pdf(html, file) {
  const path = join(tmp, `${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(path, html)
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer', '--virtual-time-budget=15000', `--print-to-pdf=${file}`, pathToFileURL(path).href], { stdio: 'ignore' })
}

// Önizleme: DPP_ONLY=slug1,slug2 (sosyal için 05,06) → sadece bunlar PNG olarak üretilir, PDF atlanır
const ONLY = process.env.DPP_ONLY ? process.env.DPP_ONLY.split(',') : null
const want = (key) => !ONLY || ONLY.includes(key)

for (const lang of ['tr', 'en']) {
  const t = T[lang]

  // Katalog
  const pages = catalogPages(t)
  const catSections = pages.map((p, i) => a4(p.body.replace('QR_PLACEHOLDER', QR_URI), i + 1, pages.length, t, { dark: p.dark }))
  const catDir = join(HERE, 'katalog', lang)
  mkdirSync(catDir, { recursive: true })
  catSections.forEach((s, i) => {
    if (!want(pages[i].slug)) return
    const name = `${String(i + 1).padStart(2, '0')}-${pages[i].slug}.png`
    render(doc(s, lang, [AW, AH]), join(catDir, name), AW, AH)
    console.log(`katalog/${lang}/${name}`)
  })
  if (!ONLY) pdf(doc(catSections.join('\n'), lang, [AW, AH]), join(HERE, 'katalog', `QRNot-DPP-Katalog-${lang.toUpperCase()}.pdf`))
  console.log(`katalog PDF ${lang}`)

  // Sunum
  const slides = deckSlides(t)
  const deckSections = slides.map((s, i) => slide(s.body.replace('QR_PLACEHOLDER', QR_URI), i + 1, slides.length, t, { dark: s.dark }))
  const deckDir = join(HERE, 'sunum', lang)
  mkdirSync(deckDir, { recursive: true })
  deckSections.forEach((s, i) => {
    if (!want(slides[i].slug)) return
    const name = `${String(i + 1).padStart(2, '0')}-${slides[i].slug}.png`
    render(doc(s, lang, [SW, SH]), join(deckDir, name), SW, SH)
    console.log(`sunum/${lang}/${name}`)
  })
  if (!ONLY) pdf(doc(deckSections.join('\n'), lang, [SW, SH]), join(HERE, 'sunum', `QRNot-DPP-Sunum-${lang.toUpperCase()}.pdf`))
  console.log(`sunum PDF ${lang}`)

  // Sosyal medya (3 format)
  for (const fmt of SOCIAL_FORMATS) {
    const socDir = join(HERE, 'sosyal', lang, fmt.dir)
    mkdirSync(socDir, { recursive: true })
    t.social.forEach((p, i) => {
      const name = `${String(i + 1).padStart(2, '0')}.png`
      if (!want(String(i + 1).padStart(2, '0'))) return
      render(doc(socialPost(p, i, t, fmt), lang, [fmt.w, fmt.h]), join(socDir, name), fmt.w, fmt.h)
      console.log(`sosyal/${lang}/${fmt.dir}/${name}`)
    })
  }
}
console.log('Tamam.')
