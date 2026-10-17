// QRNot kurumsal kataloğunu üretir (Türkçe ve İngilizce ayrı):
//   node deliverables/kurumsal-katalog/build-kurumsal.mjs
// Çıktı:
//   deliverables/kurumsal-katalog/<tr|en>/NN-sayfa.png         (tam kalite sayfalar)
//   public/katalog/kurumsal/<tr|en>/NN-sayfa.webp             (sitedeki katalog bu dosyaları gösterir)
//   public/katalog/kurumsal/QRNot-Kurumsal-Katalog-<TR|EN>.pdf (satış görüşmeleri için tek dosya)
// İçerik, kodda gerçekten bulunan sektör modüllerine dayanır (src/lib/sectorPlatform.ts, hotel, education).

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
const sharp = (() => {
  try {
    return require('sharp')
  } catch {
    return null
  }
})()

const W = 1240
const H = 1754

const icon = (name, size = 28, color = 'currentColor', stroke = 1.8) =>
  lucide[name]
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .replace(/stroke="currentColor"/, `stroke="${color}"`)
    .replace(/stroke-width="2"/, `stroke-width="${stroke}"`)

const COMPANY = { site: 'qrnot.com', email: 'sce@scegrup.com', whatsapp: '+90 543 392 92 30', support: '0850 888 1 889' }

