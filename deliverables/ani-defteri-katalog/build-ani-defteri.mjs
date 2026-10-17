// QRNot Dijital Anı Defteri kataloğunu üretir (Türkçe ve İngilizce ayrı):
//   node deliverables/ani-defteri-katalog/build-ani-defteri.mjs && python deliverables/ani-defteri-katalog/to_webp.py
// Çıktı:
//   deliverables/ani-defteri-katalog/<tr|en>/NN-sayfa.png
//   public/katalog/ani-defteri/<tr|en>/NN-sayfa.webp
//   public/katalog/ani-defteri/QRNot-Ani-Defteri-Katalog-<TR|EN>.pdf
// İçerik, anı defterinin gerçek özelliklerine dayanır (src/lib/guestbook.ts, guestbook API ve masa kartları).

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
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { QRCodeSVG } = require('qrcode.react')

const W = 1240
const H = 1754
const GOLD = '#f3c66b'
const PINK = '#ff5fa8'
const ROSE = '#ff8fb8'
const BLUE = '#6fb8ff'
const MINT = '#5fe0b8'

const icon = (name, size = 28, color = 'currentColor', stroke = 1.8) =>
  lucide[name].replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`).replace(/stroke="currentColor"/, `stroke="${color}"`).replace(/stroke-width="2"/, `stroke-width="${stroke}"`)
const qr = (url, fg = '#1a1426') =>
  renderToStaticMarkup(React.createElement(QRCodeSVG, { value: url, size: 512, level: 'M', marginSize: 0, fgColor: fg, bgColor: 'transparent' }))
const DEMO = 'https://qrnot.com/guestbook?utm_source=catalog&utm_medium=guestbook_catalog'

// ---------------------------------------------------------------------------------------------
const COPY = {
  tr: {
    lang: 'tr',
    catalog: 'Anı Defteri Kataloğu',
    product: 'Dijital Anı Defteri',
    page: 'Sayfa',
    coverKicker: 'Düğün · Nişan · Kına · Her kutlama',
    coverTitle: ['İmza değil,', 'ses toplayın.'],
    coverLead: 'Masalara koyacağınız tek bir QR kart ile misafirleriniz kendi telefonlarından sesli mesaj, video, fotoğraf ya da yazılı anı bırakır. Siz onaylar, saklar ve yıllar sonra da dinlersiniz.',
    coverPills: ['Uygulama gerekmez', 'Kiralık telefon yok', '300 anıya kadar', 'Onay ve PIN koruması'],
    names: 'Ayşe & Mehmet',
    cardKicker: 'BİZE BİR ANI BIRAKIN',
    cardScan: 'Telefon kameranla okut',
    cardTypes: '🎙️ ses · 🎬 video · 📷 fotoğraf · ✍️ not',
    howKicker: 'Nasıl çalışır?',
    howTitle: '4 adımda anı defteri',
    steps: [
      ['Settings2', 'Kurun', 'Hesabınızla giriş yapın; etkinlik adını ve karşılama mesajını yazın, onay ve PIN ayarlarını seçin.'],
      ['Printer', 'Kartları basın', 'İsimlerinizle hazırlanan masa kartlarını yazdırın, her masaya bir kart koyun.'],
      ['Smartphone', 'Misafirler anı bıraksın', 'Misafirler QR’ı okutur; ses, video, fotoğraf ya da yazılı not bırakır.'],
      ['Archive', 'Onaylayın, saklayın', 'Gelen her anıyı onaylar, dilediğiniz zaman dinler ve indirirsiniz.'],
    ],
    howNote: 'Etkinlikten birkaç gün önce kurun ve kendi telefonunuzla deneyin.',
    guestKicker: 'Misafir deneyimi',
    guestTitle: 'Okut, kaydet, gönder.',
    guestLead: 'Misafirin uygulama indirmesine gerek yok. QR telefonun tarayıcısında açılır; herkes kendi telefonundan, sıra beklemeden, aynı anda kaydeder.',
    guestFeatures: [
      ['Mic', 'Sesli mesaj', '2 dakikaya kadar kayıt'],
      ['Video', 'Video', '2 dakikaya kadar video'],
      ['Image', 'Fotoğraf', 'Galeriden ya da kameradan'],
      ['PenLine', 'Yazılı not', 'Uzun bir mesaj bile olur'],
      ['Users', 'Herkes aynı anda', 'Sıra yok, kiralık cihaz yok'],
      ['UserCheck', 'Her misafir bir kez', 'Tekrar ve spam önlenir'],
    ],
    screenWelcome: 'Bize bir anı bırakın 💛',
    screenName: 'Adın',
    screenTypes: ['🎙️ Ses', '🎬 Video', '🖼️ Fotoğraf', '✍️ Not'],
    screenSend: 'Anıyı gönder',
    hostKicker: 'Ev sahibi paneli',
    hostTitle: 'Tüm anılar sizin kontrolünüzde',
    hostLead: 'Anılar siz onaylamadan görünmez. Dilerseniz PIN koyar, anı kabulünü açıp kapatır, onaylı anıları misafirlere açık bir duvarda gösterirsiniz.',
    hostFeatures: [
      ['ShieldCheck', 'Onay (moderasyon)', 'Her anı önce sizin onayınızdan geçer'],
      ['KeyRound', 'PIN koruması', 'Sadece davetliler anı bırakabilir'],
      ['Download', 'İndirme', 'Ses, video ve fotoğrafları tek tek indirin'],
      ['LayoutGrid', 'Herkese açık duvar', 'İsteğe bağlı: onaylı anılar sayfada görünür'],
      ['ToggleRight', 'Aç / kapat', 'Etkinlik bitince anı kabulünü kapatın'],
      ['Infinity', '300 anıya kadar', 'Sınırsız misafir, 300 anı'],
    ],
    adminTitle: 'Gelen anılar',
    adminRows: [['Zeynep', '🎙️ Sesli mesaj · 0:42', 'Onay bekliyor'], ['Can', '🎬 Video · 0:31', 'Onaylandı'], ['Elif teyze', '✍️ Not', 'Onaylandı'], ['Burak', '🖼️ Fotoğraf', 'Onaylandı']],
    pending: 'Onay bekliyor',
    approved: 'Onaylandı',
    download: '⬇ İndir',
    cardsKicker: 'Masa kartları',
    cardsTitle: 'İsimlerinizle, baskıya hazır',
    cardsLead: 'Anı defterinizi kurduktan sonra panelden isimli masa kartlarını açıp evde ya da matbaada yazdırırsınız. Tüm kartlar aynı anı defterine bağlıdır.',
    cardsPoints: ['Etkinlik adınız ve tarihiniz kartta', 'Her masaya bir kart, misafirler aynı anda okutur', 'Kart tasarımı QRNot neon ve sade temalarla uyumlu'],
    eventsKicker: 'Hangi etkinlikler için?',
    eventsTitle: 'Her kutlamanın sesi kalsın',
    events: [
      ['Heart', 'Düğün', 'Misafirlerin dilekleri, yıllar sonra da sizinle'],
      ['Gem', 'Nişan & söz', 'Ailelerin ilk mesajları'],
      ['Flower2', 'Kına gecesi', 'Duygusal anlar, sesli hatıralar'],
      ['Baby', 'Baby shower', 'Bebeğe ilk sesli mesajlar'],
      ['Cake', 'Doğum günü', 'Sevenlerinden sesli kutlama'],
      ['GraduationCap', 'Mezuniyet', 'Sınıf arkadaşlarından hatıralar'],
      ['Briefcase', 'Emeklilik & veda', 'Ekipten teşekkür mesajları'],
      ['Building2', 'Kurumsal etkinlik', 'Lansman ve yıl sonu anıları'],
    ],
    compareTitle: 'Neden dijital anı defteri?',
    closing: 'Kutlamanızın sesi, yıllar sonra da sizinle.',
    compare: [
      ['Kiralık sesli anı telefonu', ['Tek cihaz, misafirler sıraya girer', 'Kurulum, teslim ve iade gerekir', 'Sadece ses kaydı']],
      ['QRNot Dijital Anı Defteri', ['Herkes kendi telefonundan, aynı anda', 'Kargo, kurulum ve iade yok', 'Ses, video, fotoğraf ve yazılı not']],
    ],
    buyKicker: 'Nereden alınır?',
    buyTitle: 'Anı defterinizi edinin',
    buyOptions: [
      ['Globe', 'qrnot.com', 'Dijital anı defteri — 499 TL. Satın alma sonrası hesabınıza tanımlanır.'],
      ['Package', 'Trendyol · Hepsiburada', 'Basılı QR masa kartı setiyle birlikte gönderilir.'],
      ['ShoppingBag', 'Etsy', 'Yurt dışındaki misafirleriniz için İngilizce dijital ürün.'],
    ],
    faqTitle: 'Sık sorulanlar',
    faq: [
      ['Misafirler uygulama indirmeli mi?', 'Hayır. QR telefonun kamerasıyla açılır.'],
      ['Kaç misafir anı bırakabilir?', 'Misafir sayısı sınırsız; anı defteri 300 anıya kadar kayıt alır.'],
      ['İstemediğimiz bir mesaj gelirse?', 'Onay açıkken hiçbir anı siz onaylamadan görünmez; reddedebilirsiniz.'],
      ['Anıları saklayabilir miyim?', 'Evet. Panelden ses, video ve fotoğrafları indirirsiniz.'],
    ],
    contact: 'Bilgi: qrnot.com/guestbook · WhatsApp +90 543 392 92 30',
  },
  en: {
    lang: 'en',
    catalog: 'Guestbook Catalog',
    product: 'Audio & Video Guestbook',
    page: 'Page',
    coverKicker: 'Weddings · Engagements · Showers · Every celebration',
    coverTitle: ['Collect voices,', 'not just signatures.'],
    coverLead: 'One QR card on your tables lets guests leave voice messages, videos, photos or written notes from their own phones. You approve them, keep them and listen again years later.',
    coverPills: ['No app needed', 'No rental phone', 'Up to 300 memories', 'Approval & PIN'],
    names: 'Emma & James',
    cardKicker: 'LEAVE US A MESSAGE',
    cardScan: 'Scan with your phone camera',
    cardTypes: '🎙️ voice · 🎬 video · 📷 photo · ✍️ note',
    howKicker: 'How it works',
    howTitle: 'Your guestbook in 4 steps',
    steps: [
      ['Settings2', 'Set it up', 'Sign in, name your event, add a welcome message and choose approval and PIN settings.'],
      ['Printer', 'Print the cards', 'Print personalised table cards and place one on every table.'],
      ['Smartphone', 'Guests leave memories', 'Guests scan the QR and leave a voice message, video, photo or note.'],
      ['Archive', 'Approve and keep', 'Approve every memory, listen any time and download them.'],
    ],
    howNote: 'Set it up a few days before your event and test it with your own phone.',
    guestKicker: 'Guest experience',
    guestTitle: 'Scan, record, send.',
    guestLead: 'No app to install. The QR opens in the phone browser, and everyone records from their own phone — no queue, all at the same time.',
    guestFeatures: [
      ['Mic', 'Voice message', 'Up to 2 minutes'],
      ['Video', 'Video', 'Up to 2 minutes'],
      ['Image', 'Photos', 'From the gallery or camera'],
      ['PenLine', 'Written note', 'Even a long message'],
      ['Users', 'Everyone at once', 'No queue, no rental device'],
      ['UserCheck', 'One memory per guest', 'No duplicates or spam'],
    ],
    screenWelcome: 'Leave us a memory 💛',
    screenName: 'Your name',
    screenTypes: ['🎙️ Voice', '🎬 Video', '🖼️ Photo', '✍️ Note'],
    screenSend: 'Send memory',
    hostKicker: 'Host panel',
    hostTitle: 'Every memory under your control',
    hostLead: 'Nothing appears until you approve it. Add a PIN, open or close the guestbook, and optionally show approved memories on a public wall.',
    hostFeatures: [
      ['ShieldCheck', 'Approval (moderation)', 'Every memory waits for your approval'],
      ['KeyRound', 'PIN protection', 'Only your guests can post'],
      ['Download', 'Download', 'Save voice, video and photos one by one'],
      ['LayoutGrid', 'Public wall', 'Optional: approved memories on the page'],
      ['ToggleRight', 'Open / close', 'Stop new memories after the event'],
      ['Infinity', 'Up to 300 memories', 'Unlimited guests, 300 memories'],
    ],
    adminTitle: 'New memories',
    adminRows: [['Sophie', '🎙️ Voice message · 0:42', 'Pending'], ['Daniel', '🎬 Video · 0:31', 'Approved'], ['Aunt Rose', '✍️ Note', 'Approved'], ['Liam', '🖼️ Photo', 'Approved']],
    pending: 'Pending',
    approved: 'Approved',
    download: '⬇ Download',
    cardsKicker: 'Table cards',
    cardsTitle: 'Personalised and print-ready',
    cardsLead: 'Once your guestbook is set up, open your personalised table cards in the panel and print them at home or at a print shop. Every card links to the same guestbook.',
    cardsPoints: ['Your event name and date on the card', 'One card per table, guests scan at the same time', 'Matches QRNot neon and minimal themes'],
    eventsKicker: 'Which events?',
    eventsTitle: 'Keep the voice of every celebration',
    events: [
      ['Heart', 'Weddings', 'Guests’ wishes, with you for years'],
      ['Gem', 'Engagements', 'The families’ first messages'],
      ['Flower2', 'Bridal showers', 'Emotional moments, voice memories'],
      ['Baby', 'Baby showers', 'First voice messages to the baby'],
      ['Cake', 'Birthdays', 'Voice wishes from loved ones'],
      ['GraduationCap', 'Graduations', 'Memories from classmates'],
      ['Briefcase', 'Retirements & farewells', 'Thank-you messages from the team'],
      ['Building2', 'Corporate events', 'Launch and year-end memories'],
    ],
    compareTitle: 'Why a digital guestbook?',
    closing: 'The voice of your celebration, with you for years.',
    compare: [
      ['Rental audio guestbook phone', ['One device, guests queue up', 'Set-up, delivery and return', 'Voice only']],
      ['QRNot Audio & Video Guestbook', ['Everyone on their own phone, at once', 'No shipping, set-up or return', 'Voice, video, photos and notes']],
    ],
    buyKicker: 'Where to buy',
    buyTitle: 'Get your guestbook',
    buyOptions: [
      ['Globe', 'qrnot.com', 'Digital guestbook — $29. Added to your account after purchase.'],
      ['ShoppingBag', 'Etsy', 'Digital product in English, available worldwide.'],
      ['Package', 'Trendyol · Hepsiburada', 'Turkey: shipped with a printed QR table-card set.'],
    ],
    faqTitle: 'FAQ',
    faq: [
      ['Do guests need an app?', 'No. The QR opens with the phone camera.'],
      ['How many guests can post?', 'Unlimited guests; the guestbook holds up to 300 memories.'],
      ['What if we get an unwanted message?', 'With approval on, nothing appears until you approve it; you can reject it.'],
      ['Can we keep the memories?', 'Yes. Download voice, video and photos from your panel.'],
    ],
    contact: 'More: qrnot.com/guestbook?lang=en · WhatsApp +90 543 392 92 30',
  },
}

// ---------------------------------------------------------------------------------------------
const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: ${W}px ${H}px; margin: 0; }
  html, body { background: #07050c; }
  body { font-family: Inter, 'Segoe UI', sans-serif; color: #f4eef6; -webkit-font-smoothing: antialiased; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; padding: 88px 88px 120px; background: #08060e; page-break-after: always; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: auto; }
  .bg { position: absolute; inset: 0; pointer-events: none; }
  .glow { position: absolute; border-radius: 50%; filter: blur(120px); }
  .sparkle { position: absolute; inset: 0; background-image: radial-gradient(rgba(243,198,107,.35) 1px, transparent 1.5px); background-size: 46px 46px; mask-image: radial-gradient(circle at 70% 20%, black, transparent 60%); opacity: .5; }
  .rel { position: relative; }
  h1, h2, h3, .head { font-family: Montserrat, 'Segoe UI', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
  .serif { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; letter-spacing: -0.01em; }
  .kicker { font-family: Montserrat, sans-serif; font-weight: 700; letter-spacing: .24em; text-transform: uppercase; font-size: 18px; color: ${GOLD}; }
  .grad { background: linear-gradient(90deg, ${GOLD}, ${ROSE} 50%, ${PINK}); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .muted { color: rgba(244,238,246,.68); }
  .glass { background: linear-gradient(160deg, rgba(255,255,255,.075), rgba(255,255,255,.025)); border: 1.5px solid rgba(255,255,255,.12); border-radius: 26px; }
  .gold-glass { background: linear-gradient(160deg, rgba(243,198,107,.12), rgba(255,95,168,.05)); border: 1.5px solid rgba(243,198,107,.35); border-radius: 26px; }
  .ring { border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; }
  .pill { display: inline-flex; align-items: center; gap: 10px; padding: 12px 22px; border-radius: 999px; border: 1.5px solid rgba(243,198,107,.35); font-weight: 600; font-size: 19px; background: rgba(243,198,107,.06); }
  .brand { display: flex; align-items: center; gap: 16px; }
  .logo { width: 58px; height: 58px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(135deg, ${GOLD}, ${PINK}); box-shadow: 0 0 34px rgba(243,198,107,.4); }
  .footer { position: absolute; left: 88px; right: 88px; bottom: 46px; display: flex; justify-content: space-between; font-size: 16px; color: rgba(244,238,246,.5); border-top: 1px solid rgba(255,255,255,.1); padding-top: 18px; }
  .phone { width: 420px; aspect-ratio: 9/19; border-radius: 62px; padding: 13px; background: linear-gradient(160deg, #2c2433, #0d0a12); box-shadow: 0 40px 90px rgba(0,0,0,.6), 0 0 60px rgba(243,198,107,.18), 0 0 0 1.5px rgba(255,255,255,.08); flex-shrink: 0; }
  .screen { height: 100%; border-radius: 50px; background: linear-gradient(180deg, #fff8f1, #fdeee4); color: #241a2c; padding: 54px 22px 22px; display: flex; flex-direction: column; gap: 13px; overflow: hidden; }
  .card { background: #fffdf9; color: #231a2b; border-radius: 20px; box-shadow: 0 30px 70px rgba(0,0,0,.5), 0 0 50px rgba(243,198,107,.18); text-align: center; container-type: inline-size; }
  .card .qr svg { display: block; width: 100%; height: auto; }
`

