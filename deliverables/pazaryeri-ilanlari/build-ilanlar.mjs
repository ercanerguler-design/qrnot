// Trendyol ve Hepsiburada ilan görsellerini ve metinlerini üretir:
//   node deliverables/pazaryeri-ilanlari/build-ilanlar.mjs              (hepsi)
//   node deliverables/pazaryeri-ilanlari/build-ilanlar.mjs kolye-nfc    (adı eşleşen ürün)
// Çıktı: deliverables/pazaryeri-ilanlari/<trendyol|hepsiburada>/<urun>/{gorseller/*.png, baslik.txt, aciklama.txt, aciklama.html, fiyat.txt, urun-bilgileri.txt}
// Ürün çizimleri src/components/warm/ProductArt.tsx ile aynıdır. Fiyatlar aşağıdaki PRICING varsayımlarıyla hesaplanır.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const require = createRequire(join(ROOT, 'package.json'))
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { QRCodeSVG } = require('qrcode.react')

const artJs = ts.transpileModule(readFileSync(join(ROOT, 'src/components/warm/ProductArt.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText
const artModule = { exports: {} }
new Function('require', 'module', 'exports', artJs)(require, artModule, artModule.exports)
const ProductArt = artModule.exports.default
const art = (kind, variant, nfc = false, cls = 'art') => renderToStaticMarkup(React.createElement(ProductArt, { kind, variant, nfc, className: cls }))
const qr = (url) => renderToStaticMarkup(React.createElement(QRCodeSVG, { value: url, size: 512, level: 'M', marginSize: 0, fgColor: '#1f2440', bgColor: 'transparent' }))

// --- Fiyatlama ---------------------------------------------------------------------------------
// Pazaryerinde kargo satıcıya aittir (alıcı ödemeli seçeneği yok) ve satıştan komisyon kesilir.
// Önerilen fiyat = (site fiyatı + kargo) / (1 − komisyon), 9 ile biten en yakın üst tutara yuvarlanır.
// Kategori komisyonunu ve anlaşmalı kargo ücretini satıcı panelinden kontrol edip burada güncelle.
const PRICING = {
  trendyol: { commission: 0.2, shipping: 60 },
  hepsiburada: { commission: 0.2, shipping: 60 },
}
const price = (site, platform) => {
  const { commission, shipping } = PRICING[platform]
  const raw = (site + shipping) / (1 - commission)
  return Math.ceil((raw + 1) / 10) * 10 - 1
}

const COLORS = [
  ['neon-pink', 'Neon Pembe', 'PEMBE'],
  ['neon-orange', 'Neon Turuncu', 'TURUNCU'],
  ['neon-blue', 'Neon Mavi', 'MAVI'],
  ['neon-green', 'Neon Yeşil', 'YESIL'],
  ['neon-yellow', 'Neon Sarı', 'SARI'],
]

const PRODUCTS = [
  {
    id: 'kolye-qr',
    kind: 'necklace',
    nfc: false,
    mainVariant: 'neon-pink',
    sitePrice: 449,
    sku: 'QRN-KLY-QR',
    name: 'Sesli Anı Kolyesi',
    title: 'QRNot Sesli Anı Kolyesi QR Kodlu Kişiye Özel Hediye Kolye Ses Video Fotoğraf Mesajlı',
    category: { trendyol: 'Aksesuar > Takı > Kolye', hepsiburada: 'Moda > Takı & Mücevher > Kolye' },
    hook: 'Kolyenin arkasındaki QR kodu okutan kişi senin sesini duyar, videonu izler, fotoğraflarına bakar.',
    features: ['Arkasında sana özel QR kod', 'Sesli mesaj, video, fotoğraf ve link', 'Hafif pleksi gövde, neon damla baskı', 'Uygulama gerekmez, pil gerekmez'],
    uses: [['💍', 'Sevgiliye'], ['👩‍👧', 'Anneye'], ['🎓', 'Mezuniyet'], ['🎂', 'Doğum günü'], ['✈️', 'Uzak mesafe'], ['🕊️', 'Anı / hatıra']],
  },
  {
    id: 'kolye-nfc',
    kind: 'necklace',
    nfc: true,
    mainVariant: 'neon-orange',
    sitePrice: 599,
    sku: 'QRN-KLY-NFC',
    name: 'NFC + QR Anı Kolyesi',
    title: 'QRNot NFC ve QR Kodlu Sesli Anı Kolyesi Dokun Dinle Kişiye Özel Hediye Kolye',
    category: { trendyol: 'Aksesuar > Takı > Kolye', hepsiburada: 'Moda > Takı & Mücevher > Kolye' },
    hook: 'Telefonu kolyeye dokundurmak yeter: sesli mesajın, videon ve fotoğrafların anında açılır. NFC olmayan telefonlar için QR yedekte.',
    features: ['Gizli NFC çip + QR kod yedeği', 'Çip programlanmış ve kilitli gelir', 'Sesli mesaj, video, fotoğraf ve link', 'Pil gerekmez, uygulama gerekmez'],
    uses: [['💍', 'Sevgiliye'], ['👩‍👧', 'Anneye'], ['🎓', 'Mezuniyet'], ['🎂', 'Doğum günü'], ['💒', 'Yıl dönümü'], ['🕊️', 'Anı / hatıra']],
  },
  {
    id: 'anahtarlik-qr',
    kind: 'keychain',
    nfc: false,
    mainVariant: 'neon-blue',
    sitePrice: 349,
    sku: 'QRN-ANH-QR',
    name: 'Sesli Anahtarlık',
    title: 'QRNot Sesli Anahtarlık QR Kodlu Kişiye Özel Hediye Ses Video Mesajlı Acil Durum Bilgili',
    category: { trendyol: 'Aksesuar > Anahtarlık', hepsiburada: 'Moda > Aksesuar > Anahtarlık' },
    hook: 'Her gün yanında taşınan bir ses. Kaybolursa, bulan kişi QR\'ı okutup seni tek dokunuşla arayabilir.',
    features: ['Sana özel QR kod', 'Sesli mesaj, video, fotoğraf ve link', 'Kayıp durumunda "Ara" ve "Konumu aç" butonları', 'Hafif pleksi gövde, neon damla baskı'],
    uses: [['🔑', 'Anahtar'], ['🎒', 'Okul çantası'], ['🧳', 'Bavul'], ['🐾', 'Evcil hayvan'], ['💝', 'Sevgiliye'], ['👨‍👧', 'Babaya']],
  },
  {
    id: 'anahtarlik-nfc',
    kind: 'keychain',
    nfc: true,
    mainVariant: 'neon-green',
    sitePrice: 499,
    sku: 'QRN-ANH-NFC',
    name: 'NFC + QR Anahtarlık',
    title: 'QRNot NFC ve QR Kodlu Anahtarlık Dijital Kartvizit Evcil Hayvan Künyesi Kişiye Özel Hediye',
    category: { trendyol: 'Aksesuar > Anahtarlık', hepsiburada: 'Moda > Aksesuar > Anahtarlık' },
    hook: 'Telefonu dokundur, içerik açılsın. Dijital kartvizit, evcil hayvan künyesi ya da sesli hediye olarak kullan.',
    features: ['Gizli NFC çip + QR kod yedeği', 'Çip programlanmış ve kilitli gelir', 'Kayıp durumunda "Ara" ve "Konumu aç" butonları', 'Pil gerekmez, uygulama gerekmez'],
    uses: [['💼', 'Dijital kartvizit'], ['🐾', 'Evcil hayvan'], ['🔑', 'Anahtar'], ['🎒', 'Çanta'], ['🎁', 'Hediye'], ['🏢', 'Kurumsal']],
  },
]

// --- Metinler ----------------------------------------------------------------------------------
function descriptionLines(p) {
  const nfcBlock = p.nfc
    ? [
        'NFC UYUMLULUK',
        '• iPhone XS, XR ve sonrası: ekran açıkken telefonun üst kısmını ürüne yaklaştır.',
        '• iPhone 7 – X: Denetim Merkezi → NFC Etiket Okuyucu.',
        '• Android: NFC açık olmalı; telefonun arka ortasını ürüne yaklaştır.',
        '• NFC olmayan telefonlar ürünün üzerindeki QR kodu kamerayla okutur.',
        '',
      ]
    : []
  return [
    `${p.name} — Hediyene bir ses ver.`,
    '',
    p.hook,
    '',
    'NASIL ÇALIŞIR?',
    '1. Ürün elinize ulaşınca qrnot.com üzerinden ücretsiz QRNot hesabı açın.',
    `2. Ürünün üzerindeki QR kodu ${p.nfc ? 'okutun ya da telefonu ürüne dokundurun' : 'telefon kamerasıyla okutun'}; sesinizi kaydedin, video ya da fotoğraf yükleyin.`,
    '3. QR kod hesabınıza bağlanır. Hediyeyi alan kişi okuttuğunda içeriğiniz uygulama gerektirmeden açılır.',
    '',
    'ÖZELLİKLER',
    ...p.features.map((f) => `• ${f}`),
    '• iPhone ve Android uyumlu, telefonun tarayıcısında açılır',
    '• Ürün üzerindeki QR kod ve NFC çip hiç değişmez',
    '',
    ...nfcBlock,
    'ÖNEMLİ BİLGİLER',
    '• İçerik eklemek ve yönetmek için ücretsiz QRNot hesabı gerekir. QR kod, ilk kurulan hesaba kilitlenir; başkası değiştiremez.',
    '• Ses kaydı en fazla 2 dakika, video en fazla 2 dakikadır.',
    '• 3 içerik kaydı dahildir (ilk kayıt + 2 güncelleme). İsim, telefon ve adres bilgileri sınırsız güncellenir. Ek güncelleme hakkı için bize ulaşabilirsiniz.',
    '• Ürün çizimleri temsilidir; neon renk tonu ekran ayarlarına göre farklı görünebilir.',
    '• Ölçü: [DOLDUR — örn. 3 × 3 cm kolye ucu, 45 cm zincir]',
    '• Paket içeriği: [DOLDUR — örn. ürün + kurulum kartı]',
    '',
    'KULLANIM ALANLARI',
    p.uses.map(([, t]) => t).join(' · '),
  ]
}

function descriptionHtml(p) {
  const lines = descriptionLines(p)
  const out = []
  let list = false
  for (const line of lines) {
    if (line.startsWith('• ')) {
      if (!list) {
        out.push('<ul>')
        list = true
      }
      out.push(`<li>${line.slice(2)}</li>`)
      continue
    }
    if (list) {
      out.push('</ul>')
      list = false
    }
    if (!line) continue
    if (/^[A-ZÇĞİÖŞÜ ?]+$/.test(line)) out.push(`<h3>${line}</h3>`)
    else if (/^\d\. /.test(line)) out.push(`<p>${line}</p>`)
    else out.push(`<p>${line}</p>`)
  }
  if (list) out.push('</ul>')
  return out.join('\n')
}

function productInfo(p, platform) {
  return [
    `Platform: ${platform === 'trendyol' ? 'Trendyol' : 'Hepsiburada'}`,
    `Başlık: ${p.title}`,
    `Kategori (önerilen): ${p.category[platform]}`,
    'Marka: QRNot  (pazaryerinde marka kaydı / marka yetki belgesi gerekebilir)',
    `Satış fiyatı (önerilen): ${price(p.sitePrice, platform)} TL  (bkz. README fiyat hesabı)`,
    'KDV: %20  (muhasebecine teyit ettir)',
    'Materyal: Pleksi (akrilik), epoksi damla baskı' + (p.nfc ? ', NFC çip (NTAG21x)' : ''),
    'Desi: [DOLDUR]',
    'Garanti: Yok (2 yıl yasal ayıp sorumluluğu geçerli)',
    '',
    'Varyantlar (Renk):',
    ...COLORS.map(([, label, code]) => `  • ${label}  —  Stok kodu: ${p.sku}-${code}  —  Barkod: [DOLDUR]`),
    '',
    'Barkod: Her renk için ayrı barkod gerekir (GS1 Türkiye barkodu ya da pazaryerinin önerdiği barkod).',
  ].join('\n')
}

// --- Görsel şablonları --------------------------------------------------------------------------
const CSS = `
  :root { --cream:#fff8f3; --cream2:#fdeee4; --ink:#1f2440; --ink2:#4a4f6a; --coral:#e8505b; --coral-soft:#fde4e3; --gold:#c9963a; --sage:#3f8f6b; --line:#efe1d6; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Geist, system-ui, sans-serif; color: var(--ink); background: var(--cream); -webkit-font-smoothing: antialiased; }
  .canvas { position: relative; width: var(--w); height: var(--h); overflow: hidden; padding: var(--pad); display: flex; flex-direction: column; }
  .white { background: #fff; }
  h1, h2, .serif { font-family: Fraunces, Georgia, serif; font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; }
  .kicker { font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--coral); }
  .muted { color: var(--ink2); }
  .art { width: 100%; height: 100%; display: block; }
  .art-white > rect:first-of-type { fill: #fff; }
  .qr svg { display: block; width: 100%; height: auto; }
  .card { background: #fff; border: 3px solid var(--line); border-radius: 40px; }
  .num { width: calc(var(--u) * 9); height: calc(var(--u) * 9); border-radius: 50%; background: var(--coral); color: #fff; display: grid; place-items: center; font-size: calc(var(--u) * 4.6); font-weight: 700; flex-shrink: 0; }
  .check { color: var(--sage); font-weight: 700; }
  .phone { aspect-ratio: 9/18.5; border-radius: calc(var(--u) * 6); background: #11131f; padding: calc(var(--u) * 1.6); box-shadow: 0 40px 80px rgba(31,36,64,.25); }
  .screen { width: 100%; height: 100%; border-radius: calc(var(--u) * 4.6); background: var(--cream); overflow: hidden; display: flex; flex-direction: column; align-items: center; padding: calc(var(--u) * 6) calc(var(--u) * 3) calc(var(--u) * 3); gap: calc(var(--u) * 2); }
  .wave { display: flex; align-items: center; gap: calc(var(--u) * .7); height: calc(var(--u) * 8); }
  .wave i { display: block; width: calc(var(--u) * .8); border-radius: 9px; background: var(--coral); }
  .foot { position: absolute; left: var(--pad); right: var(--pad); bottom: calc(var(--pad) * .55); display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--ink2); font-size: calc(var(--u) * 2.4); }
  .foot .dot { display: inline-block; width: calc(var(--u) * 1.1); height: calc(var(--u) * 1.1); border-radius: 50%; background: var(--coral); margin-right: calc(var(--u) * .9); vertical-align: middle; }
`
const WAVE = [30, 55, 80, 45, 70, 90, 50, 65, 35, 75, 55, 40, 85, 60, 30, 50, 70, 45].map((h) => `<i style="height:${h}%"></i>`).join('')
const foot = (p) => `<div class="foot"><span><span class="dot"></span>QRNot · ${p.name}</span><span>qrnot.com</span></div>`

function page(size, body, cls = '') {
  // --u: ölçeklenebilir birim (kısa kenarın %1'i) → aynı şablon dikey ve kare formatta çalışır
  const u = Math.min(size.w, size.h) / 100
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>:root{--w:${size.w}px;--h:${size.h}px;--u:${u}px;--pad:${u * 7}px} html,body{width:${size.w}px;height:${size.h}px;overflow:hidden} ${CSS}</style></head>
<body><div class="canvas ${cls}">${body}</div></body></html>`
}

function images(p) {
  const nfcWaves = p.nfc ? '<span style="position:absolute;right:8%;top:42%;font-size:calc(var(--u)*7);color:var(--coral)">)))</span>' : ''
  return [
    {
      file: '01-ana-gorsel',
      cls: 'white',
      // Pazaryeri kuralı: ana görselde beyaz zemin, yazı / logo yok, sadece ürün.
      body: `<div style="flex:1;display:grid;place-items:center"><div style="width:92%;aspect-ratio:1">${art(p.kind, p.mainVariant, p.nfc, 'art art-white')}</div></div>`,
    },
    {
      file: '02-renk-secenekleri',
      cls: 'white',
      body: `
        <h2 style="font-size:calc(var(--u)*6.4);text-align:center">5 neon renk seçeneği</h2>
        <div style="flex:1;display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:calc(var(--u)*2.5)">
          ${COLORS.map(([v, label]) => `<div style="width:30%;text-align:center"><div style="aspect-ratio:1">${art(p.kind, v, p.nfc, 'art art-white')}</div><div style="font-size:calc(var(--u)*2.8);font-weight:600;margin-top:calc(var(--u)*.8)">${label}</div></div>`).join('')}
        </div>
        ${foot(p)}`,
    },
    {
      file: '03-nasil-calisir',
      body: `
        <div class="kicker" style="font-size:calc(var(--u)*2.6)">Nasıl çalışır?</div>
        <h2 style="font-size:calc(var(--u)*7);margin-top:calc(var(--u)*2)">3 adımda<br>sesli hediye</h2>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:calc(var(--u)*2.6)">
          ${[
            ['QRNot hesabı aç', 'Ürün elinize ulaşınca qrnot.com\'da ücretsiz hesap açın.'],
            [p.nfc ? 'Okut ya da dokundur' : 'QR kodu okut', 'Sesini kaydet, video ya da fotoğraf yükle. QR artık senin hesabına bağlı.'],
            ['Hediye et', 'Alan kişi okutur, sesin uygulama indirmeden çalar.'],
          ]
            .map(([t, d], i) => `<div class="card" style="display:flex;gap:calc(var(--u)*3);align-items:center;padding:calc(var(--u)*3.4)"><div class="num">${i + 1}</div><div><div style="font-size:calc(var(--u)*3.8);font-weight:700">${t}</div><div class="muted" style="font-size:calc(var(--u)*2.8);margin-top:calc(var(--u)*.8);line-height:1.4">${d}</div></div></div>`)
            .join('')}
        </div>
        ${foot(p)}`,
    },
    {
      file: '04-okutunca',
      body: `
        <div class="kicker" style="font-size:calc(var(--u)*2.6)">${p.nfc ? 'Dokun, dinle' : 'Okut, dinle'}</div>
        <h2 style="font-size:calc(var(--u)*6.6);margin-top:calc(var(--u)*2)">Hediyeyi alan kişi<br>senin sesini duyar.</h2>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:calc(var(--u)*4);margin-top:calc(var(--u)*3)">
          <div style="position:relative;width:38%;aspect-ratio:1">${art(p.kind, p.mainVariant, p.nfc)}${nfcWaves}</div>
          <div class="phone" style="height:calc(var(--h)*0.48)"><div class="screen">
            <div style="font-size:calc(var(--u)*2);font-weight:600;color:var(--coral);letter-spacing:.14em">QRNOT</div>
            <div class="serif" style="font-size:calc(var(--u)*3.8);text-align:center">Annemden 💛</div>
            <div class="muted" style="font-size:calc(var(--u)*2)">Sesli mesaj · 0:24</div>
            <div class="wave">${WAVE}</div>
            <div style="width:calc(var(--u)*10);height:calc(var(--u)*10);border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-size:calc(var(--u)*4)">▶</div>
          </div></div>
        </div>
        <p class="muted" style="font-size:calc(var(--u)*2.8);text-align:center;margin-bottom:calc(var(--u)*5)">Uygulama yok · Pil yok · iPhone ve Android</p>
        ${foot(p)}`,
    },
    {
      file: '05-ozellikler',
      body: `
        <h2 style="font-size:calc(var(--u)*6.6)">${p.name}</h2>
        <div style="display:flex;gap:calc(var(--u)*4);align-items:center;flex:1">
          <div style="width:40%;aspect-ratio:1;flex-shrink:0">${art(p.kind, p.mainVariant, p.nfc)}</div>
          <div style="display:flex;flex-direction:column;gap:calc(var(--u)*2.2)">
            ${[...p.features, 'iPhone ve Android uyumlu', '3 içerik kaydı dahil']
              .map((f) => `<div style="display:flex;gap:calc(var(--u)*1.6);font-size:calc(var(--u)*3);line-height:1.35"><span class="check">✓</span><span>${f}</span></div>`)
              .join('')}
          </div>
        </div>
        ${
          p.nfc
            ? `<div class="card" style="padding:calc(var(--u)*2.6);font-size:calc(var(--u)*2.4);line-height:1.5;margin-bottom:calc(var(--u)*5)"><b>NFC uyumluluk:</b> iPhone XS ve sonrası, NFC'si açık Android telefonlar. NFC olmayan telefonlar QR'ı okutur.</div>`
            : `<div style="height:calc(var(--u)*5)"></div>`
        }
        ${foot(p)}`,
    },
    {
      file: '06-kullanim-alanlari',
      body: `
        <h2 style="font-size:calc(var(--u)*6.6)">Kimin için?</h2>
        <div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);align-content:center;gap:calc(var(--u)*2.4)">
          ${p.uses.map(([i, t]) => `<div class="card" style="padding:calc(var(--u)*3.2) calc(var(--u)*1.5);text-align:center"><div style="font-size:calc(var(--u)*7)">${i}</div><div style="font-size:calc(var(--u)*2.9);font-weight:600;margin-top:calc(var(--u)*1.2)">${t}</div></div>`).join('')}
        </div>
        <div class="card" style="padding:calc(var(--u)*2.8);display:flex;align-items:center;gap:calc(var(--u)*3);margin-bottom:calc(var(--u)*5)">
          <div class="qr" style="width:calc(var(--u)*13);flex-shrink:0">${qr('https://qrnot.com/?utm_source=marketplace&utm_medium=listing_image')}</div>
          <div style="font-size:calc(var(--u)*2.7);line-height:1.45"><b>Nasıl çalıştığını gör:</b><br><span class="muted">Bu kodu telefonunla okut — qrnot.com</span></div>
        </div>
        ${foot(p)}`,
    },
  ]
}

// --- Üret -------------------------------------------------------------------------------------
const SIZES = { trendyol: { w: 1200, h: 1800 }, hepsiburada: { w: 1500, h: 1500 } }
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((x) => existsSync(x))
if (!CHROME) throw new Error('Chrome / Edge bulunamadı')

const tmp = join(tmpdir(), 'qrnot-pazaryeri-html')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })
const only = process.argv[2]

for (const p of PRODUCTS) {
  if (only && !p.id.includes(only)) continue
  if (p.title.length > 100) throw new Error(`${p.id} başlık ${p.title.length} karakter (>100)`)
  for (const platform of ['trendyol', 'hepsiburada']) {
    const dir = join(HERE, platform, p.id)
    const imgDir = join(dir, 'gorseller')
    mkdirSync(imgDir, { recursive: true })
    writeFileSync(join(dir, 'baslik.txt'), p.title + '\n')
    writeFileSync(join(dir, 'aciklama.txt'), descriptionLines(p).join('\n') + '\n')
    writeFileSync(join(dir, 'aciklama.html'), descriptionHtml(p) + '\n')
    writeFileSync(join(dir, 'fiyat.txt'), `${price(p.sitePrice, platform)} TL\n`)
    writeFileSync(join(dir, 'urun-bilgileri.txt'), productInfo(p, platform) + '\n')

    const size = SIZES[platform]
    for (const img of images(p)) {
      const html = join(tmp, `${platform}-${p.id}-${img.file}.html`)
      writeFileSync(html, page(size, img.body, img.cls || ''))
      execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${size.w},${size.h}`, '--virtual-time-budget=8000', `--screenshot=${join(imgDir, `${img.file}.png`)}`, pathToFileURL(html).href], { stdio: 'ignore' })
    }
    console.log(`${platform}/${p.id}  ${price(p.sitePrice, platform)} TL  (${p.title.length} karakter başlık)`)
  }
}
