// Etsy dijital ürün ilanlarının görsellerini ve alıcı PDF'lerini üretir:
//   node deliverables/etsy/build-etsy.mjs            (hepsi)
//   node deliverables/etsy/build-etsy.mjs guestbook  (adı eşleşenler)
// Çıktı: deliverables/etsy/listings/<ilan>/images/*.png (2000×1500, 4:3) ve deliverables/etsy/listings/<ilan>/download/*.pdf
// Ürün çizimleri src/components/warm/ProductArt.tsx ile aynıdır; QR kodlar gerçektir.

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

const art = (kind, variant, nfc = false) => renderToStaticMarkup(React.createElement(ProductArt, { kind, variant, nfc, className: 'art' }))
const qr = (url, fg = '#1f2440') =>
  renderToStaticMarkup(React.createElement(QRCodeSVG, { value: url, size: 512, level: 'M', marginSize: 0, fgColor: fg, bgColor: 'transparent' }))

// Görsellerdeki örnek QR'lar QRNot ana sayfasına gider (alıcıya özel QR, satın alma sonrası oluşur).
const DEMO_QR = 'https://qrnot.com/?utm_source=etsy&utm_medium=listing_image'
const ETSY_QR = 'https://qrnot.com/etsy?utm_source=etsy&utm_medium=download_pdf'

const CSS = `
  :root { --cream:#fff8f3; --cream2:#fdeee4; --ink:#1f2440; --ink2:#4a4f6a; --coral:#e8505b; --coral-soft:#fde4e3; --gold:#c9963a; --gold-soft:#f8ecd4; --sage:#3f8f6b; --sage-soft:#e1f2e9; --line:#efe1d6; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Geist, system-ui, sans-serif; color: var(--ink); background: var(--cream); -webkit-font-smoothing: antialiased; }
  .canvas { position: relative; width: var(--w); height: var(--h); overflow: hidden; padding: var(--pad); display: flex; flex-direction: column; justify-content: center; }
  .glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .55; pointer-events: none; }
  h1, h2, .serif { font-family: Fraunces, Georgia, serif; font-weight: 600; letter-spacing: -0.02em; line-height: 1.03; }
  .kicker { font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--coral); }
  .muted { color: var(--ink2); }
  .art { width: 100%; height: 100%; display: block; }
  .card { background: #fff; border: 3px solid var(--line); border-radius: 44px; }
  .qrbox { background: #fff; border-radius: 30px; padding: 26px; box-shadow: 0 20px 50px rgba(31,36,64,.12); }
  .qrbox svg, .qr svg { display: block; width: 100%; height: auto; }
  .pill { display: inline-flex; align-items: center; gap: 12px; border-radius: 999px; padding: 18px 34px; font-weight: 600; }
  .pill.dark { background: var(--ink); color: #fff; }
  .pill.light { background: #fff; border: 3px solid var(--line); }
  .row { display: flex; gap: 60px; align-items: center; }
  .check { color: var(--sage); font-weight: 700; }
  .num { width: 110px; height: 110px; border-radius: 50%; background: var(--coral); color: #fff; display: grid; place-items: center; font-size: 56px; font-weight: 700; flex-shrink: 0; }
  .phone { width: 100%; aspect-ratio: 9/18.5; border-radius: 80px; background: #11131f; padding: 22px; box-shadow: 0 40px 80px rgba(31,36,64,.28); }
  .screen { width: 100%; height: 100%; border-radius: 60px; background: var(--cream); overflow: hidden; display: flex; flex-direction: column; align-items: center; padding: 80px 40px 40px; gap: 26px; }
  .wave { display: flex; align-items: center; gap: 9px; height: 110px; }
  .wave i { display: block; width: 11px; border-radius: 11px; background: var(--coral); }
  .brandmark { position: absolute; right: var(--pad); bottom: 54px; display: flex; align-items: center; gap: 14px; font-weight: 600; font-size: 34px; color: var(--ink2); }
  .brandmark .dot { width: 16px; height: 16px; border-radius: 50%; background: var(--coral); }
  .tag { position: relative; background: #fff; border-radius: 30px; box-shadow: 0 24px 50px rgba(31,36,64,.14); display: flex; flex-direction: column; align-items: center; text-align: center; }
  .tag::before { content: ''; position: absolute; top: 26px; width: 34px; height: 34px; border-radius: 50%; border: 5px solid var(--line); background: var(--cream); }
  .bullet { display: flex; gap: 22px; align-items: flex-start; font-size: 44px; line-height: 1.3; }
`
const WAVE = [30, 55, 80, 45, 70, 90, 50, 65, 35, 75, 55, 40, 85, 60, 30, 50, 70, 45].map((h) => `<i style="height:${h}%"></i>`).join('')