// ---------------------------------------------------------------------------------------------
// İçerik
// ---------------------------------------------------------------------------------------------
const SECTORS = [
  {
    id: 'otel',
    icon: 'ConciergeBell',
    color: '#ff4fa3',
    tr: {
      name: 'Otel',
      title: 'Odadan resepsiyona tek QR',
      lead: 'Misafir odadaki QR’ı okutur; oda servisi, temizlik, teknik destek ve concierge taleplerini resepsiyonu aramadan iletir. Ekibiniz talepleri canlı panelden takip eder.',
      places: ['Oda içi kart', 'Kapı arkası', 'Resepsiyon', 'Restoran masası'],
      modules: [
        ['UtensilsCrossed', 'Oda servisi siparişi', 'Menüden sipariş, odaya teslim'],
        ['Sparkles', 'Housekeeping talebi', 'Havlu, temizlik, ek ihtiyaç'],
        ['Wrench', 'Teknik destek', 'Arıza ve bakım bildirimi'],
        ['ConciergeBell', 'Concierge', 'Misafir talepleri tek kanalda'],
        ['Mic', 'Sesli not', 'Talebe ses kaydı ekleme'],
        ['LayoutDashboard', 'Canlı operasyon paneli', 'Talepleri durumuna göre yönetin'],
        ['QrCode', 'Toplu oda QR üretimi', 'Her oda için ayrı QR'],
        ['BarChart3', 'Operasyon analitiği', 'Son 24 saat talep ve sipariş özeti'],
      ],
      screen: { title: 'Oda 214', sub: 'Size nasıl yardımcı olabiliriz?', buttons: ['🍽️ Oda servisi', '🧺 Temizlik', '🔧 Teknik destek', '🛎️ Concierge'] },
    },
    en: {
      name: 'Hotels',
      title: 'From room to reception with one QR',
      lead: 'Guests scan the QR in their room to request room service, housekeeping, maintenance or concierge — without calling reception. Your team tracks every request on a live panel.',
      places: ['In-room card', 'Back of the door', 'Reception', 'Restaurant table'],
      modules: [
        ['UtensilsCrossed', 'Room service orders', 'Order from the menu, delivered to the room'],
        ['Sparkles', 'Housekeeping requests', 'Towels, cleaning, extra items'],
        ['Wrench', 'Maintenance', 'Fault and repair reports'],
        ['ConciergeBell', 'Concierge', 'Guest requests in one channel'],
        ['Mic', 'Voice notes', 'Attach a voice note to a request'],
        ['LayoutDashboard', 'Live operations panel', 'Manage requests by status'],
        ['QrCode', 'Bulk room QR codes', 'A dedicated QR for every room'],
        ['BarChart3', 'Operations analytics', 'Last-24-hour requests and orders'],
      ],
      screen: { title: 'Room 214', sub: 'How can we help you?', buttons: ['🍽️ Room service', '🧺 Housekeeping', '🔧 Maintenance', '🛎️ Concierge'] },
    },
  },
  {
    id: 'egitim',
    icon: 'GraduationCap',
    color: '#5fb8ff',
    tr: {
      name: 'Eğitim',
      title: 'Sınıf kapısında tek QR',
      lead: 'Öğrenci okutur; yoklamaya katılır, ders materyaline, ses ve video anlatımlara ulaşır, ödevini ve duyuruları görür. Öğretmen ve idare her şeyi panelden yönetir.',
      places: ['Sınıf kapısı', 'Ders kitabı', 'Pano', 'Laboratuvar'],
      modules: [
        ['UserCheck', 'QR ile yoklama', 'Derse katılım kaydı'],
        ['BookOpen', 'Ders materyali', 'Doküman, ses ve video anlatım'],
        ['ClipboardList', 'Ödev ve quiz', 'Görev ve kısa sınavlar'],
        ['Megaphone', 'Duyuru ve etkinlik', 'Sınıfa özel bilgilendirme'],
        ['LifeBuoy', 'Destek talebi', 'Öğrenci ve veli talepleri'],
        ['LayoutDashboard', 'Eğitim paneli', 'Sınıf ve modül yönetimi'],
      ],
      screen: { title: '10-B Fizik', sub: 'Optik · 3. hafta', buttons: ['✅ Yoklamaya katıl', '📘 Ders materyali', '📝 Ödev / quiz', '📣 Duyurular'] },
    },
    en: {
      name: 'Education',
      title: 'One QR on the classroom door',
      lead: 'Students scan to check in, open lesson materials and audio/video explanations, and see homework and announcements. Teachers and staff manage everything from one panel.',
      places: ['Classroom door', 'Textbook', 'Notice board', 'Laboratory'],
      modules: [
        ['UserCheck', 'QR attendance', 'Lesson check-in records'],
        ['BookOpen', 'Lesson materials', 'Documents, audio and video'],
        ['ClipboardList', 'Homework & quizzes', 'Tasks and short quizzes'],
        ['Megaphone', 'Announcements & events', 'Class-specific updates'],
        ['LifeBuoy', 'Support requests', 'Student and parent requests'],
        ['LayoutDashboard', 'Education panel', 'Class and module management'],
      ],
      screen: { title: 'Class 10-B Physics', sub: 'Optics · week 3', buttons: ['✅ Check in', '📘 Lesson materials', '📝 Homework / quiz', '📣 Announcements'] },
    },
  },
  {
    id: 'saglik',
    icon: 'Stethoscope',
    color: '#3fe0b0',
    tr: {
      name: 'Sağlık',
      title: 'Doğru bilgi, doğru yerde',
      lead: 'Hasta ve yakınları için bilgilendirme, yön tarifi ve ilaç / cihaz kullanım talimatı; personel için hijyen denetimi, vizit ve acil durum protokolleri — tek QR’dan.',
      places: ['Poliklinik kapısı', 'Hasta odası', 'Tıbbi cihaz', 'İlaç ambalajı'],
      modules: [
        ['FileText', 'Hasta bilgilendirme', 'Süreç ve hazırlık bilgisi'],
        ['MapPin', 'Klinik yönlendirme', 'Bölüm ve birim yön tarifi'],
        ['Pill', 'İlaç kullanım talimatı', 'Doz ve kullanım anlatımı'],
        ['HeartPulse', 'Cihaz kullanım talimatı', 'Video ve adım adım anlatım'],
        ['CalendarCheck', 'Randevu ve taburculuk', 'Hatırlatma ve süreç bilgisi'],
        ['ClipboardCheck', 'Hijyen denetimi', 'Kontrol listesi kaydı'],
        ['Siren', 'Acil durum protokolü', 'Personel için hızlı erişim'],
        ['BadgeCheck', 'Vizit ve personel doğrulama', 'Kayıt altına alınan adımlar'],
      ],
      screen: { title: 'Kardiyoloji Polikliniği', sub: 'Hoş geldiniz', buttons: ['📄 Hasta bilgilendirme', '🧭 Yön tarifi', '💊 İlaç kullanımı', '🩺 Cihaz talimatı'] },
    },
    en: {
      name: 'Healthcare',
      title: 'The right information in the right place',
      lead: 'Patient information, wayfinding and medication / device instructions for patients and families; hygiene audits, ward rounds and emergency protocols for staff — all from one QR.',
      places: ['Clinic door', 'Patient room', 'Medical device', 'Medication pack'],
      modules: [
        ['FileText', 'Patient information', 'Process and preparation info'],
        ['MapPin', 'Clinic wayfinding', 'Directions to departments'],
        ['Pill', 'Medication instructions', 'Dosage and usage guidance'],
        ['HeartPulse', 'Device instructions', 'Video and step-by-step guides'],
        ['CalendarCheck', 'Appointments & discharge', 'Reminders and process info'],
        ['ClipboardCheck', 'Hygiene audits', 'Checklist records'],
        ['Siren', 'Emergency protocols', 'Quick access for staff'],
        ['BadgeCheck', 'Ward rounds & staff check', 'Recorded steps'],
      ],
      screen: { title: 'Cardiology Clinic', sub: 'Welcome', buttons: ['📄 Patient information', '🧭 Directions', '💊 Medication', '🩺 Device guide'] },
    },
  },
  {
    id: 'fabrika',
    icon: 'Factory',
    color: '#ffb547',
    tr: {
      name: 'Fabrika & üretim',
      title: 'Kılavuz makinenin üzerinde',
      lead: 'Makineye ya da ürettiğiniz ürüne bir QR: kullanım kılavuzu ve montaj videosu, iş güvenliği akışı, bakım ve arıza bildirimi, operatör eğitimi ve kalite kontrol kayıtları tek okutmada.',
      places: ['Makine gövdesi', 'Üretim hattı', 'Ürün / ambalaj', 'Depo rafı'],
      modules: [
        ['BookOpen', 'Kullanım kılavuzu', 'Video, görsel ya da PDF bağlantısı'],
        ['ShieldCheck', 'İş güvenliği akışı', 'Makine güvenliği adımları'],
        ['Wrench', 'Bakım talebi', 'Periyodik ve arıza bakımı'],
        ['TriangleAlert', 'Hata / arıza bildirimi', 'Fotoğraflı kayıt'],
        ['GraduationCap', 'Operatör eğitimi', 'Video ile standart eğitim'],
        ['ListChecks', 'Kalite kontrol', 'Kontrol listesi kaydı'],
        ['Boxes', 'Bant ürün sayımı', 'Hat bazlı sayım kaydı'],
        ['PackageCheck', 'Hammadde kabul', 'Giriş kontrol kaydı'],
      ],
      screen: { title: 'CNC-04', sub: 'Hat 2 · Torna', buttons: ['🎬 Kullanım kılavuzu', '🛠️ Bakım talebi', '⚠️ Arıza bildir', '🦺 İş güvenliği'] },
    },
    en: {
      name: 'Manufacturing',
      title: 'The manual lives on the machine',
      lead: 'One QR on a machine or on the product you make: user manuals and assembly videos, safety flows, maintenance and fault reports, operator training and quality-check records — one scan away.',
      places: ['Machine body', 'Production line', 'Product / packaging', 'Warehouse rack'],
      modules: [
        ['BookOpen', 'User manuals', 'Video, images or a PDF link'],
        ['ShieldCheck', 'Safety flow', 'Machine safety steps'],
        ['Wrench', 'Maintenance requests', 'Scheduled and breakdown'],
        ['TriangleAlert', 'Defect / fault reports', 'Records with photos'],
        ['GraduationCap', 'Operator training', 'Standard video training'],
        ['ListChecks', 'Quality checks', 'Checklist records'],
        ['Boxes', 'Conveyor counts', 'Line-based count records'],
        ['PackageCheck', 'Raw material intake', 'Incoming inspection records'],
      ],
      screen: { title: 'CNC-04', sub: 'Line 2 · Lathe', buttons: ['🎬 User manual', '🛠️ Maintenance', '⚠️ Report a fault', '🦺 Safety'] },
    },
  },
  {
    id: 'perakende',
    icon: 'ShoppingBag',
    color: '#c86bff',
    tr: {
      name: 'Perakende',
      title: 'Raf etiketi konuşsun',
      lead: 'Raftaki QR ürünü anlatır: tanıtım videosu, içerik ve menşe bilgisi. Mağaza ekibi için fiyat ve kampanya kontrolü, görev listeleri ve müşteri anketi aynı altyapıda.',
      places: ['Raf etiketi', 'Ürün ambalajı', 'Kasa', 'Vitrin'],
      modules: [
        ['Film', 'Ürün hikâyesi', 'Video, içerik, menşe'],
        ['Tag', 'Fiyat kontrolü', 'Raf ve kasa fiyatı karşılaştırma'],
        ['Megaphone', 'Kampanya kontrolü', 'Kampanya uygulama kaydı'],
        ['ListChecks', 'Mağaza kontrol listesi', 'Açılış / kapanış kontrolleri'],
        ['Users', 'Personel görev listesi', 'Vardiya görevleri'],
        ['MessageSquareText', 'Müşteri anketi', 'Deneyim geri bildirimi'],
      ],
      screen: { title: 'Soğuk Sıkım Zeytinyağı', sub: '1 L · Ayvalık', buttons: ['🎬 Ürün hikâyesi', '🌿 İçerik ve menşe', '🏷️ Kampanya', '⭐ Görüşünü paylaş'] },
    },
    en: {
      name: 'Retail',
      title: 'Let the shelf tag talk',
      lead: 'The shelf QR tells the product story: intro video, ingredients and origin. Price and campaign checks, staff task lists and customer surveys run on the same platform.',
      places: ['Shelf tag', 'Product packaging', 'Checkout', 'Shop window'],
      modules: [
        ['Film', 'Product story', 'Video, ingredients, origin'],
        ['Tag', 'Price checks', 'Shelf vs checkout price'],
        ['Megaphone', 'Campaign checks', 'Campaign execution records'],
        ['ListChecks', 'Store checklist', 'Opening / closing checks'],
        ['Users', 'Staff task list', 'Shift tasks'],
        ['MessageSquareText', 'Customer survey', 'Experience feedback'],
      ],
      screen: { title: 'Cold-Pressed Olive Oil', sub: '1 L · Ayvalık', buttons: ['🎬 Product story', '🌿 Ingredients & origin', '🏷️ Campaign', '⭐ Share feedback'] },
    },
  },
  {
    id: 'lojistik',
    icon: 'Truck',
    color: '#4fd8ff',
    tr: {
      name: 'Lojistik',
      title: 'Her adım kayıt altında',
      lead: 'Kolide, araçta ve depoda QR: teslimat kanıtı, hasar bildirimi, araç kontrolü, rota devri, soğuk zincir kaydı ve gümrük evrakı tek okutmayla kayda geçer.',
      places: ['Koli etiketi', 'Araç', 'Depo rafı', 'Rampa'],
      modules: [
        ['Camera', 'Teslimat kanıtı', 'Fotoğraflı teslim kaydı'],
        ['TriangleAlert', 'Hasar bildirimi', 'Fotoğraf ve açıklama'],
        ['ClipboardCheck', 'Araç kontrolü', 'Sefer öncesi kontrol listesi'],
        ['Route', 'Rota devri ve denetimi', 'Sürücü değişimi kaydı'],
        ['Snowflake', 'Soğuk zincir kaydı', 'Sıcaklık kontrol girişi'],
        ['FileCheck', 'Gümrük evrakı', 'Belgelere hızlı erişim'],
        ['Warehouse', 'Depo girişi', 'Kabul ve yükleme kontrolü'],
        ['Boxes', 'Stok sayımı', 'Raf bazlı sayım kaydı'],
      ],
      screen: { title: 'Sevkiyat #48213', sub: 'Ankara → İzmir', buttons: ['📸 Teslimat kanıtı', '⚠️ Hasar bildir', '❄️ Sıcaklık kaydı', '📄 Evraklar'] },
    },
    en: {
      name: 'Logistics',
      title: 'Every step on record',
      lead: 'QR codes on parcels, vehicles and racks: proof of delivery, damage reports, vehicle checks, route handoffs, cold-chain entries and customs documents are recorded with one scan.',
      places: ['Parcel label', 'Vehicle', 'Warehouse rack', 'Loading dock'],
      modules: [
        ['Camera', 'Proof of delivery', 'Delivery records with photos'],
        ['TriangleAlert', 'Damage reports', 'Photo and description'],
        ['ClipboardCheck', 'Vehicle checks', 'Pre-trip checklist'],
        ['Route', 'Route handoff & audit', 'Driver change records'],
        ['Snowflake', 'Cold-chain entries', 'Temperature check input'],
        ['FileCheck', 'Customs documents', 'Quick access to documents'],
        ['Warehouse', 'Warehouse intake', 'Receiving and loading checks'],
        ['Boxes', 'Stock counts', 'Rack-based count records'],
      ],
      screen: { title: 'Shipment #48213', sub: 'Ankara → Izmir', buttons: ['📸 Proof of delivery', '⚠️ Report damage', '❄️ Temperature entry', '📄 Documents'] },
    },
  },
]

