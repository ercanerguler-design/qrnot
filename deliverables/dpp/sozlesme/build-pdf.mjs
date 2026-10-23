// Sözleşme taslaklarını (Markdown) A4 PDF'e çevirir: node deliverables/dpp/sozlesme/build-pdf.mjs
// Basit Markdown alt kümesi: başlık, paragraf, liste, tablo, alıntı, kalın, yatay çizgi.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const DOCS = [
  ['VERI-ISLEME-SOZLESMESI-TR.md', 'tr', 'TASLAK'],
  ['DATA-PROCESSING-AGREEMENT-EN.md', 'en', 'DRAFT'],
  ['HIZMET-SATIS-SOZLESMESI-TR.md', 'tr', 'TASLAK'],
  ['TEKNIK-DESTEK-SOZLESMESI-TR.md', 'tr', 'TASLAK'],
  ['SERVICE-AGREEMENT-EN.md', 'en', 'DRAFT'],
  ['SUPPORT-SLA-EN.md', 'en', 'DRAFT'],
]
const BROWSERS = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
const browser = BROWSERS.find((b) => existsSync(b))
if (!browser) throw new Error('Chrome / Edge bulunamadı')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

function md(src) {
  const out = []
  const lines = src.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (!l.trim()) continue
    if (/^---+$/.test(l.trim())) out.push('<hr>')
    else if (/^#{1,3} /.test(l)) {
      const n = l.match(/^#+/)[0].length
      out.push(`<h${n}>${inline(l.slice(n + 1))}</h${n}>`)
    } else if (l.startsWith('> ')) out.push(`<blockquote>${inline(l.slice(2))}</blockquote>`)
    else if (l.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++])
      i--
      const cells = (r) => r.slice(1, -1).split('|').map((c) => c.trim())
      const body = rows.slice(2).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')
      out.push(`<table><thead><tr>${cells(rows[0]).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`)
    } else if (/^\d+\. /.test(l) || /^- /.test(l)) {
      // Numaralı ya da madde işaretli liste; altındaki girintili "- " satırları iç içe liste olur
      const ordered = /^\d+\. /.test(l)
      const top = ordered ? /^\d+\. / : /^- /
      const items = []
      while (i < lines.length && (top.test(lines[i]) || /^\s{2,}- /.test(lines[i]))) {
        if (top.test(lines[i])) items.push({ text: lines[i].replace(top, ''), sub: [] })
        else if (items.length) items[items.length - 1].sub.push(lines[i].replace(/^\s+- /, ''))
        i++
      }
      i--
      const tag = ordered ? 'ol' : 'ul'
      out.push(`<${tag}>${items.map((x) => `<li>${inline(x.text)}${x.sub.length ? `<ul>${x.sub.map((y) => `<li>${inline(y)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</${tag}>`)
    } else out.push(`<p>${inline(l)}</p>`)
  }
  return out.join('\n')
}

const css = `
@page { size: A4; margin: 18mm 17mm 20mm; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.2pt; line-height: 1.5; color: #13202f; }
body::before { content: attr(data-mark); position: fixed; top: 42%; left: 0; right: 0; text-align: center; transform: rotate(-30deg);
  font-size: 110pt; font-weight: 800; color: rgba(200, 40, 40, 0.07); z-index: -1; }
h1 { font-size: 20pt; color: #0f3d5e; margin: 0 0 4pt; }
h2 { font-size: 12.5pt; color: #0f3d5e; margin: 16pt 0 5pt; break-after: avoid; }
blockquote { margin: 10pt 0; padding: 8pt 11pt; background: #fff4e5; border-left: 4px solid #e08a1e; font-size: 9.5pt; }
table { width: 100%; border-collapse: collapse; margin: 6pt 0 10pt; font-size: 9.2pt; break-inside: auto; }
th, td { border: 1px solid #d5dde6; padding: 5pt 7pt; text-align: left; vertical-align: top; }
th { background: #eef3f8; }
tr { break-inside: avoid; }
ol, ul { padding-left: 18pt; } li { margin: 3pt 0; } li ul { margin: 2pt 0; }
hr { border: 0; border-top: 1px solid #d5dde6; margin: 14pt 0; }
`

const tmp = mkdtempSync(join(tmpdir(), 'dpa-'))
for (const [file, lang, mark] of DOCS) {
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${file}</title><style>${css}</style></head><body data-mark="${mark}">${md(readFileSync(join(dir, file), 'utf8'))}</body></html>`
  const htmlPath = join(tmp, file.replace(/\.md$/, '.html'))
  writeFileSync(htmlPath, html)
  const pdf = join(dir, file.replace(/\.md$/, '.pdf'))
  execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, pathToFileURL(htmlPath).href], { stdio: 'ignore' })
  console.log('PDF:', pdf)
}