function phone({ title, sub, inner }) {
  return `<div class="phone"><div class="screen">
    <div style="font-size:28px;font-weight:600;color:var(--coral);letter-spacing:.14em">QRNOT</div>
    <div class="serif" style="font-size:52px;text-align:center;line-height:1.1">${title}</div>
    ${sub ? `<div class="muted" style="font-size:28px;text-align:center">${sub}</div>` : ''}
    ${inner}
  </div></div>`
}
const playerScreen = (title = 'From Mom 💛', sub = 'Voice message · 0:24') =>
  phone({
    title,
    sub,
    inner: `<div class="wave">${WAVE}</div><div style="width:150px;height:150px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-size:60px;margin-top:10px">▶</div>
    <div style="display:flex;gap:16px;margin-top:20px"><div style="width:120px;height:120px;border-radius:24px;background:linear-gradient(135deg,#ffb3d9,#ffd8b0)"></div><div style="width:120px;height:120px;border-radius:24px;background:linear-gradient(135deg,#b9e3ff,#d8c8ff)"></div><div style="width:120px;height:120px;border-radius:24px;background:linear-gradient(135deg,#c8f2d4,#fff1a8)"></div></div>`,
  })

const brandmark = '<div class="brandmark"><span class="dot"></span>qrnot.com</div>'

