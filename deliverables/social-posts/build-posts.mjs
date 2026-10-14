// Sosyal medya görsellerini üretir: node deliverables/social-posts/build-posts.mjs
// Çıktı: deliverables/social-posts/png/*.png (Instagram 1080×1350, Story/TikTok 1080×1920, LinkedIn 1200×1200 / 1200×627)
// Ürün çizimleri src/components/warm/ProductArt.tsx ile aynıdır; QR kodları gerçektir (qrnot.com'a gider).
// Fiyatlar src/lib/commerce/catalog.ts ile aynı tutulmalıdır.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
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

// --- ProductArt'ı sunucu tarafında SVG'ye çevir ---------------------------------------------
const artSource = readFileSync(join(ROOT, 'src/components/warm/ProductArt.tsx'), 'utf8')
const artJs = ts.transpileModule(artSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText
const artModule = { exports: {} }
new Function('require', 'module', 'exports', artJs)(require, artModule, artModule.exports)
const ProductArt = artModule.exports.default

const art = (kind, variant, nfc = false) =>
  renderToStaticMarkup(React.createElement(ProductArt, { kind, variant, nfc, className: 'art' }))
const qr = (url, fg = '#1f2440') =>
  renderToStaticMarkup(React.createElement(QRCodeSVG, { value: url, size: 512, level: 'M', marginSize: 0, fgColor: fg, bgColor: 'transparent' }))
const link = (source, campaign) => `https://qrnot.com/shop?utm_source=${source}&utm_medium=social&utm_campaign=${campaign}`

// --- Ortak tasarım ---------------------------------------------------------------------------
const CSS = `
  :root { --cream:#fff8f3; --cream2:#fdeee4; --ink:#1f2440; --ink2:#4a4f6a; --coral:#e8505b; --coral-soft:#fde4e3; --gold:#c9963a; --sage:#3f8f6b; --pink:#ff1f8f; --line:#efe1d6; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: var(--w); height: var(--h); overflow: hidden; }
  body { font-family: Geist, system-ui, sans-serif; color: var(--ink); background: var(--cream); -webkit-font-smoothing: antialiased; }
  .canvas { position: relative; width: var(--w); height: var(--h); overflow: hidden; display: flex; flex-direction: column; padding: var(--pad); }
  .glow { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .55; pointer-events: none; }
  h1, h2, .serif { font-family: Fraunces, Georgia, serif; font-weight: 600; letter-spacing: -0.02em; line-height: 1.02; }
  .kicker { font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--coral); }
  .muted { color: var(--ink2); }
  .brand { position: relative; z-index: 1; display: flex; align-items: center; gap: 14px; font-weight: 600; }
  .brand .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--coral); box-shadow: 0 0 0 6px var(--coral-soft); }
  .art { width: 100%; height: 100%; display: block; }
  .card { background: #fff; border: 2px solid var(--line); border-radius: 36px; }
  .qrbox { background: #fff; border-radius: 28px; padding: 22px; box-shadow: 0 18px 40px rgba(31,36,64,.10); }
  .qrbox svg { display: block; width: 100%; height: auto; }
  .pill { display: inline-flex; align-items: center; gap: 10px; border-radius: 999px; padding: 14px 26px; font-weight: 600; }
  .pill.dark { background: var(--ink); color: #fff; }
  .pill.light { background: #fff; border: 2px solid var(--line); }
  .footer { margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
  .step-num { width: 84px; height: 84px; border-radius: 50%; background: var(--coral); color: #fff; display: grid; place-items: center; font-size: 42px; font-weight: 700; }
  .phone { width: 100%; aspect-ratio: 9/18.5; border-radius: 64px; background: #11131f; padding: 18px; box-shadow: 0 30px 60px rgba(31,36,64,.25); }
  .screen { width: 100%; height: 100%; border-radius: 48px; background: var(--cream); overflow: hidden; display: flex; flex-direction: column; align-items: center; padding: 64px 34px 34px; gap: 22px; }
  .wave { display: flex; align-items: center; gap: 7px; height: 90px; }
  .wave i { display: block; width: 9px; border-radius: 9px; background: var(--coral); }
  .check { color: var(--sage); font-weight: 700; }
`

const WAVE = [30, 55, 80, 45, 70, 90, 50, 65, 35, 75, 55, 40, 85, 60, 30, 50, 70, 45].map((h) => `<i style="height:${h}%"></i>`).join('')

function phoneScreen({ title = 'Annemden 💛', sub = 'Sesli mesaj · 0:24', button = '▶', recording = false }) {
  return `<div class="phone"><div class="screen">
    <div style="font-size:26px;font-weight:600;color:var(--coral);letter-spacing:.12em">QRNOT</div>
    <div class="serif" style="font-size:46px;text-align:center">${title}</div>
    <div class="muted" style="font-size:26px">${sub}</div>
    <div class="wave">${WAVE}</div>
    <div style="width:130px;height:130px;border-radius:50%;background:${recording ? 'var(--coral)' : 'var(--ink)'};color:#fff;display:grid;place-items:center;font-size:52px;margin-top:10px">${button}</div>
  </div></div>`
}

function page({ w, h, pad, body }) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>:root{--w:${w}px;--h:${h}px;--pad:${pad}px}${CSS}</style></head>
<body><div class="canvas">${body}</div></body></html>`
}

const brand = (size = 30) => `<div class="brand" style="font-size:${size}px"><span class="dot"></span>QRNot</div>`


// --- Anı defteri yardımcıları ---
const tableCardTR = (names, width = 460) => `
  <div style="width:${width}px;background:#fff;border-radius:18px;box-shadow:0 26px 54px rgba(31,36,64,.16);padding:${width * 0.1}px ${width * 0.08}px;text-align:center">
    <div style="font-size:${width * 0.042}px;letter-spacing:.18em;color:var(--gold);font-weight:600">BİZE BİR ANI BIRAKIN</div>
    <div class="serif" style="font-size:${width * 0.1}px;margin-top:${width * 0.04}px">${names}</div>
    <div class="qrbox" style="width:${width * 0.52}px;margin:${width * 0.06}px auto;padding:0;box-shadow:none">${qr(link('instagram', 'ani-defteri'))}</div>
    <div style="font-size:${width * 0.048}px;color:var(--ink2);line-height:1.4">Telefon kameranla okut<br>🎙️ ses · 🎬 video · 📷 fotoğraf</div>
  </div>`

const guestFormScreen = () => `<div class="phone"><div class="screen">
    <div style="font-size:26px;font-weight:600;color:var(--gold);letter-spacing:.12em">ANI DEFTERİ</div>
    <div class="serif" style="font-size:44px;text-align:center">Ayşe & Mehmet</div>
    <div class="muted" style="font-size:24px">Bize bir anı bırakın 💛</div>
    <div style="width:100%;display:flex;flex-direction:column;gap:14px;margin-top:6px">
      <div style="background:#fff;border:2px solid var(--line);border-radius:18px;padding:18px 20px;font-size:24px;color:var(--ink2)">Adın</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${['🎙️ Ses', '🎬 Video', '🖼️ Fotoğraf', '✍️ Not'].map((t) => `<div style="background:#fff;border:2px solid var(--line);border-radius:18px;padding:18px;font-size:24px;font-weight:600;text-align:center">${t}</div>`).join('')}</div>
      <div style="background:var(--coral);color:#fff;border-radius:999px;padding:20px;font-size:28px;font-weight:700;text-align:center">Anıyı gönder</div>
    </div>
  </div></div>`

const approvalScreen = () => `<div class="phone"><div class="screen" style="padding-top:56px;gap:16px">
    <div style="font-size:26px;font-weight:600;color:var(--gold);letter-spacing:.12em">YÖNETİM</div>
    <div class="serif" style="font-size:40px;text-align:center">Gelen anılar</div>
    ${[
      ['Zeynep', '🎙️ Sesli mesaj · 0:42', 'Onay bekliyor'],
      ['Can', '🎬 Video · 0:31', 'Onaylandı'],
      ['Elif teyze', '✍️ Not', 'Onaylandı'],
    ]
      .map(
        ([n, t, st]) => `<div style="width:100%;background:#fff;border:2px solid var(--line);border-radius:18px;padding:16px 18px;text-align:left">
          <div style="font-size:26px;font-weight:700">${n}</div><div class="muted" style="font-size:22px;margin-top:4px">${t}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span style="font-size:20px;font-weight:600;color:${st === 'Onaylandı' ? 'var(--sage)' : 'var(--gold)'}">${st}</span><span style="font-size:20px;font-weight:600">⬇ İndir</span></div>
        </div>`
      )
      .join('')}
  </div></div>`

// --- Postlar ---------------------------------------------------------------------------------
const IG = { w: 1080, h: 1350, pad: 80 }
const ST = { w: 1080, h: 1920, pad: 90 }
const LI_SQ = { w: 1200, h: 1200, pad: 90 }
const LI_WIDE = { w: 1200, h: 627, pad: 64 }

const PRODUCTS = [
  ['necklace', 'neon-pink', false, 'Sesli Anı Kolyesi', 449],
  ['necklace', 'neon-orange', true, 'NFC + QR Kolye', 599],
  ['keychain', 'neon-blue', false, 'Sesli Anahtarlık', 349],
  ['keychain', 'neon-green', true, 'NFC + QR Anahtarlık', 499],
  ['guestbook', 'gold', false, 'Dijital Anı Defteri', 499],
  ['digital', 'neon-yellow', false, 'Dijital QR Hakkı', 249],
]

const posts = [
  {
    file: 'ig-01-tanitim',
    ...IG,
    body: `
      <div class="glow" style="width:700px;height:700px;background:#ffb3d9;right:-200px;top:-150px"></div>
      ${brand()}
      <div style="margin-top:70px;position:relative">
        <div class="kicker" style="font-size:26px">Sesli Anı Kolyesi</div>
        <h1 style="font-size:118px;margin-top:22px">Hediyene<br>bir <span style="color:var(--coral)">ses</span> ver.</h1>
        <p class="muted" style="font-size:34px;margin-top:30px;max-width:640px;line-height:1.4">Arkasındaki QR'ı okutan kişi senin sesini duyar, videonu izler.</p>
      </div>
      <div style="position:absolute;right:40px;top:600px;width:420px;height:420px">${art('necklace', 'neon-pink')}</div>
      <div class="footer">
        <div style="display:flex;flex-direction:column;gap:16px">
          <span class="pill dark" style="font-size:28px">Uygulama yok · Pil yok</span>
          <span class="muted" style="font-size:28px;font-weight:600">qrnot.com</span>
        </div>
        <div style="text-align:center"><div class="qrbox" style="width:200px">${qr(link('instagram', 'tanitim'))}</div><div class="muted" style="font-size:22px;margin-top:10px">Okut, incele</div></div>
      </div>`,
  },
  {
    file: 'ig-02-carousel-kapak',
    ...IG,
    body: `
      <div class="glow" style="width:800px;height:800px;background:#fde4e3;left:-250px;bottom:-250px"></div>
      ${brand()}
      <div style="margin:auto 0;position:relative">
        <div class="kicker" style="font-size:28px">Nasıl çalışır?</div>
        <h1 style="font-size:150px;margin-top:26px">4 adımda<br>sesli<br>hediye</h1>
      </div>
      <div class="footer"><span class="muted" style="font-size:30px">qrnot.com</span><span class="pill dark" style="font-size:32px">Kaydır →</span></div>`,
  },
  {
    file: 'ig-03-carousel-1-satin-al',
    ...IG,
    body: `
      ${brand()}
      <div style="display:flex;gap:26px;align-items:center;margin-top:60px"><div class="step-num">1</div><h2 style="font-size:84px">Satın al</h2></div>
      <p class="muted" style="font-size:34px;margin-top:26px;line-height:1.4">Kolye, anahtarlık ya da düğünün için dijital anı defteri.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:56px">
        <div class="card" style="padding:18px;aspect-ratio:1">${art('necklace', 'neon-pink')}</div>
        <div class="card" style="padding:18px;aspect-ratio:1">${art('keychain', 'neon-blue', true)}</div>
      </div>
      <div class="footer"><span class="muted" style="font-size:28px">qrnot.com</span><span class="muted" style="font-size:28px">1 / 4</span></div>`,
  },
  {
    file: 'ig-04-carousel-2-kur',
    ...IG,
    body: `
      ${brand()}
      <div style="display:flex;gap:56px;margin-top:60px;flex:1">
        <div style="flex:1">
          <div style="display:flex;gap:26px;align-items:center"><div class="step-num">2</div></div>
          <h2 style="font-size:84px;margin-top:30px">Hesabınla<br>kur</h2>
          <p class="muted" style="font-size:34px;margin-top:30px;line-height:1.4">QR'ı okut, sesini kaydet ya da video yükle.</p>
          <p style="font-size:32px;margin-top:30px;line-height:1.4;font-weight:600">QR artık senin hesabına bağlı — başkası değiştiremez.</p>
        </div>
        <div style="width:400px;padding-top:20px">${phoneScreen({ title: 'Kayıt', sub: 'Sesini kaydet', button: '●', recording: true })}</div>
      </div>
      <div class="footer"><span class="muted" style="font-size:28px">qrnot.com</span><span class="muted" style="font-size:28px">2 / 4</span></div>`,
  },
  {
    file: 'ig-05-carousel-3-hediye-et',
    ...IG,
    body: `
      ${brand()}
      <div style="display:flex;gap:56px;margin-top:60px;flex:1">
        <div style="flex:1">
          <div class="step-num">3</div>
          <h2 style="font-size:84px;margin-top:30px">Hediye et</h2>
          <p class="muted" style="font-size:34px;margin-top:30px;line-height:1.4">Kutuyu açar, okutur ya da telefonunu dokundurur.</p>
          <p style="font-size:32px;margin-top:30px;line-height:1.4;font-weight:600">Senin sesin, uygulama indirmeden çalar.</p>
        </div>
        <div style="width:400px;padding-top:20px">${phoneScreen({})}</div>
      </div>
      <div class="footer"><span class="muted" style="font-size:28px">qrnot.com</span><span class="muted" style="font-size:28px">3 / 4</span></div>`,
  },
  {
    file: 'ig-06-carousel-4-guncelle',
    ...IG,
    body: `
      <div class="glow" style="width:700px;height:700px;background:#e1f2e9;right:-200px;bottom:-200px"></div>
      ${brand()}
      <div style="display:flex;gap:26px;align-items:center;margin-top:60px"><div class="step-num">4</div></div>
      <h2 style="font-size:84px;margin-top:30px;position:relative">Sonradan<br>güncelle</h2>
      <p class="muted" style="font-size:34px;margin-top:30px;line-height:1.4;position:relative;max-width:820px">QR ve NFC çip hiç değişmez. Yıl dönümünde yeni bir mesaj eklemek için hediyeyi geri istemene gerek yok. 3 içerik kaydı dahil.</p>
      <div class="footer" style="position:relative">
        <div style="display:flex;flex-direction:column;gap:14px"><span class="pill dark" style="font-size:30px">qrnot.com</span><span class="muted" style="font-size:26px">Linkte: tüm ürünler</span></div>
        <div class="qrbox" style="width:210px">${qr(link('instagram', 'nasil-calisir'))}</div>
      </div>`,
  },
  {
    file: 'ig-07-nfc',
    ...IG,
    body: `
      <div style="position:absolute;inset:0;background:#1f2440"></div>
      <div class="glow" style="width:800px;height:800px;background:#ff6a3d;opacity:.35;right:-260px;top:120px"></div>
      <div class="brand" style="font-size:30px;color:#fff;position:relative"><span class="dot"></span>QRNot</div>
      <div style="position:relative;margin-top:70px;color:#fff">
        <div class="kicker" style="font-size:26px;color:#ffb26b">NFC + QR</div>
        <h1 style="font-size:150px;margin-top:20px">Dokun.<br>Dinle.</h1>
        <p style="font-size:34px;margin-top:30px;line-height:1.4;color:#c9cbe0;max-width:480px">Kamerayı açmana bile gerek yok. Telefonu kolyeye yaklaştır, ses çalsın.</p>
      </div>
      <div style="position:absolute;right:40px;bottom:170px;width:430px;height:430px;border-radius:40px;overflow:hidden">${art('necklace', 'neon-orange', true)}</div>
      <div class="footer" style="position:relative;color:#c9cbe0;font-size:24px">
        <span>iPhone XS ve sonrası · NFC'si açık Android<br>NFC olmayan telefonlar için QR yedekte</span>
        <span style="color:#fff;font-weight:600;font-size:28px">qrnot.com</span>
      </div>`,
  },
  {
    file: 'ig-08-ani-defteri',
    ...IG,
    body: `
      <div class="glow" style="width:700px;height:700px;background:#f8ecd4;left:-200px;top:-200px"></div>
      ${brand()}
      <div style="position:relative;margin-top:60px">
        <div class="kicker" style="font-size:26px;color:var(--gold)">Dijital Anı Defteri</div>
        <h1 style="font-size:100px;margin-top:20px">Düğününüzün<br>sesi, yıllar<br>sonra da sizinle.</h1>
      </div>
      <div style="display:flex;gap:40px;align-items:center;margin-top:50px;position:relative">
        <div class="card" style="width:400px;height:400px;padding:14px;flex-shrink:0">${art('guestbook', 'gold')}</div>
        <ul style="list-style:none;font-size:30px;line-height:1.55;display:flex;flex-direction:column;gap:12px">
          <li><span class="check">✓</span> Masalara tek bir QR kart</li>
          <li><span class="check">✓</span> Sesli mesaj, video, fotoğraf</li>
          <li><span class="check">✓</span> Siz onaylarsınız, siz saklarsınız</li>
          <li><span class="check">✓</span> Uygulama gerekmez</li>
        </ul>
      </div>
      <div class="footer"><span class="muted" style="font-size:28px;font-weight:600">qrnot.com/guestbook</span><span class="pill dark" style="font-size:28px">499 TL</span></div>`,
  },
  {
    file: 'ig-09-urunler',
    ...IG,
    body: `
      ${brand()}
      <h2 style="font-size:78px;margin-top:40px">Hangisi senin<br>hikâyen?</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:44px">
        ${PRODUCTS.map(([k, v, n, name, price]) => `<div class="card" style="padding:14px 14px 18px"><div style="aspect-ratio:1">${art(k, v, n)}</div><div style="font-size:22px;font-weight:600;margin-top:10px;line-height:1.2">${name}</div><div style="font-size:24px;color:var(--coral);font-weight:700;margin-top:4px">${price} TL</div></div>`).join('')}
      </div>
      <div class="footer"><span class="muted" style="font-size:26px">Kargo alıcı ödemeli · 1–3 iş gününde kargoda</span><span style="font-size:28px;font-weight:600">qrnot.com/shop</span></div>`,
  },


  // --- Anı defteri carousel (Instagram) ---
  {
    file: 'ig-10-ani-defteri-kapak',
    ...IG,
    body: `
      <div class="glow" style="width:900px;height:900px;background:#f8ecd4;opacity:.95;right:-250px;top:-200px"></div>
      ${brand()}
      <div style="position:relative;margin-top:60px">
        <div class="kicker" style="font-size:26px;color:var(--gold)">Dijital Anı Defteri</div>
        <h1 style="font-size:104px;margin-top:20px">İmza değil,<br>ses toplayın.</h1>
        <p class="muted" style="font-size:32px;margin-top:26px;line-height:1.4;max-width:560px">Düğününüzde misafirler telefonlarından sesli mesaj, video ve fotoğraf bıraksın.</p>
      </div>
      <div style="position:absolute;right:70px;bottom:150px;transform:rotate(4deg)">${tableCardTR('Ayşe & Mehmet', 420)}</div>
      <div class="footer" style="position:relative"><span class="pill dark" style="font-size:30px">Nasıl çalışır? Kaydır →</span></div>`,
  },
  {
    file: 'ig-11-ani-defteri-1-kur',
    ...IG,
    body: `
      ${brand()}
      <div style="display:flex;gap:26px;align-items:center;margin-top:60px"><div class="step-num" style="background:var(--gold)">1</div><h2 style="font-size:80px">Dakikalar içinde kur</h2></div>
      <p class="muted" style="font-size:34px;margin-top:30px;line-height:1.4">Hesabınla giriş yap, etkinliğinin adını ve hoş geldin mesajını yaz.</p>
      <div style="display:flex;flex-direction:column;gap:22px;margin-top:50px">
        ${[
          ['Etkinlik adı', 'Ayşe & Mehmet · 14 Haziran'],
          ['Onay (moderasyon)', 'Anılar sen onaylayınca görünür'],
          ['PIN (isteğe bağlı)', 'Sadece davetliler anı bırakabilir'],
        ]
          .map(([t, d]) => `<div class="card" style="padding:28px 32px"><div class="muted" style="font-size:24px">${t}</div><div style="font-size:34px;font-weight:600;margin-top:6px">${d}</div></div>`)
          .join('')}
      </div>
      <div class="footer"><span class="muted" style="font-size:28px">qrnot.com</span><span class="muted" style="font-size:28px">1 / 4</span></div>`,
  },
  {
    file: 'ig-12-ani-defteri-2-masa-karti',
    ...IG,
    body: `
      ${brand()}
      <div style="display:flex;gap:26px;align-items:center;margin-top:60px"><div class="step-num" style="background:var(--gold)">2</div><h2 style="font-size:80px">Masa kartlarını bas</h2></div>
      <p class="muted" style="font-size:34px;margin-top:30px;line-height:1.4">İsimlerinizle hazır şablon. Masa sayısı kadar yazdır.</p>
      <div style="display:flex;justify-content:center;gap:30px;margin-top:70px">
        <div style="transform:rotate(-4deg)">${tableCardTR('Ayşe & Mehmet', 400)}</div>
        <div style="transform:rotate(4deg);margin-top:40px">${tableCardTR('Ayşe & Mehmet', 400)}</div>
      </div>
      <div class="footer"><span class="muted" style="font-size:28px">qrnot.com</span><span class="muted" style="font-size:28px">2 / 4</span></div>`,
  },
  {
    file: 'ig-13-ani-defteri-3-misafir',
    ...IG,
    body: `
      ${brand()}
      <div style="display:flex;gap:56px;margin-top:60px;flex:1">
        <div style="flex:1">
          <div class="step-num" style="background:var(--gold)">3</div>
          <h2 style="font-size:80px;margin-top:30px">Misafirler<br>okutup<br>anı bırakır</h2>
          <p class="muted" style="font-size:32px;margin-top:30px;line-height:1.4">Uygulama yok, sıra yok. Herkes kendi telefonundan aynı anda kaydeder.</p>
          <p style="font-size:30px;margin-top:26px;line-height:1.4;font-weight:600">Her misafir bir kez yazar.</p>
        </div>
        <div style="width:400px;padding-top:20px">${guestFormScreen()}</div>
      </div>
      <div class="footer"><span class="muted" style="font-size:28px">qrnot.com</span><span class="muted" style="font-size:28px">3 / 4</span></div>`,
  },
  {
    file: 'ig-14-ani-defteri-4-sakla',
    ...IG,
    body: `
      ${brand()}
      <div style="display:flex;gap:56px;margin-top:60px;flex:1">
        <div style="flex:1">
          <div class="step-num" style="background:var(--gold)">4</div>
          <h2 style="font-size:80px;margin-top:30px">Onayla,<br>sakla,<br>indir</h2>
          <p class="muted" style="font-size:32px;margin-top:30px;line-height:1.4">Gelen her anıyı sen onaylarsın. İstediğin zaman dinler, dilediğini indirirsin.</p>
          <p style="font-size:30px;margin-top:26px;line-height:1.4;font-weight:600">300 anıya kadar · 499 TL</p>
        </div>
        <div style="width:400px;padding-top:20px">${approvalScreen()}</div>
      </div>
      <div class="footer"><span class="pill dark" style="font-size:28px">qrnot.com/guestbook</span><span class="muted" style="font-size:28px">4 / 4</span></div>`,
  },

  // --- Story / TikTok 9:16 ---
  {
    file: 'st-01-tiktok-kapak-pov',
    ...ST,
    body: `
      <div style="position:absolute;inset:0;background:#1f2440"></div>
      <div class="glow" style="width:900px;height:900px;background:#ff1f8f;opacity:.35;left:-200px;top:500px"></div>
      <div class="brand" style="font-size:34px;color:#fff;position:relative"><span class="dot"></span>QRNot</div>
      <h1 style="position:relative;color:#fff;font-size:130px;margin-top:140px">POV:<br>hediyenin<br>içinde bir<br><span style="color:#ff8fca">ses</span> var.</h1>
      <div style="position:relative;width:640px;height:640px;margin:80px auto 0;border-radius:48px;overflow:hidden">${art('necklace', 'neon-pink')}</div>
      <div class="footer" style="position:relative;color:#c9cbe0;font-size:32px"><span>qrnot.com</span><span>🔊 sesi aç</span></div>`,
  },
  {
    file: 'st-02-tiktok-kapak-kurulum',
    ...ST,
    body: `
      <div class="glow" style="width:900px;height:900px;background:#fde4e3;right:-300px;top:-200px"></div>
      ${brand(34)}
      <h1 style="position:relative;font-size:124px;margin-top:110px">15 saniyede<br><span style="color:var(--coral)">sesli hediye</span></h1>
      <div style="width:560px;margin:90px auto 0;position:relative">${phoneScreen({ title: 'Kayıt', sub: 'Sesini kaydet', button: '●', recording: true })}</div>
      <div class="footer" style="font-size:32px"><span class="muted">qrnot.com</span><span class="pill dark">Nasıl? 👇</span></div>`,
  },
  {
    file: 'st-03-story-urunler',
    ...ST,
    body: `
      ${brand(34)}
      <h1 style="font-size:104px;margin-top:70px">Sesini<br>hediye et.</h1>
      <p class="muted" style="font-size:36px;margin-top:30px;line-height:1.4">Ses, video ve fotoğraf — kolyede, anahtarlıkta, düğününde. Uygulama gerekmez.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:70px">
        ${PRODUCTS.map(([k, v, n, name, price]) => `<div class="card" style="padding:16px 16px 22px"><div style="aspect-ratio:1">${art(k, v, n)}</div><div style="font-size:24px;font-weight:600;margin-top:12px;line-height:1.2">${name}</div><div style="font-size:27px;color:var(--coral);font-weight:700;margin-top:4px">${price} TL</div></div>`).join('')}
      </div>
      <div class="footer" style="align-items:center">
        <div><div style="font-size:36px;font-weight:700">qrnot.com/shop</div><div class="muted" style="font-size:26px;margin-top:8px">Kargo alıcı ödemeli</div></div>
        <div class="qrbox" style="width:220px">${qr(link('instagram_story', 'urunler'))}</div>
      </div>`,
  },


  {
    file: 'st-04-story-ani-defteri',
    ...ST,
    body: `
      <div class="glow" style="width:1000px;height:1000px;background:#f8ecd4;opacity:.95;left:-300px;top:-200px"></div>
      ${brand(34)}
      <div style="position:relative;margin-top:80px">
        <div class="kicker" style="font-size:30px;color:var(--gold)">Dijital Anı Defteri</div>
        <h1 style="font-size:112px;margin-top:20px">Düğününüzün<br>sesi hep<br>sizinle.</h1>
      </div>
      <div style="display:flex;justify-content:center;margin-top:70px;position:relative">${tableCardTR('Ayşe & Mehmet', 560)}</div>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:60px;font-size:34px;position:relative">
        <div><span class="check">✓</span> Sesli mesaj, video, fotoğraf</div>
        <div><span class="check">✓</span> Siz onaylarsınız · 300 anıya kadar</div>
      </div>
      <div class="footer" style="font-size:34px;position:relative"><span style="font-weight:700">qrnot.com/guestbook</span><span class="pill dark">499 TL</span></div>`,
  },
  {
    file: 'st-05-tiktok-kapak-ani-defteri',
    ...ST,
    body: `
      <div style="position:absolute;inset:0;background:#1f2440"></div>
      <div class="glow" style="width:1000px;height:1000px;background:#c9963a;opacity:.35;right:-300px;top:700px"></div>
      <div class="brand" style="font-size:34px;color:#fff;position:relative"><span class="dot"></span>QRNot</div>
      <h1 style="position:relative;color:#fff;font-size:116px;margin-top:120px">POV:<br>düğünden sonra<br>misafirlerin<br><span style="color:#f3d48a">sesini</span> dinliyorsunuz.</h1>
      <div style="position:relative;display:flex;justify-content:center;margin-top:90px">${tableCardTR('Ayşe & Mehmet', 520)}</div>
      <div class="footer" style="position:relative;color:#c9cbe0;font-size:32px"><span>qrnot.com</span><span>🔊 sesi aç</span></div>`,
  },

  // --- LinkedIn ---
  {
    file: 'li-01-kurumsal',
    ...LI_SQ,
    body: `
      ${brand()}
      <div class="kicker" style="font-size:24px;margin-top:50px">Kurumsal</div>
      <h1 style="font-size:84px;margin-top:16px">İşletmeler için<br>QR çözümleri</h1>
      <p class="muted" style="font-size:30px;margin-top:22px;line-height:1.4;max-width:900px">Sektörüne özel panel: QR'ları toplu üret, içeriği tek yerden güncelle, talepleri canlı izle.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:44px">
        ${[
          ['🏨', 'Otel', 'Oda servisi · temizlik · teknik talep'],
          ['🎓', 'Eğitim', 'QR yoklama · ders materyali'],
          ['🏥', 'Sağlık', 'İlaç ve cihaz talimatı'],
          ['🏭', 'Fabrika', 'Kullanım kılavuzu · bakım · iş güvenliği'],
          ['🛍️', 'Perakende', 'Ürün hikâyesi · fiyat kontrolü'],
          ['🚚', 'Lojistik', 'Teslimat kanıtı · soğuk zincir'],
        ]
          .map(([i, n, d]) => `<div class="card" style="padding:24px"><div style="font-size:44px">${i}</div><div style="font-size:30px;font-weight:700;margin-top:8px">${n}</div><div class="muted" style="font-size:22px;margin-top:6px;line-height:1.35">${d}</div></div>`)
          .join('')}
      </div>
      <div class="footer"><span class="muted" style="font-size:26px">qrnot.com/#kurumsal</span><span class="pill dark" style="font-size:26px">Teklif al →</span></div>`,
  },
  {
    file: 'li-02-fabrika-kilavuz',
    ...LI_WIDE,
    body: `
      <div style="display:flex;gap:56px;height:100%;align-items:center">
        <div style="flex:1">
          ${brand(26)}
          <div class="kicker" style="font-size:20px;margin-top:34px">Fabrika & üretim</div>
          <h1 style="font-size:66px;margin-top:14px">Kullanım kılavuzu,<br>makinenin üzerinde.</h1>
          <p class="muted" style="font-size:24px;margin-top:20px;line-height:1.45;max-width:600px">Makineye ya da ürettiğin ürüne bir QR: montaj videosu, kılavuz bağlantısı, bakım talebi ve iş güvenliği akışı tek okutmada.</p>
          <div style="font-size:22px;font-weight:600;margin-top:26px">qrnot.com</div>
        </div>
        <div style="width:360px;height:440px;border-radius:32px;background:#1f2440;padding:30px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 20px 40px rgba(31,36,64,.25)">
          <div style="color:#c9cbe0;font-size:20px;letter-spacing:.14em;font-weight:600">MAKİNE · CNC-04</div>
          <div class="qrbox" style="width:230px;margin:0 auto;padding:18px">${qr(link('linkedin', 'fabrika'))}</div>
          <div style="color:#fff;font-size:22px;font-weight:600;text-align:center">Okut → Kılavuz · Bakım · Güvenlik</div>
        </div>
      </div>`,
  },
  {
    file: 'li-03-guven',
    ...LI_SQ,
    body: `
      ${brand()}
      <h1 style="font-size:78px;margin-top:60px">Duygusal bir ürün,<br>ancak güvenilir<br>olduğunda değerli.</h1>
      <div style="display:flex;flex-direction:column;gap:22px;margin-top:56px">
        ${[
          ['Hesaba bağlı', 'Her QR, satın alan üyenin hesabına kilitlenir; başkası sahiplenemez.'],
          ['Doğrulanmış sipariş', 'Pazaryeri siparişleri doğrulanmadan dijital ürün aktive edilmez.'],
          ['Kilitli NFC', 'Çip QR sayfasına programlanır ve kilitlenir; yeniden yazılamaz.'],
          ['Kontrollü anı defteri', 'Ev sahibi onayı, PIN koruması; her misafir bir kez yazar.'],
        ]
          .map(([t, d]) => `<div class="card" style="padding:26px 30px;display:flex;gap:22px;align-items:flex-start"><span class="check" style="font-size:36px;line-height:1">✓</span><div><div style="font-size:30px;font-weight:700">${t}</div><div class="muted" style="font-size:24px;margin-top:6px;line-height:1.4">${d}</div></div></div>`)
          .join('')}
      </div>
      <div class="footer"><span class="muted" style="font-size:26px">qrnot.com</span></div>`,
  },

  {
    file: 'li-04-organizatorler',
    ...LI_SQ,
    body: `
      ${brand()}
      <div class="kicker" style="font-size:24px;margin-top:50px;color:var(--gold)">Düğün & etkinlik organizatörleri için</div>
      <h1 style="font-size:76px;margin-top:16px">Paketinize<br>dijital anı defteri ekleyin.</h1>
      <div style="display:flex;gap:50px;align-items:center;margin-top:50px">
        <div style="flex:1;display:flex;flex-direction:column;gap:20px;font-size:28px;line-height:1.35">
          <div><span class="check">✓</span> Kiralık telefon, kurulum ekibi, iade yok</div>
          <div><span class="check">✓</span> Misafirler aynı anda, kendi telefonundan kaydeder</div>
          <div><span class="check">✓</span> Çiftin onayı, PIN koruması, indirilebilir anılar</div>
          <div><span class="check">✓</span> İsimli masa kartları hazır şablon</div>
          <div><span class="check">✓</span> Toplu alımda kurumsal fiyat</div>
        </div>
        <div style="transform:rotate(3deg)">${tableCardTR('Ayşe & Mehmet', 360)}</div>
      </div>
      <div class="footer"><span class="muted" style="font-size:26px">qrnot.com/guestbook</span><span class="pill dark" style="font-size:26px">Teklif al →</span></div>`,
  },
]

// --- Üret ------------------------------------------------------------------------------------
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => existsSync(p))
if (!CHROME) throw new Error('Chrome / Edge bulunamadı')

const outDir = join(HERE, 'png')
const htmlDir = join(tmpdir(), 'qrnot-social-html')
rmSync(htmlDir, { recursive: true, force: true })
mkdirSync(htmlDir, { recursive: true })
mkdirSync(outDir, { recursive: true })

const only = process.argv[2]
for (const post of posts) {
  if (only && !post.file.includes(only)) continue
  const htmlPath = join(htmlDir, `${post.file}.html`)
  writeFileSync(htmlPath, page(post))
  const pngPath = join(outDir, `${post.file}.png`)
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${post.w},${post.h}`,
    '--virtual-time-budget=8000',
    `--screenshot=${pngPath}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: 'ignore' })
  console.log(`${post.file}.png  ${post.w}×${post.h}`)
}