function page(body, n, total, t, a1 = GOLD, a2 = PINK) {
  return `<section class="page">
    <div class="bg"><div class="sparkle"></div>
      <div class="glow" style="width:760px;height:760px;left:-260px;top:-240px;background:${a1};opacity:.18"></div>
      <div class="glow" style="width:820px;height:820px;right:-300px;bottom:-260px;background:${a2};opacity:.18"></div></div>
    <div class="rel" style="display:flex;flex-direction:column;flex:1">${body}</div>
    <div class="footer"><span>QRNot · ${t.catalog}</span><span>qrnot.com · ${t.page} ${n} / ${total}</span></div>
  </section>`
}
const brand = (t) => `<div class="brand"><div class="logo">${icon('BookHeart', 30, '#1a1020', 2)}</div>
  <div><div class="head" style="font-size:34px;line-height:1">QR<span class="grad">Not</span></div><div class="muted" style="font-size:16px;margin-top:6px;letter-spacing:.08em">${t.product.toUpperCase()}</div></div></div>`
const ring = (name, color, size = 80) => `<div class="ring" style="width:${size}px;height:${size}px;border:2px solid ${color};box-shadow:0 0 22px ${color}55, inset 0 0 16px ${color}2a">${icon(name, size * 0.44, color, 1.8)}</div>`
const label = (text) => `<div style="font-size:18px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,238,246,.55)">${text}</div>`