function page({ w, h, pad, body }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>:root{--w:${w}px;--h:${h}px;--pad:${pad}px} html,body{width:${w}px;height:${h}px;overflow:hidden} ${CSS}</style></head>
<body><div class="canvas">${body}</div></body></html>`
}

const IMG = { w: 2000, h: 1500, pad: 110 }

// ---------------------------------------------------------------------------------------------
// İlan 1 — Voice Message QR Gift Tag
// ---------------------------------------------------------------------------------------------
const giftTag = (top, bottom, width = 420) => `
  <div class="tag" style="width:${width}px;padding:${width * 0.2}px ${width * 0.1}px ${width * 0.1}px">
    <div class="serif" style="font-size:${width * 0.085}px">${top}</div>
    <div class="qr" style="width:${width * 0.62}px;margin:${width * 0.06}px 0">${qr(DEMO_QR)}</div>
    <div style="font-size:${width * 0.065}px;font-weight:600;color:var(--coral)">${bottom}</div>
  </div>`

const voiceTag = [
  {
    file: '01-cover',
    body: `
      <div class="glow" style="width:1100px;height:1100px;background:#ffc7dc;right:-300px;top:-300px"></div>
      <div class="row" style="flex:1;position:relative">
        <div style="flex:1">
          <div class="kicker" style="font-size:36px">Voice message QR gift tag</div>
          <h1 style="font-size:150px;margin-top:30px">Give your gift<br>a <span style="color:var(--coral)">voice</span>.</h1>
          <p class="muted" style="font-size:48px;margin-top:40px;line-height:1.35;max-width:820px">They scan the tag and hear you. No app needed.</p>
          <div style="display:flex;gap:20px;margin-top:50px"><span class="pill dark" style="font-size:36px">🎙️ Voice</span><span class="pill light" style="font-size:36px">🎬 Video</span><span class="pill light" style="font-size:36px">🖼️ Photos</span></div>
        </div>
        <div style="position:relative;width:720px;height:1200px">
          <div style="position:absolute;left:0;top:250px;transform:rotate(-6deg)">${giftTag('A message for you', 'Scan to listen ♥', 430)}</div>
          <div style="position:absolute;right:0;top:40px;width:400px">${playerScreen()}</div>
        </div>
      </div>
      ${brandmark}`,
  },
  {
    file: '02-how-it-works',
    body: `
      <h1 style="font-size:110px">How it works</h1>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:50px;margin-top:80px">
        ${[
          ['1', 'Purchase & download', 'Open the PDF and go to qrnot.com/etsy. Enter your Etsy order number.'],
          ['2', 'Record your message', 'Sign in to your free QRNot account. Record your voice or upload a video and photos.'],
          ['3', 'Print & gift', 'Download your QR and print it on the included gift tags, cards or stickers.'],
        ]
          .map(([n, t, d]) => `<div class="card" style="padding:60px 50px"><div class="num">${n}</div><h2 style="font-size:64px;margin-top:40px">${t}</h2><p class="muted" style="font-size:40px;margin-top:24px;line-height:1.4">${d}</p></div>`)
          .join('')}
      </div>
      <p style="font-size:40px;margin-top:60px;font-weight:600">Your QR is ready to activate within 24 hours of your order.</p>
      ${brandmark}`,
  },
  {
    file: '03-what-they-see',
    body: `
      <div class="glow" style="width:900px;height:900px;background:#fde4e3;left:-200px;bottom:-300px"></div>
      <div class="row" style="flex:1;position:relative">
        <div style="width:520px">${playerScreen()}</div>
        <div style="flex:1">
          <div class="kicker" style="font-size:34px">What they see</div>
          <h1 style="font-size:110px;margin-top:24px">Your voice,<br>one scan away.</h1>
          <div style="display:flex;flex-direction:column;gap:28px;margin-top:56px">
            ${['Voice messages up to 2 minutes', 'Videos and photo gallery', 'Spotify, YouTube and any link', 'Opens in the phone browser — no app'].map((t) => `<div class="bullet"><span class="check">✓</span><span>${t}</span></div>`).join('')}
          </div>
        </div>
      </div>
      ${brandmark}`,
  },
  {
    file: '04-change-anytime',
    body: `
      <div class="glow" style="width:1000px;height:1000px;background:#e1f2e9;right:-300px;top:-200px"></div>
      <div style="position:relative">
        <div class="kicker" style="font-size:34px">The QR never changes</div>
        <h1 style="font-size:130px;margin-top:24px">Update your<br>message later.</h1>
        <p class="muted" style="font-size:46px;margin-top:40px;line-height:1.4;max-width:1300px">Record a new voice note for their birthday — the printed QR keeps working. 3 recordings included: your first message plus 2 updates.</p>
      </div>
      <div style="display:flex;gap:40px;margin-top:110px;position:relative">
        ${[
          ['First message', '🎙️ At setup'],
          ['Update 1', '🎂 Birthday voice note'],
          ['Update 2', '💍 Anniversary video'],
        ]
          .map(([t, d]) => `<div class="card" style="flex:1;padding:44px"><div class="muted" style="font-size:34px">${t}</div><div style="font-size:46px;font-weight:600;margin-top:12px">${d}</div></div>`)
          .join('')}
      </div>
      
      ${brandmark}`,
  },
  {
    file: '05-printables',
    body: `
      <h1 style="font-size:110px">Printable templates included</h1>
      <p class="muted" style="font-size:42px;margin-top:24px">Edit the top and bottom text, then print at home on A4 or US Letter.</p>
      <div style="display:flex;gap:70px;align-items:flex-end;justify-content:center;margin-top:70px">
        <div style="text-align:center">${giftTag('Happy Birthday', 'Scan to listen ♥', 380)}<div style="font-size:38px;font-weight:600;margin-top:30px">Gift tags · 8 per page</div></div>
        <div style="text-align:center"><div class="tag" style="width:560px;padding:60px 50px;border-radius:24px"><div class="serif" style="font-size:52px">A message for you</div><div class="qr" style="width:260px;margin:34px 0">${qr(DEMO_QR)}</div><div style="font-size:34px;font-weight:600;color:var(--coral)">Scan to listen ♥</div></div><div style="font-size:38px;font-weight:600;margin-top:30px">Gift cards · 4 per page</div></div>
        <div style="text-align:center"><div style="width:360px;height:360px;border-radius:50%;background:#fff;box-shadow:0 24px 50px rgba(31,36,64,.14);display:grid;place-items:center"><div class="qr" style="width:200px">${qr(DEMO_QR)}</div></div><div style="font-size:38px;font-weight:600;margin-top:30px">Round stickers · 12 per page</div></div>
      </div>
      ${brandmark}`,
  },
  {
    file: '06-occasions',
    body: `
      <h1 style="font-size:110px">Perfect for</h1>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:34px;margin-top:70px">
        ${[
          ['💐', "Mother's Day"],
          ['🎂', 'Birthdays'],
          ['💍', 'Anniversaries'],
          ['✈️', 'Long-distance love'],
          ['👵', 'Grandparents'],
          ['👶', 'Baby announcements'],
          ['🎓', 'Graduation'],
          ['🕊️', 'In loving memory'],
        ]
          .map(([i, t]) => `<div class="card" style="padding:50px 30px;text-align:center"><div style="font-size:96px">${i}</div><div style="font-size:42px;font-weight:600;margin-top:20px">${t}</div></div>`)
          .join('')}
      </div>
      ${brandmark}`,
  },
  {
    file: '07-faq',
    body: `
      <h1 style="font-size:100px">Good to know</h1>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:60px">
        ${[
          ['Is this a physical item?', 'No. This is a digital product — you print the QR yourself.'],
          ['Does it need an app?', 'No. Any iPhone or Android camera opens it in the browser.'],
          ['How many QR codes?', 'One unique QR per item purchased. Buy 3, get 3.'],
          ['Do I need an account?', 'Yes, a free QRNot account. Your QR is linked to it and only you can edit it.'],
        ]
          .map(([q, a]) => `<div class="card" style="padding:50px"><div style="font-size:46px;font-weight:700">${q}</div><div class="muted" style="font-size:38px;margin-top:18px;line-height:1.4">${a}</div></div>`)
          .join('')}
      </div>
      ${brandmark}`,
  },
]

// ---------------------------------------------------------------------------------------------
// İlan 2 — Audio & Video Guestbook
// ---------------------------------------------------------------------------------------------
const tableCard = (names, width = 600) => `
  <div style="width:${width}px;background:#fff;border-radius:20px;box-shadow:0 30px 60px rgba(31,36,64,.16);padding:${width * 0.1}px ${width * 0.08}px;text-align:center">
    <div style="font-size:${width * 0.045}px;letter-spacing:.2em;color:var(--gold);font-weight:600">LEAVE US A MESSAGE</div>
    <div class="serif" style="font-size:${width * 0.1}px;margin-top:${width * 0.04}px">${names}</div>
    <div class="qr" style="width:${width * 0.5}px;margin:${width * 0.07}px auto">${qr(DEMO_QR)}</div>
    <div style="font-size:${width * 0.05}px;color:var(--ink2)">Scan with your phone camera<br>🎙️ voice · 🎬 video · 📷 photo</div>
  </div>`

const guestbook = [
  {
    file: '01-cover',
    body: `
      <div class="glow" style="width:1100px;height:1100px;background:#f8ecd4;left:-300px;top:-300px;opacity:.9"></div>
      <div class="row" style="flex:1;position:relative">
        <div style="flex:1">
          <div class="kicker" style="font-size:36px;color:var(--gold)">Audio & video guestbook</div>
          <h1 style="font-size:140px;margin-top:30px">Collect their<br>voices, not just<br>signatures.</h1>
          <p class="muted" style="font-size:46px;margin-top:40px;line-height:1.35;max-width:880px">One QR on your tables. Guests leave voice messages, videos and photos.</p>
        </div>
        <div style="transform:rotate(3deg)">${tableCard('Emma & James', 640)}</div>
      </div>
      ${brandmark}`,
  },
  {
    file: '02-how-it-works',
    body: `
      <h1 style="font-size:110px">How it works</h1>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:50px;margin-top:80px">
        ${[
          ['1', 'Set up in minutes', 'Enter your order number at qrnot.com/etsy, sign in and name your event.'],
          ['2', 'Print table cards', 'Personalized table cards with your names and QR are ready to print.'],
          ['3', 'Guests scan & record', 'Voice, video, photo or a written note — straight from their phone camera.'],
        ]
          .map(([n, t, d]) => `<div class="card" style="padding:60px 50px"><div class="num" style="background:var(--gold)">${n}</div><h2 style="font-size:62px;margin-top:40px">${t}</h2><p class="muted" style="font-size:40px;margin-top:24px;line-height:1.4">${d}</p></div>`)
          .join('')}
      </div>
      <p style="font-size:40px;margin-top:60px;font-weight:600">Ready to set up within 24 hours of your order.</p>
      ${brandmark}`,
  },
  {
    file: '03-guest-view',
    body: `
      <div class="row" style="flex:1">
        <div style="width:520px">${phone({
          title: 'Emma & James',
          sub: 'Leave a memory 💛',
          inner: `<div style="width:100%;display:flex;flex-direction:column;gap:18px;margin-top:10px">
            <div style="background:#fff;border:3px solid var(--line);border-radius:22px;padding:22px 26px;font-size:30px;color:var(--ink2)">Your name</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">${['🎙️ Voice', '🎬 Video', '🖼️ Photo', '✍️ Note'].map((t) => `<div style="background:#fff;border:3px solid var(--line);border-radius:22px;padding:22px;font-size:30px;font-weight:600;text-align:center">${t}</div>`).join('')}</div>
            <div style="background:var(--coral);color:#fff;border-radius:999px;padding:26px;font-size:34px;font-weight:700;text-align:center;margin-top:8px">Send memory</div>
          </div>`,
        })}</div>
        <div style="flex:1">
          <div class="kicker" style="font-size:34px;color:var(--gold)">What guests see</div>
          <h1 style="font-size:110px;margin-top:24px">No app.<br>No line.<br>Just scan.</h1>
          <p class="muted" style="font-size:44px;margin-top:40px;line-height:1.4">Everyone records from their own phone, at the same time — no rental phone, no waiting.</p>
        </div>
      </div>
      ${brandmark}`,
  },
  {
    file: '04-features',
    body: `
      <div class="glow" style="width:1000px;height:1000px;background:#f8ecd4;right:-300px;bottom:-300px;opacity:.9"></div>
      <h1 style="font-size:110px;position:relative">Everything you need</h1>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:34px 80px;margin-top:70px;position:relative">
        ${[
          'Unlimited guests, up to 300 memories',
          'Voice, video, photo and text',
          'You approve every memory first',
          'Optional PIN — only your guests can post',
          'One memory per guest, no spam',
          'Download every memory',
          'Personalized printable table cards',
          'Works on iPhone & Android, no app',
        ]
          .map((t) => `<div class="bullet"><span class="check">✓</span><span>${t}</span></div>`)
          .join('')}
      </div>
      ${brandmark}`,
  },
  {
    file: '05-table-cards',
    body: `
      <h1 style="font-size:110px">Printable table cards</h1>
      <p class="muted" style="font-size:42px;margin-top:24px">Your names and your unique QR — print as many as you have tables.</p>
      <div style="display:flex;gap:60px;justify-content:center;align-items:flex-end;margin-top:60px">
        <div style="transform:rotate(-4deg)">${tableCard('Emma & James', 470)}</div>
        <div>${tableCard('Sophia turns 30', 470)}</div>
        <div style="transform:rotate(4deg)">${tableCard('Happy Retirement', 470)}</div>
      </div>
      ${brandmark}`,
  },
  {
    file: '06-occasions',
    body: `
      <h1 style="font-size:110px">For every celebration</h1>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:34px;margin-top:70px">
        ${[
          ['💒', 'Weddings'],
          ['💍', 'Engagements'],
          ['👰', 'Bridal showers'],
          ['🍼', 'Baby showers'],
          ['🎉', 'Birthdays'],
          ['🥂', 'Retirements'],
          ['👋', 'Farewells'],
          ['🕊️', 'Memorials'],
        ]
          .map(([i, t]) => `<div class="card" style="padding:50px 30px;text-align:center"><div style="font-size:96px">${i}</div><div style="font-size:42px;font-weight:600;margin-top:20px">${t}</div></div>`)
          .join('')}
      </div>
      ${brandmark}`,
  },
]

// ---------------------------------------------------------------------------------------------
// İlan 3 — Pet ID / Emergency contact QR
// ---------------------------------------------------------------------------------------------
const finderScreen = phone({
  title: 'Hi, I’m Max 🐾',
  sub: 'If you found me, please contact my family.',
  inner: `<div style="width:100%;display:flex;flex-direction:column;gap:18px;margin-top:10px">
    <div style="font-size:30px;font-weight:600;color:var(--coral);text-align:center">🆘 Emergency</div>
    <div style="background:var(--coral);color:#fff;border-radius:999px;padding:28px;font-size:34px;font-weight:700;text-align:center">📞 Call owner</div>
    <div style="background:#fff;border:3px solid var(--line);border-radius:999px;padding:26px;font-size:32px;font-weight:600;text-align:center">📍 Open location</div>
    <div style="background:var(--cream2);border-radius:22px;padding:20px;font-size:26px;text-align:center;color:var(--ink2)">🔊 Voice note from the family</div>
  </div>`,
})

const petTag = (width = 380) => `
  <div style="position:relative;width:${width}px;height:${width}px;border-radius:50%;background:linear-gradient(135deg,#8ad8ff,#0b95e6);display:grid;place-items:center;box-shadow:0 30px 60px rgba(11,149,230,.3)">
    <div style="position:absolute;top:-${width * 0.12}px;width:${width * 0.2}px;height:${width * 0.2}px;border-radius:50%;border:${width * 0.03}px solid #9ea3ae"></div>
    <div style="width:${width * 0.72}px;height:${width * 0.72}px;border-radius:50%;background:#fff;display:grid;place-items:center">
      <div class="qr" style="width:${width * 0.42}px">${qr(DEMO_QR)}</div>
    </div>
  </div>`

const petId = [
  {
    file: '01-cover',
    body: `
      <div class="glow" style="width:1100px;height:1100px;background:#b9e3ff;right:-300px;top:-300px"></div>
      <div class="row" style="flex:1;position:relative">
        <div style="flex:1">
          <div class="kicker" style="font-size:36px;color:#0b7fc4">QR pet ID & emergency tag</div>
          <h1 style="font-size:150px;margin-top:30px">Lost?<br>Scan me.</h1>
          <p class="muted" style="font-size:46px;margin-top:40px;line-height:1.35;max-width:880px">Whoever finds your pet can call you with one tap. Update your info any time — no new tag needed.</p>
        </div>
        <div style="position:relative;width:760px;height:1150px">
          <div style="position:absolute;left:-60px;top:700px;z-index:2">${petTag(360)}</div>
          <div style="position:absolute;right:0;top:0;width:500px">${finderScreen}</div>
        </div>
      </div>
      ${brandmark}`,
  },
  {
    file: '02-what-finder-sees',
    body: `
      <div class="row" style="flex:1">
        <div style="width:520px">${finderScreen}</div>
        <div style="flex:1">
          <div class="kicker" style="font-size:34px;color:#0b7fc4">What the finder sees</div>
          <h1 style="font-size:110px;margin-top:24px">One tap<br>to reach you.</h1>
          <div style="display:flex;flex-direction:column;gap:28px;margin-top:56px">
            ${['“Call owner” button with your number', '“Open location” — your address in Maps', 'Photos and a voice note from the family', 'Your pet’s name and a short note'].map((t) => `<div class="bullet"><span class="check">✓</span><span>${t}</span></div>`).join('')}
          </div>
        </div>
      </div>
      ${brandmark}`,
  },
  {
    file: '03-how-it-works',
    body: `
      <h1 style="font-size:110px">How it works</h1>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:50px;margin-top:80px">
        ${[
          ['1', 'Activate', 'Enter your Etsy order number at qrnot.com/etsy and sign in to your free QRNot account.'],
          ['2', 'Add your info', 'Phone number, address, photos and an optional voice note.'],
          ['3', 'Print & attach', 'Print the round stickers or tags and stick them on a collar tag, bag or luggage.'],
        ]
          .map(([n, t, d]) => `<div class="card" style="padding:60px 50px"><div class="num" style="background:#0b95e6">${n}</div><h2 style="font-size:64px;margin-top:40px">${t}</h2><p class="muted" style="font-size:40px;margin-top:24px;line-height:1.4">${d}</p></div>`)
          .join('')}
      </div>
      <p style="font-size:40px;margin-top:60px;font-weight:600">Moved? Changed your number? Update it online — the QR stays the same.</p>
      ${brandmark}`,
  },
  {
    file: '04-uses',
    body: `
      <h1 style="font-size:110px">Not just for pets</h1>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:34px;margin-top:70px">
        ${[
          ['🐶', 'Dog & cat collars'],
          ['🎒', 'Kids’ backpacks'],
          ['🧳', 'Luggage & travel bags'],
          ['🔑', 'Keys & key rings'],
          ['🩺', 'Medical info cards'],
          ['🚲', 'Bikes & scooters'],
        ]
          .map(([i, t]) => `<div class="card" style="padding:56px 30px;text-align:center"><div style="font-size:100px">${i}</div><div style="font-size:44px;font-weight:600;margin-top:20px">${t}</div></div>`)
          .join('')}
      </div>
      ${brandmark}`,
  },
  {
    file: '05-faq',
    body: `
      <h1 style="font-size:100px">Good to know</h1>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:60px">
        ${[
          ['Is this a physical tag?', 'No. It is a digital QR with printable sticker and tag templates. Print it, laminate or use waterproof sticker paper.'],
          ['Does it track my pet?', 'No. There is no GPS. The finder sees your contact info and the address you entered.'],
          ['Does the finder need an app?', 'No. Any iPhone or Android camera opens the page.'],
          ['Can I change my info?', 'Yes, any time from your QRNot account. The QR never changes.'],
        ]
          .map(([q, a]) => `<div class="card" style="padding:50px"><div style="font-size:46px;font-weight:700">${q}</div><div class="muted" style="font-size:38px;margin-top:18px;line-height:1.4">${a}</div></div>`)
          .join('')}
      </div>
      ${brandmark}`,
  },
]

// ---------------------------------------------------------------------------------------------
// Alıcının indireceği PDF (Etsy dijital ürünlerde zorunlu dosya)
// ---------------------------------------------------------------------------------------------
function buyerPdf({ product, choose, extra }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Geist:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: Letter; margin: 0; }
  ${CSS}
  body { width: 8.5in; }
  .sheet { width: 8.5in; height: 11in; padding: 0.8in 0.8in 0.6in; display: flex; flex-direction: column; background: var(--cream); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ol { margin-top: 0.35in; padding-left: 0.3in; font-size: 15pt; line-height: 1.6; }
  ol li { margin-bottom: 0.12in; }
  ol b { color: var(--ink); }
</style></head><body><div class="sheet">
  <div style="display:flex;align-items:center;gap:10px;font-weight:600;font-size:14pt"><span style="width:10px;height:10px;border-radius:50%;background:var(--coral)"></span>QRNot</div>
  <h1 style="font-size:38pt;margin-top:0.4in">Thank you! 💛</h1>
  <p class="muted" style="font-size:15pt;margin-top:0.15in;line-height:1.5">Let's activate your <b style="color:var(--ink)">${product}</b>.</p>
  <ol class="muted">
    <li>Go to <b>qrnot.com/etsy</b> (or scan the QR code below).</li>
    <li>Enter your <b>Etsy order number</b> and email.<br><span style="font-size:12pt">Find it in Etsy → You → Purchases. Orders are ready to activate within 24 hours.</span></li>
    <li>Choose <b>${choose}</b> and click <b>Activate</b>.</li>
    <li><b>Sign in or create your free QRNot account.</b> Your QR is linked to it — only you can edit it.</li>
    ${extra}
  </ol>
  <div style="margin-top:auto;display:flex;align-items:center;gap:0.4in">
    <div class="qrbox" style="width:1.9in;padding:0.18in">${qr(ETSY_QR)}</div>
    <div>
      <div style="font-size:20pt;font-weight:700">qrnot.com/etsy</div>
      <p class="muted" style="font-size:12pt;margin-top:0.08in;line-height:1.5">One unique QR code per item purchased.<br>Need help? Message us on Etsy — we reply within 24 hours.</p>
    </div>
  </div>
</div></body></html>`
}