const COPY = {
  tr: {
    lang: 'tr',
    catalog: 'Kurumsal Katalog',
    year: '2026',
    coverKicker: 'İşletmeler için QR çözümleri',
    coverTitle: ['Fiziksel dünyayı', 'tek QR ile', 'dijitale bağlayın.'],
    coverLead: 'Otel, eğitim, sağlık, fabrika, perakende ve lojistik için sektöre özel paneller. QR’ları toplu üretin, içeriği tek yerden yönetin, talepleri ve kayıtları canlı izleyin.',
    coverPills: ['Uygulama gerekmez', 'Sektöre özel panel', 'Toplu üretim', 'NFC seçeneği'],
    platformKicker: 'Platform',
    platformTitle: 'Nasıl çalışır?',
    steps: [
      ['QrCode', 'Üret', 'Panelden QR’larınızı toplu üretin; logo ve marka renklerinizle basın.'],
      ['MapPin', 'Yerleştir', 'Odaya, makineye, rafa ya da koliye yerleştirin. İsterseniz NFC etiket.'],
      ['ScanLine', 'Okutulsun', 'Misafir, öğrenci ya da personel telefon kamerasıyla açar — uygulama yok.'],
      ['LayoutDashboard', 'Panelden yönetin', 'Talepler ve kayıtlar panele düşer; içeriği tek yerden güncellersiniz.'],
    ],
    featuresTitle: 'Tüm sektörlerde ortak',
    features: [
      ['LayoutDashboard', 'Sektöre özel panel', 'Kurum, birim ve modül yönetimi'],
      ['Printer', 'Toplu QR üretimi', 'Logo ve marka renginizle baskıya hazır'],
      ['RefreshCw', 'İçerik tek yerden', 'QR değişmeden içeriği güncelleyin'],
      ['Mic', '10 dakikaya kadar kayıt', 'Kurumsal QR’larda ses ve video'],
      ['Nfc', 'NFC etiket seçeneği', 'Dokun-aç, QR yedekli'],
      ['Smartphone', 'Uygulama gerekmez', 'iPhone ve Android tarayıcıda açılır'],
      ['Users', 'Rol bazlı erişim', 'Yönetici ve personel ayrımı'],
      ['ShieldCheck', 'Güvenli altyapı', 'Şifreli bağlantı, deneme kilidi'],
    ],
    placesTitle: 'Nerede kullanılır?',
    modulesTitle: 'Modüller',
    scanLabel: 'Okutunca',
    flowTitle: 'Akış',
    flow: [['ScanLine', 'Okut'], ['MousePointerClick', 'Seç'], ['Send', 'Gönder'], ['LayoutDashboard', 'Panelde takip']],
    toastTitle: 'Kaydınız alındı',
    toastSub: 'Ekibiniz panelde anında görür',
    coverValues: [
      ['Smartphone', 'Uygulama yok', 'Telefon kamerasıyla açılır'],
      ['RefreshCw', 'QR hiç değişmez', 'İçerik panelden güncellenir'],
      ['Nfc', 'QR + NFC', 'İsterseniz dokun-aç etiket'],
    ],
    faqTitle: 'Sık sorulanlar',
    faq: [
      ['Uygulama indirmek gerekiyor mu?', 'Hayır. QR telefonun kamerasıyla, tarayıcıda açılır.'],
      ['QR basıldıktan sonra içerik değişebilir mi?', 'Evet. QR aynı kalır, içeriği panelden güncellersiniz.'],
      ['NFC zorunlu mu?', 'Hayır. NFC etiket isteğe bağlıdır; QR her telefonda çalışır.'],
      ['Logomuzla basılabilir mi?', 'Evet. Toplu üretimde logo ve marka renkleriniz kullanılır.'],
    ],
    startKicker: 'Başlarken',
    startTitle: 'Kurulumdan kullanıma',
    startSteps: [
      ['MessagesSquare', 'İhtiyaç görüşmesi', 'Hangi noktalarda, hangi modüllerle başlayacağınızı birlikte belirleriz.'],
      ['FlaskConical', 'Pilot', 'Bir birim ya da hatta küçük bir deneme ile başlarız.'],
      ['Printer', 'Toplu üretim', 'QR / NFC etiketler logonuzla hazırlanır.'],
      ['GraduationCap', 'Ekip eğitimi', 'Panel kullanımı için ekibinize kısa eğitim.'],
    ],
    contactTitle: 'Teklif ve bilgi için',
    contactLines: [
      ['Globe', 'qrnot.com/#kurumsal'],
      ['Mail', COMPANY.email],
      ['MessageCircle', `WhatsApp ${COMPANY.whatsapp}`],
    ],
    supportLine: `Mevcut müşteriler için destek hattı: ${COMPANY.support}`,
    footerNote: 'Görseller temsilidir. Modül kapsamı kurum ihtiyacına göre yapılandırılır.',
    page: 'Sayfa',
  },
  en: {
    lang: 'en',
    catalog: 'Business Catalog',
    year: '2026',
    coverKicker: 'QR solutions for businesses',
    coverTitle: ['Connect the', 'physical world to', 'digital — with one QR.'],
    coverLead: 'Dedicated panels for hotels, education, healthcare, manufacturing, retail and logistics. Produce QR codes in bulk, manage content in one place and follow requests and records live.',
    coverPills: ['No app needed', 'Industry-specific panels', 'Bulk production', 'NFC option'],
    platformKicker: 'Platform',
    platformTitle: 'How it works',
    steps: [
      ['QrCode', 'Produce', 'Create QR codes in bulk and print them with your logo and colours.'],
      ['MapPin', 'Place', 'On rooms, machines, shelves or parcels. NFC tags available.'],
      ['ScanLine', 'Scan', 'Guests, students or staff open it with their phone camera — no app.'],
      ['LayoutDashboard', 'Manage', 'Requests and records land on your panel; update content in one place.'],
    ],
    featuresTitle: 'Included in every industry',
    features: [
      ['LayoutDashboard', 'Industry-specific panel', 'Organisation, unit and module management'],
      ['Printer', 'Bulk QR production', 'Print-ready with your logo and colours'],
      ['RefreshCw', 'Content in one place', 'Update content, the QR stays the same'],
      ['Mic', 'Up to 10-minute recordings', 'Voice and video on business QR codes'],
      ['Nfc', 'NFC tag option', 'Tap to open, with QR backup'],
      ['Smartphone', 'No app needed', 'Opens in the iPhone and Android browser'],
      ['Users', 'Role-based access', 'Admin and staff roles'],
      ['ShieldCheck', 'Secure platform', 'Encrypted connection, login lockout'],
    ],
    placesTitle: 'Where it is used',
    modulesTitle: 'Modules',
    scanLabel: 'On scan',
    flowTitle: 'Flow',
    flow: [['ScanLine', 'Scan'], ['MousePointerClick', 'Choose'], ['Send', 'Send'], ['LayoutDashboard', 'Track on panel']],
    toastTitle: 'Request received',
    toastSub: 'Your team sees it on the panel instantly',
    coverValues: [
      ['Smartphone', 'No app', 'Opens with the phone camera'],
      ['RefreshCw', 'The QR never changes', 'Update content from the panel'],
      ['Nfc', 'QR + NFC', 'Optional tap-to-open tags'],
    ],
    faqTitle: 'FAQ',
    faq: [
      ['Do people need to install an app?', 'No. The QR opens in the phone browser via the camera.'],
      ['Can content change after printing?', 'Yes. The QR stays the same; you update content from the panel.'],
      ['Is NFC required?', 'No. NFC tags are optional; the QR works on every phone.'],
      ['Can it carry our logo?', 'Yes. Bulk production uses your logo and brand colours.'],
    ],
    startKicker: 'Getting started',
    startTitle: 'From setup to daily use',
    startSteps: [
      ['MessagesSquare', 'Discovery call', 'We decide together where to start and which modules to use.'],
      ['FlaskConical', 'Pilot', 'We start small with one unit or line.'],
      ['Printer', 'Bulk production', 'QR / NFC tags are prepared with your logo.'],
      ['GraduationCap', 'Team training', 'A short training for your team on the panel.'],
    ],
    contactTitle: 'Quotes and information',
    contactLines: [
      ['Globe', 'qrnot.com/#kurumsal'],
      ['Mail', COMPANY.email],
      ['MessageCircle', `WhatsApp ${COMPANY.whatsapp}`],
    ],
    supportLine: `Support line for existing customers (Turkey): ${COMPANY.support}`,
    footerNote: 'Images are illustrative. Module scope is configured to each organisation’s needs.',
    page: 'Page',
  },
}