const tableCard = (t, width, rotate = 0) => `<div class="card" style="width:${width}px;padding:${width * 0.1}px ${width * 0.09}px;transform:rotate(${rotate}deg)">
  <div style="font-size:4.4cqw;letter-spacing:.2em;font-weight:700;color:#b98a2c">${t.cardKicker}</div>
  <div class="serif" style="font-size:11cqw;margin-top:3cqw">${t.names}</div>
  <div style="width:30%;height:2px;background:linear-gradient(90deg,transparent,#d9a94a,transparent);margin:3cqw auto 0"></div>
  <div class="qr" style="width:52%;margin:7cqw auto">${qr(DEMO)}</div>
  <div style="font-size:4.8cqw;color:#5a4a63;font-weight:600">${t.cardScan}</div>
  <div style="font-size:4.2cqw;color:#7a6a83;margin-top:1.6cqw">${t.cardTypes}</div>
</div>`

const guestScreen = (t) => `<div class="phone"><div class="screen">
  <div style="font-size:13px;font-weight:700;letter-spacing:.18em;color:#b98a2c;text-align:center">${t.cardKicker}</div>
  <div class="serif" style="font-size:36px;text-align:center">${t.names}</div>
  <div style="font-size:16px;text-align:center;color:#6a5a73">${t.screenWelcome}</div>
  <div style="background:#fff;border:1.5px solid #f0dfd2;border-radius:14px;padding:14px 16px;font-size:16px;color:#8a7a93">${t.screenName}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${t.screenTypes.map((x, i) => `<div style="background:${i === 0 ? '#ffe6ef' : '#fff'};border:1.5px solid ${i === 0 ? PINK : '#f0dfd2'};border-radius:16px;padding:18px 8px;text-align:center;font-size:19px;font-weight:700">${x}</div>`).join('')}</div>
  <div style="background:#fff;border:1.5px solid #f0dfd2;border-radius:16px;padding:16px;display:flex;align-items:center;gap:12px">
    <div style="width:46px;height:46px;border-radius:50%;background:${PINK};display:grid;place-items:center">${icon('Mic', 22, '#fff', 2.2)}</div>
    <div style="display:flex;align-items:center;gap:3px;height:34px">${[30, 60, 90, 50, 75, 95, 55, 70, 40, 80, 60, 45, 85].map((h) => `<i style="display:block;width:5px;height:${h}%;border-radius:4px;background:${PINK}"></i>`).join('')}</div>
    <div style="font-size:14px;color:#6a5a73;margin-left:auto">0:24</div>
  </div>
  <div style="margin-top:auto;background:linear-gradient(90deg,${PINK},#e8505b);color:#fff;border-radius:999px;padding:17px;text-align:center;font-size:18px;font-weight:800">${t.screenSend}</div>
</div></div>`