const LISTINGS = [
  {
    dir: '01-voice-message-qr-gift-tag',
    images: voiceTag,
    pdf: buyerPdf({
      product: 'voice message QR code',
      choose: '“Voice / video message QR”',
      extra:
        '<li><b>Record your message</b> or upload a video and photos.</li><li><b>Download your QR</b> and open the printable templates (gift tags, cards, round stickers).</li>',
    }),
  },
  {
    dir: '02-audio-video-guestbook',
    images: guestbook,
    pdf: buyerPdf({
      product: 'audio & video guestbook',
      choose: '“Audio & video guestbook”',
      extra:
        '<li><b>Name your event</b>, choose approval and an optional PIN.</li><li>Open your guestbook panel and <b>print your table cards</b>.</li>',
    }),
  },
  {
    dir: '03-pet-id-emergency-qr',
    images: petId,
    pdf: buyerPdf({
      product: 'QR pet ID & emergency tag',
      choose: '“Voice / video message QR”',
      extra:
        '<li>Open <b>Emergency info</b> and add your phone number and address. Add photos or a voice note if you like.</li><li><b>Download your QR</b> and print the round stickers or tags.</li>',
    }),
  },
]

// ---------------------------------------------------------------------------------------------
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => existsSync(p))
if (!CHROME) throw new Error('Chrome / Edge bulunamadı')