// ---------------------------------------------------------------------------------------------
// Tasarım
// ---------------------------------------------------------------------------------------------
const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: ${W}px ${H}px; margin: 0; }
  html, body { background: #05050c; }
  body { font-family: Inter, 'Segoe UI', sans-serif; color: #eef0f8; -webkit-font-smoothing: antialiased; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; padding: 88px 88px 120px; background: #06060f; page-break-after: always; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: auto; }
  .bg { position: absolute; inset: 0; pointer-events: none; }
  .glow { position: absolute; border-radius: 50%; filter: blur(110px); }
  .grid-lines { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size: 62px 62px; mask-image: radial-gradient(circle at 50% 30%, black, transparent 75%); }
  .rel { position: relative; }
  h1, h2, h3, .head { font-family: Montserrat, 'Segoe UI', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
  .kicker { font-family: Montserrat, sans-serif; font-weight: 700; letter-spacing: .24em; text-transform: uppercase; font-size: 18px; }
  .grad { background: linear-gradient(90deg, #ff4fa3, #b06bff 45%, #4fb8ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .muted { color: rgba(238,240,248,.68); }
  .glass { background: linear-gradient(160deg, rgba(255,255,255,.075), rgba(255,255,255,.025)); border: 1.5px solid rgba(255,255,255,.12); border-radius: 26px; backdrop-filter: blur(6px); }
  .neon-ring { border-radius: 50%; display: grid; place-items: center; }
  .pill { display: inline-flex; align-items: center; gap: 10px; padding: 12px 22px; border-radius: 999px; border: 1.5px solid rgba(255,255,255,.18); font-weight: 600; font-size: 19px; background: rgba(255,255,255,.04); }
  .brand { display: flex; align-items: center; gap: 16px; }
  .logo { width: 58px; height: 58px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(135deg, #ff4fa3, #6b5bff); box-shadow: 0 0 34px rgba(255,79,163,.45); }
  .footer { position: absolute; left: 88px; right: 88px; bottom: 46px; display: flex; justify-content: space-between; align-items: center; font-size: 16px; color: rgba(238,240,248,.5); border-top: 1px solid rgba(255,255,255,.1); padding-top: 18px; }
  .phone { width: 330px; aspect-ratio: 9/19; border-radius: 52px; padding: 13px; background: linear-gradient(160deg, #2a2b3a, #0c0c14); box-shadow: 0 40px 90px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,255,255,.08); }
  .screen { height: 100%; border-radius: 40px; background: linear-gradient(180deg, #121428, #0a0b17); padding: 54px 22px 22px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
  .sbtn { border-radius: 16px; padding: 16px 18px; font-size: 18px; font-weight: 600; background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.1); }
`

function page(body, n, total, t, accent = '#ff4fa3', accent2 = '#4f8bff') {
  return `<section class="page">
    <div class="bg">
      <div class="grid-lines"></div>
      <div class="glow" style="width:780px;height:780px;left:-260px;top:-240px;background:${accent};opacity:.22"></div>
      <div class="glow" style="width:820px;height:820px;right:-300px;bottom:-260px;background:${accent2};opacity:.2"></div>
    </div>
    <div class="rel" style="display:flex;flex-direction:column;flex:1">${body}</div>
    <div class="footer"><span>QRNot · ${t.catalog} ${t.year}</span><span>${COMPANY.site} · ${t.page} ${n} / ${total}</span></div>
  </section>`
}

const brand = (t) => `<div class="brand"><div class="logo">${icon('QrCode', 30, '#fff', 2)}</div>
  <div><div class="head" style="font-size:34px;line-height:1">QR<span class="grad">Not</span></div><div class="muted" style="font-size:16px;margin-top:6px;letter-spacing:.08em">${t.catalog.toUpperCase()}</div></div></div>`

const ring = (name, color, size = 84) =>
  `<div class="neon-ring" style="width:${size}px;height:${size}px;border:2px solid ${color};box-shadow:0 0 22px ${color}66, inset 0 0 16px ${color}33">${icon(name, size * 0.44, color, 1.8)}</div>`

function cover(t) {
  return `
    ${brand(t)}
    <div style="margin-top:120px">
      <div class="kicker" style="color:#ff7cc0">${t.coverKicker}</div>
      <h1 style="font-size:92px;line-height:1.02;margin-top:26px">${t.coverTitle[0]}<br>${t.coverTitle[1]}<br><span class="grad">${t.coverTitle[2]}</span></h1>
      <p class="muted" style="font-size:26px;line-height:1.5;margin-top:34px;max-width:900px">${t.coverLead}</p>
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:38px">${t.coverPills.map((p) => `<span class="pill">${p}</span>`).join('')}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:70px">
      ${t.coverValues
        .map(
          ([ic, title, desc], i) =>
            `<div class="glass" style="padding:30px 28px;box-shadow:0 0 40px ${['#ff4fa3', '#b06bff', '#4fb8ff'][i]}22">${ring(ic, ['#ff4fa3', '#b06bff', '#4fb8ff'][i], 70)}<div class="head" style="font-size:28px;margin-top:22px">${title}</div><div class="muted" style="font-size:19px;margin-top:8px">${desc}</div></div>`
        )
        .join('')}
    </div>
    <div style="margin-top:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-bottom:30px">
      ${SECTORS.map((s) => `<div class="glass" style="padding:28px;display:flex;align-items:center;gap:20px">${ring(s.icon, s.color, 74)}<div class="head" style="font-size:26px">${s[t.lang].name}</div></div>`).join('')}
    </div>`
}

function platform(t) {
  return `
    ${brand(t)}
    <div style="margin-top:70px">
      <div class="kicker" style="color:#7cc4ff">${t.platformKicker}</div>
      <h2 style="font-size:70px;margin-top:18px">${t.platformTitle}</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:44px">
      ${t.steps
        .map(
          ([ic, title, desc], i) => `<div class="glass" style="padding:30px 26px">
            <div style="display:flex;justify-content:space-between;align-items:center">${ring(ic, ['#ff4fa3', '#b06bff', '#4fb8ff', '#3fe0b0'][i], 70)}<span class="head grad" style="font-size:48px">0${i + 1}</span></div>
            <div class="head" style="font-size:27px;margin-top:22px">${title}</div>
            <p class="muted" style="font-size:18px;line-height:1.5;margin-top:10px">${desc}</p></div>`
        )
        .join('')}
    </div>
    <h3 style="font-size:40px;margin-top:70px">${t.featuresTitle}</h3>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:28px">
      ${t.features
        .map(
          ([ic, title, desc], i) => `<div class="glass" style="padding:34px 28px;display:flex;gap:22px;align-items:center">${ring(ic, ['#ff4fa3', '#4fb8ff', '#b06bff', '#3fe0b0'][i % 4], 72)}
            <div><div style="font-size:24px;font-weight:700">${title}</div><div class="muted" style="font-size:19px;margin-top:6px">${desc}</div></div></div>`
        )
        .join('')}
    </div>`
}

function sectorPage(s, t) {
  const c = s[t.lang]
  const modules = c.modules
  return `
    <div style="display:flex;justify-content:space-between;align-items:center">${brand(t)}<span class="pill" style="border-color:${s.color}66;color:${s.color}">${c.name}</span></div>
    <div style="display:grid;grid-template-columns:1fr 330px;gap:56px;margin-top:64px;align-items:start">
      <div>
        <div style="display:flex;align-items:center;gap:22px">${ring(s.icon, s.color, 96)}<div class="kicker" style="color:${s.color}">${c.name}</div></div>
        <h2 style="font-size:64px;line-height:1.05;margin-top:30px">${c.title}</h2>
        <p class="muted" style="font-size:23px;line-height:1.55;margin-top:24px">${c.lead}</p>
        <div style="margin-top:34px">
          <div style="font-size:18px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(238,240,248,.55)">${t.placesTitle}</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:16px">${c.places.map((p) => `<span class="pill" style="font-size:18px;padding:10px 18px">${icon('MapPin', 18, s.color, 2)} ${p}</span>`).join('')}</div>
        </div>
        <div style="margin-top:40px">
          <div style="font-size:18px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(238,240,248,.55)">${t.flowTitle}</div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:18px">${t.flow.map(([ic, label], i) => `<div class="glass" style="flex:1;padding:20px 12px;text-align:center;border-color:${s.color}40"><div style="display:flex;justify-content:center">${icon(ic, 34, s.color, 1.9)}</div><div style="font-size:18px;font-weight:700;margin-top:10px">${label}</div></div>${i < t.flow.length - 1 ? `<div>${icon('ChevronRight', 26, s.color, 2.4)}</div>` : ''}`).join('')}</div>
        </div>
      </div>
      <div>
        <div style="text-align:center;font-size:16px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${s.color};margin-bottom:14px">${t.scanLabel}</div>
        <div class="phone" style="box-shadow:0 40px 90px rgba(0,0,0,.6), 0 0 60px ${s.color}33, 0 0 0 1.5px rgba(255,255,255,.08)"><div class="screen">
          <div style="font-size:14px;font-weight:700;letter-spacing:.18em;color:${s.color}">QRNOT</div>
          <div class="head" style="font-size:26px;line-height:1.15">${c.screen.title}</div>
          <div class="muted" style="font-size:16px;margin-top:-6px">${c.screen.sub}</div>
          ${c.screen.buttons.map((b, i) => `<div class="sbtn" style="${i === 0 ? `background:${s.color};color:#0a0b17;border-color:${s.color}` : ''}">${b}</div>`).join('')}
          <div style="margin-top:auto;border-radius:18px;padding:18px;background:rgba(63,224,176,.12);border:1.5px solid rgba(63,224,176,.45);display:flex;gap:12px;align-items:center">${icon('CircleCheck', 30, '#3fe0b0', 2)}<div><div style="font-size:17px;font-weight:700">${t.toastTitle}</div><div class="muted" style="font-size:14px;margin-top:2px">${t.toastSub}</div></div></div>
        </div></div>
      </div>
    </div>
    <div style="margin-top:auto;margin-bottom:24px">
      <div style="font-size:18px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(238,240,248,.55)">${t.modulesTitle}</div>
      <div style="display:grid;grid-template-columns:repeat(${modules.length > 6 ? 4 : 3},1fr);gap:16px;margin-top:18px">
        ${modules
          .map(
            ([ic, title, desc]) => `<div class="glass" style="padding:22px 20px;border-color:${s.color}33">
              <div style="color:${s.color}">${icon(ic, 32, s.color, 1.9)}</div>
              <div style="font-size:20px;font-weight:700;margin-top:14px;line-height:1.25">${title}</div>
              <div class="muted" style="font-size:16px;margin-top:6px;line-height:1.4">${desc}</div></div>`
          )
          .join('')}
      </div>
    </div>`
}

function startPage(t) {
  return `
    ${brand(t)}
    <div style="margin-top:80px">
      <div class="kicker" style="color:#3fe0b0">${t.startKicker}</div>
      <h2 style="font-size:70px;margin-top:18px">${t.startTitle}</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px;margin-top:50px">
      ${t.startSteps
        .map(
          ([ic, title, desc], i) => `<div class="glass" style="padding:24px 34px;display:flex;align-items:center;gap:30px">
            <span class="head grad" style="font-size:56px;width:90px">0${i + 1}</span>${ring(ic, ['#ff4fa3', '#b06bff', '#4fb8ff', '#3fe0b0'][i], 76)}
            <div><div class="head" style="font-size:30px">${title}</div><div class="muted" style="font-size:21px;margin-top:8px;line-height:1.45">${desc}</div></div></div>`
        )
        .join('')}
    </div>
    <h3 style="font-size:36px;margin-top:56px">${t.faqTitle}</h3>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:22px">${t.faq.map(([q, a]) => `<div class="glass" style="padding:24px 26px"><div style="font-size:20px;font-weight:700">${q}</div><div class="muted" style="font-size:18px;margin-top:8px;line-height:1.45">${a}</div></div>`).join('')}</div>
    <div class="glass" style="margin-top:auto;margin-bottom:24px;padding:44px;border-color:rgba(255,79,163,.4);box-shadow:0 0 70px rgba(255,79,163,.18)">
      <h3 style="font-size:44px">${t.contactTitle}</h3>
      <div style="display:flex;flex-wrap:wrap;gap:18px 40px;margin-top:28px">
        ${t.contactLines.map(([ic, text]) => `<div style="display:flex;align-items:center;gap:14px;font-size:22px;font-weight:600;white-space:nowrap">${icon(ic, 30, '#ff7cc0', 2)}<span>${text}</span></div>`).join('')}
      </div>
      <p class="muted" style="font-size:18px;margin-top:26px">${t.supportLine}</p>
      <p style="font-size:15px;margin-top:18px;color:rgba(238,240,248,.42)">${t.footerNote}</p>
    </div>`
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
const doc = (sections, lang) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body>${sections}</body></html>`

const SLUGS = ['kapak', 'platform', ...SECTORS.map((s) => s.id), 'baslarken']
const tmp = join(tmpdir(), 'qrnot-kurumsal-html')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })

for (const lang of ['tr', 'en']) {
  const t = COPY[lang]
  const bodies = [cover(t), platform(t), ...SECTORS.map((s) => sectorPage(s, t)), startPage(t)]
  const total = bodies.length
  const accents = [
    ['#ff4fa3', '#4f8bff'],
    ['#b06bff', '#4fb8ff'],
    ...SECTORS.map((s) => [s.color, '#4f6bff']),
    ['#3fe0b0', '#ff4fa3'],
  ]
  const sections = bodies.map((b, i) => page(b, i + 1, total, t, accents[i][0], accents[i][1]))

  const pngDir = join(HERE, lang)
  const webDir = join(ROOT, 'public', 'katalog', 'kurumsal', lang)
  mkdirSync(pngDir, { recursive: true })
  mkdirSync(webDir, { recursive: true })

  sections.forEach((section, i) => {
    const name = `${String(i + 1).padStart(2, '0')}-${SLUGS[i]}`
    const html = join(tmp, `${lang}-${name}.html`)
    writeFileSync(html, doc(section, lang))
    const png = join(pngDir, `${name}.png`)
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W},${H}`, '--virtual-time-budget=10000', `--screenshot=${png}`, pathToFileURL(html).href], { stdio: 'ignore' })
    console.log(`${lang}/${name}.png`)
  })

  const pdfHtml = join(tmp, `${lang}-all.html`)
  writeFileSync(pdfHtml, doc(sections.join('\n'), lang))
  const pdf = join(ROOT, 'public', 'katalog', 'kurumsal', `QRNot-Kurumsal-Katalog-${lang.toUpperCase()}.pdf`)
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=12000', `--print-to-pdf=${pdf}`, pathToFileURL(pdfHtml).href], { stdio: 'ignore' })
  console.log(`PDF: ${pdf}`)
}
console.log('WebP dönüşümü için: python deliverables/kurumsal-katalog/to_webp.py')