const hostScreen = (t) => `<div class="phone" style="box-shadow:0 40px 90px rgba(0,0,0,.6), 0 0 60px rgba(95,224,184,.15), 0 0 0 1.5px rgba(255,255,255,.08)"><div class="screen" style="background:linear-gradient(180deg,#14111c,#0d0b14);color:#f4eef6">
  <div style="font-size:13px;font-weight:700;letter-spacing:.18em;color:${GOLD}">${t.names.toUpperCase()}</div>
  <div class="head" style="font-size:30px">${t.adminTitle}</div>
  ${t.adminRows
    .map(
      ([n, d, st]) => `<div style="background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);border-radius:18px;padding:20px 18px">
        <div style="font-size:20px;font-weight:700">${n}</div><div style="font-size:16px;color:rgba(244,238,246,.65);margin-top:3px">${d}</div>
        <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:13px;font-weight:700"><span style="color:${st === t.pending ? GOLD : MINT}">${st}</span><span>${t.download}</span></div></div>`
    )
    .join('')}
</div></div>`

// ---------------------------------------------------------------------------------------------
const pages = (t) => [
  // 1 Kapak
  `${brand(t)}
   <div style="display:grid;grid-template-columns:1fr 470px;gap:50px;margin-top:130px;align-items:center">
     <div>
       <div class="kicker">${t.coverKicker}</div>
       <h1 style="font-size:104px;line-height:1.02;margin-top:28px">${t.coverTitle[0]}<br><span class="grad">${t.coverTitle[1]}</span></h1>
       <p class="muted" style="font-size:25px;line-height:1.55;margin-top:34px">${t.coverLead}</p>
     </div>
     ${tableCard(t, 470, 3)}
   </div>
   <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:90px">${t.coverPills.map((p) => `<span class="pill">${p}</span>`).join('')}</div>
   <div style="margin-top:auto;margin-bottom:30px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px">
     ${t.guestFeatures.slice(0, 4).map(([ic, title, desc], i) => `<div class="glass" style="padding:34px 24px">${ring(ic, [PINK, GOLD, BLUE, MINT][i], 76)}<div class="head" style="font-size:24px;margin-top:22px">${title}</div><div class="muted" style="font-size:16px;margin-top:6px">${desc}</div></div>`).join('')}
   </div>`,
  // 2 Nasıl çalışır
  `${brand(t)}
   <div style="margin-top:72px"><div class="kicker">${t.howKicker}</div><h2 style="font-size:72px;margin-top:18px">${t.howTitle}</h2></div>
   <div style="display:flex;flex-direction:column;gap:22px;margin-top:50px">
     ${t.steps.map(([ic, title, desc], i) => `<div class="glass" style="padding:44px 38px;display:flex;align-items:center;gap:32px"><span class="head grad" style="font-size:70px;width:110px">0${i + 1}</span>${ring(ic, [GOLD, ROSE, PINK, MINT][i], 84)}<div><div class="head" style="font-size:32px">${title}</div><div class="muted" style="font-size:22px;margin-top:10px;line-height:1.45">${desc}</div></div></div>`).join('')}
   </div>
   <div class="gold-glass" style="margin-top:auto;margin-bottom:30px;padding:30px 36px;display:flex;align-items:center;gap:22px">${icon('Lightbulb', 40, GOLD, 1.9)}<div style="font-size:23px;font-weight:600">${t.howNote}</div></div>`,
  // 3 Misafir deneyimi
  `${brand(t)}
   <div style="display:grid;grid-template-columns:1fr 420px;gap:56px;margin-top:72px;align-items:start">
     <div><div class="kicker">${t.guestKicker}</div><h2 style="font-size:70px;line-height:1.05;margin-top:18px">${t.guestTitle}</h2>
       <p class="muted" style="font-size:24px;line-height:1.55;margin-top:28px">${t.guestLead}</p></div>
     ${guestScreen(t)}
   </div>
   <div style="margin-top:auto;margin-bottom:30px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
     ${t.guestFeatures.map(([ic, title, desc], i) => `<div class="glass" style="padding:26px 24px;display:flex;gap:18px;align-items:center">${ring(ic, [PINK, GOLD, BLUE, MINT, ROSE, GOLD][i], 64)}<div><div style="font-size:22px;font-weight:700">${title}</div><div class="muted" style="font-size:17px;margin-top:4px">${desc}</div></div></div>`).join('')}
   </div>`,
  // 4 Ev sahibi paneli
  `${brand(t)}
   <div style="display:grid;grid-template-columns:420px 1fr;gap:56px;margin-top:72px;align-items:start">
     ${hostScreen(t)}
     <div><div class="kicker" style="color:${MINT}">${t.hostKicker}</div><h2 style="font-size:64px;line-height:1.06;margin-top:18px">${t.hostTitle}</h2>
       <p class="muted" style="font-size:23px;line-height:1.55;margin-top:28px">${t.hostLead}</p></div>
   </div>
   <div style="margin-top:auto;margin-bottom:30px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
     ${t.hostFeatures.map(([ic, title, desc], i) => `<div class="glass" style="padding:26px 24px">${ring(ic, [MINT, GOLD, BLUE, ROSE, PINK, GOLD][i], 64)}<div style="font-size:22px;font-weight:700;margin-top:16px">${title}</div><div class="muted" style="font-size:17px;margin-top:6px;line-height:1.4">${desc}</div></div>`).join('')}
   </div>`,
  // 5 Masa kartları
  `${brand(t)}
   <div style="margin-top:72px"><div class="kicker">${t.cardsKicker}</div><h2 style="font-size:70px;margin-top:18px">${t.cardsTitle}</h2>
     <p class="muted" style="font-size:24px;line-height:1.55;margin-top:24px;max-width:960px">${t.cardsLead}</p></div>
   <div style="display:flex;justify-content:center;align-items:center;margin-top:90px">
     <div style="margin-right:-90px;margin-top:80px;z-index:1">${tableCard(t, 420, -7)}</div><div style="z-index:2">${tableCard(t, 480, 0)}</div><div style="margin-left:-90px;margin-top:80px;z-index:1">${tableCard(t, 420, 7)}</div>
   </div>
   <div style="margin-top:auto;margin-bottom:30px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
     ${t.cardsPoints.map((p, i) => `<div class="gold-glass" style="padding:26px 24px;display:flex;gap:16px;align-items:center">${icon(['CalendarHeart', 'Users', 'Palette'][i], 34, GOLD, 1.9)}<div style="font-size:20px;font-weight:600;line-height:1.35">${p}</div></div>`).join('')}
   </div>`,
  // 6 Etkinlikler + karşılaştırma
  `${brand(t)}
   <div style="margin-top:72px"><div class="kicker">${t.eventsKicker}</div><h2 style="font-size:64px;margin-top:18px">${t.eventsTitle}</h2></div>
   <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:44px">
     ${t.events.map(([ic, title, desc], i) => `<div class="glass" style="padding:34px 22px">${ring(ic, [PINK, GOLD, ROSE, BLUE, MINT, GOLD, ROSE, BLUE][i], 72)}<div style="font-size:22px;font-weight:700;margin-top:20px">${title}</div><div class="muted" style="font-size:16px;margin-top:6px;line-height:1.4">${desc}</div></div>`).join('')}
   </div>
   <h3 style="font-size:42px;margin-top:64px">${t.compareTitle}</h3>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:26px;margin-bottom:30px">
     ${t.compare.map(([title, items], i) => `<div class="${i === 1 ? 'gold-glass' : 'glass'}" style="padding:40px 34px"><div class="head" style="font-size:24px;${i === 1 ? '' : 'color:rgba(244,238,246,.7)'}">${title}</div>
       <ul style="list-style:none;margin-top:24px;display:flex;flex-direction:column;gap:18px">${items.map((x) => `<li style="display:flex;gap:12px;font-size:22px;align-items:center">${icon(i === 1 ? 'CircleCheck' : 'CircleMinus', 26, i === 1 ? MINT : 'rgba(244,238,246,.45)', 2)}<span${i === 1 ? '' : ' class="muted"'}>${x}</span></li>`).join('')}</ul></div>`).join('')}
   </div>
   <div class="gold-glass" style="margin-top:auto;margin-bottom:30px;padding:44px 40px;text-align:center"><div class="serif grad" style="font-size:46px;line-height:1.2">${t.closing}</div></div>`,
  // 7 Nereden alınır + SSS
  `${brand(t)}
   <div style="margin-top:72px"><div class="kicker">${t.buyKicker}</div><h2 style="font-size:70px;margin-top:18px">${t.buyTitle}</h2></div>
   <div style="display:flex;flex-direction:column;gap:18px;margin-top:44px">
     ${t.buyOptions.map(([ic, title, desc], i) => `<div class="${i === 0 ? 'gold-glass' : 'glass'}" style="padding:38px 36px;display:flex;align-items:center;gap:28px">${ring(ic, [GOLD, PINK, BLUE][i], 82)}<div><div class="head" style="font-size:28px">${title}</div><div class="muted" style="font-size:20px;margin-top:6px">${desc}</div></div></div>`).join('')}
   </div>
   <h3 style="font-size:40px;margin-top:70px">${t.faqTitle}</h3>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px">
     ${t.faq.map(([q, a]) => `<div class="glass" style="padding:32px 30px"><div style="font-size:22px;font-weight:700">${q}</div><div class="muted" style="font-size:19px;margin-top:8px;line-height:1.45">${a}</div></div>`).join('')}
   </div>
   <div class="gold-glass" style="margin-top:auto;margin-bottom:30px;padding:28px 34px;display:flex;align-items:center;gap:20px">${icon('Sparkles', 36, GOLD, 1.9)}<div style="font-size:22px;font-weight:600">${t.contact}</div></div>`,
]

// ---------------------------------------------------------------------------------------------
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find((x) => existsSync(x))
if (!CHROME) throw new Error('Chrome / Edge bulunamadı')
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">`
const doc = (sections, lang) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body>${sections}</body></html>`

const SLUGS = ['kapak', 'nasil-calisir', 'misafir', 'ev-sahibi', 'masa-kartlari', 'etkinlikler', 'satin-al']
const ACCENTS = [[GOLD, PINK], [ROSE, GOLD], [PINK, BLUE], [MINT, GOLD], [GOLD, ROSE], [PINK, GOLD], [GOLD, PINK]]
const tmp = join(tmpdir(), 'qrnot-ani-defteri-html')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })

for (const lang of ['tr', 'en']) {
  const t = COPY[lang]
  const bodies = pages(t)
  const sections = bodies.map((b, i) => page(b, i + 1, bodies.length, t, ACCENTS[i][0], ACCENTS[i][1]))
  const pngDir = join(HERE, lang)
  mkdirSync(pngDir, { recursive: true })
  mkdirSync(join(ROOT, 'public', 'katalog', 'ani-defteri', lang), { recursive: true })
  sections.forEach((section, i) => {
    const name = `${String(i + 1).padStart(2, '0')}-${SLUGS[i]}`
    const html = join(tmp, `${lang}-${name}.html`)
    writeFileSync(html, doc(section, lang))
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W},${H}`, '--virtual-time-budget=10000', `--screenshot=${join(pngDir, `${name}.png`)}`, pathToFileURL(html).href], { stdio: 'ignore' })
    console.log(`${lang}/${name}.png`)
  })
  const pdfHtml = join(tmp, `${lang}-all.html`)
  writeFileSync(pdfHtml, doc(sections.join('\n'), lang))
  const pdf = join(ROOT, 'public', 'katalog', 'ani-defteri', `QRNot-Ani-Defteri-Katalog-${lang.toUpperCase()}.pdf`)
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=12000', `--print-to-pdf=${pdf}`, pathToFileURL(pdfHtml).href], { stdio: 'ignore' })
  console.log('PDF', pdf)
}