const tmp = join(tmpdir(), 'qrnot-etsy-html')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })
const only = process.argv[2]

for (const listing of LISTINGS) {
  if (only && !listing.dir.includes(only)) continue
  const imgDir = join(HERE, 'listings', listing.dir, 'images')
  const dlDir = join(HERE, 'listings', listing.dir, 'download')
  mkdirSync(imgDir, { recursive: true })
  mkdirSync(dlDir, { recursive: true })

  for (const img of listing.images) {
    const html = join(tmp, `${listing.dir}-${img.file}.html`)
    writeFileSync(html, page({ ...IMG, body: img.body }))
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${IMG.w},${IMG.h}`, '--virtual-time-budget=8000', `--screenshot=${join(imgDir, `${img.file}.png`)}`, pathToFileURL(html).href], { stdio: 'ignore' })
    console.log(`${listing.dir}/images/${img.file}.png`)
  }

  const pdfHtml = join(tmp, `${listing.dir}-download.html`)
  writeFileSync(pdfHtml, listing.pdf)
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000', `--print-to-pdf=${join(dlDir, 'QRNot-Activation-Instructions.pdf')}`, pathToFileURL(pdfHtml).href], { stdio: 'ignore' })
  console.log(`${listing.dir}/download/QRNot-Activation-Instructions.pdf`)
}
