import fs from 'node:fs'
import path from 'node:path'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'

const outDir = path.resolve('deliverables/print-pack')
fs.mkdirSync(outDir, { recursive: true })

const mmToPt = (mm) => (mm * 72) / 25.4
const windowsFontsDir = process.env.WINDIR
  ? path.join(process.env.WINDIR, 'Fonts')
  : 'C:/Windows/Fonts'

const pickFontFile = (family, bold, italic) => {
  const normalized = String(family || '').toLowerCase()
  const isArial = normalized.includes('arial') || normalized.includes('helvetica')
  if (!isArial) {
    return null
  }

  if (bold && italic) {
    return path.join(windowsFontsDir, 'arialbi.ttf')
  }
  if (bold) {
    return path.join(windowsFontsDir, 'arialbd.ttf')
  }
  if (italic) {
    return path.join(windowsFontsDir, 'ariali.ttf')
  }
  return path.join(windowsFontsDir, 'arial.ttf')
}

const fontCallback = (family, bold, italic) => {
  const fontFile = pickFontFile(family, bold, italic)
  if (fontFile && fs.existsSync(fontFile)) {
    return fontFile
  }
  return null
}

const files = [
  {
    name: 'classic-qr-tag-front-35mm',
    widthMm: 35,
    heightMm: 35,
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="35mm" height="35mm" viewBox="0 0 35 35">
  <title>QRNot Classic QR Tag Ön Yüz - 35mm</title>
  <desc>Ön yüz baskı şablonu: 35x35mm final kesim.</desc>

  <circle cx="17.5" cy="17.5" r="17.5" fill="#0B1020"/>
  <circle cx="17.5" cy="17.5" r="16.1" fill="none" stroke="#FFEB3B" stroke-width="0.45" opacity="0.92"/>
  <circle cx="17.5" cy="17.5" r="15.1" fill="none" stroke="#39FF14" stroke-width="0.45" opacity="0.92"/>

  <g fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="17.5" y="7.6" font-size="3.2" font-weight="700">QRNot</text>

    <rect x="9.5" y="8.5" width="16" height="16" rx="1.0" ry="1.0" fill="#FFFFFF"/>
    <rect x="10.2" y="9.2" width="14.6" height="14.6" fill="none" stroke="#D3D3D3" stroke-width="0.2"/>
    <text x="17.5" y="16.9" font-size="1.5" fill="#2D2D2D">QR KOD</text>
    <text x="17.5" y="18.8" font-size="1.1" fill="#686868">Baskı öncesi değiştir</text>

    <text x="17.5" y="29.2" font-size="1.55" font-weight="700">Kalpten Gelen QR</text>
    <text x="17.5" y="31.5" font-size="2.2">&#9829;</text>
  </g>
</svg>
`,
  },
  {
    name: 'classic-qr-tag-back-35mm',
    widthMm: 35,
    heightMm: 35,
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="35mm" height="35mm" viewBox="0 0 35 35">
  <title>QRNot Classic QR Tag Arka Yüz - 35mm</title>
  <desc>Arka yüz baskı şablonu: 35x35mm final kesim.</desc>

  <circle cx="17.5" cy="17.5" r="17.5" fill="#1C1C1C"/>
  <circle cx="17.5" cy="17.5" r="16.1" fill="none" stroke="#FFEB3B" stroke-width="0.45" opacity="0.92"/>
  <circle cx="17.5" cy="17.5" r="15.1" fill="none" stroke="#39FF14" stroke-width="0.45" opacity="0.92"/>

  <g fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <!-- QR Kod Placeholder -->
    <rect x="9.5" y="7.5" width="16" height="16" rx="1.0" ry="1.0" fill="#FFFFFF"/>
    <rect x="10.2" y="8.2" width="14.6" height="14.6" fill="none" stroke="#D3D3D3" stroke-width="0.2"/>
    <text x="17.5" y="15.8" font-size="1.5" fill="#2D2D2D">QR KOD</text>

    <!-- Dinleme ikonu (kulaklik + play + dalga) -->
    <g stroke="#FFFFFF" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 14.6 27.0 A 2.9 2.9 0 0 1 20.4 27.0" stroke-width="0.5"/>
      <rect x="14.0" y="26.9" width="1.2" height="2.6" rx="0.45" ry="0.45" stroke-width="0.4"/>
      <rect x="19.8" y="26.9" width="1.2" height="2.6" rx="0.45" ry="0.45" stroke-width="0.4"/>
      <path d="M 16.9 27.3 L 16.9 28.9 L 18.3 28.1 Z" fill="#FFFFFF" stroke="none"/>
      <path d="M 21.8 27.2 Q 22.5 28.1 21.8 29.0" stroke-width="0.35"/>
      <path d="M 13.1 27.2 Q 12.4 28.1 13.1 29.0" stroke-width="0.35"/>
    </g>
  </g>
</svg>
`,
  },
  {
    name: 'sticker-round-35mm',
    widthMm: 39,
    heightMm: 39,
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="39mm" height="39mm" viewBox="0 0 39 39">
  <title>QRNot Sticker Yuvarlak - 35mm</title>
  <desc>Yuvarlak sticker baskı şablonu: 2mm taşma payı, 35mm kesim, 31mm güvenli alan.</desc>

  <circle cx="19.5" cy="19.5" r="19.5" fill="#0E1325"/>
  <circle cx="19.5" cy="19.5" r="16.9" fill="none" stroke="#FFEB3B" stroke-width="0.48" opacity="0.9"/>
  <circle cx="19.5" cy="19.5" r="15.8" fill="none" stroke="#39FF14" stroke-width="0.48" opacity="0.9"/>

  <g fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="19.5" y="8.5" font-size="3.45" font-weight="700">QRNot</text>

    <rect x="10.5" y="10" width="18" height="18" rx="1.0" ry="1.0" fill="#FFFFFF"/>
    <rect x="11.3" y="10.8" width="16.4" height="16.4" fill="none" stroke="#D2D2D2" stroke-width="0.2"/>
    <text x="19.5" y="19.4" font-size="1.65" fill="#2D2D2D">QR KOD</text>

    <text x="19.5" y="31.5" font-size="1.55" font-weight="700">Kalpten Gelen QR</text>
    <text x="19.5" y="34.5" font-size="2.3">&#9829;</text>
  </g>

</svg>
`,
  },
  {
    name: 'sticker-square-35x35mm',
    widthMm: 39,
    heightMm: 39,
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="39mm" height="39mm" viewBox="0 0 39 39">
  <title>QRNot Sticker Kare - 35x35mm</title>
  <desc>Kare sticker baskı şablonu: 2mm taşma payı, 35x35mm kesim, 31x31mm güvenli alan.</desc>

  <rect x="0" y="0" width="39" height="39" rx="4" ry="4" fill="#0E1325"/>
  <rect x="1.2" y="1.2" width="36.6" height="36.6" rx="3.4" ry="3.4" fill="none" stroke="#FFEB3B" stroke-width="0.48"/>
  <rect x="2.1" y="2.1" width="34.8" height="34.8" rx="3.1" ry="3.1" fill="none" stroke="#39FF14" stroke-width="0.48"/>

  <g fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="19.5" y="8.5" font-size="3.45" font-weight="700">QRNot</text>

    <rect x="10.5" y="10" width="18" height="18" rx="1.0" ry="1.0" fill="#FFFFFF"/>
    <rect x="11.3" y="10.8" width="16.4" height="16.4" fill="none" stroke="#D2D2D2" stroke-width="0.2"/>
    <text x="19.5" y="19.4" font-size="1.65" fill="#2D2D2D">QR KOD</text>

    <text x="19.5" y="32.3" font-size="1.5" font-weight="700">Kalpten Gelen QR</text>
    <text x="19.5" y="35.3" font-size="2.2">&#9829;</text>
  </g>

</svg>
`,
  },
  {
    name: 'sticker-rectangle-45x25mm',
    widthMm: 49,
    heightMm: 29,
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="49mm" height="29mm" viewBox="0 0 49 29">
  <title>QRNot Sticker Dikdörtgen - 45x25mm</title>
  <desc>Dikdörtgen sticker baskı şablonu: 2mm taşma payı, 45x25mm kesim, 41x21mm güvenli alan.</desc>

  <rect x="0" y="0" width="49" height="29" rx="3" ry="3" fill="#0E1325"/>
  <rect x="1.2" y="1.2" width="46.6" height="26.6" rx="2.6" ry="2.6" fill="none" stroke="#FFEB3B" stroke-width="0.48"/>
  <rect x="2.1" y="2.1" width="44.8" height="24.8" rx="2.3" ry="2.3" fill="none" stroke="#39FF14" stroke-width="0.48"/>

  <g fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif">
    <rect x="4.2" y="6.2" width="16.5" height="16.5" rx="0.8" ry="0.8" fill="#FFFFFF"/>
    <rect x="5" y="7.0" width="14.9" height="14.9" fill="none" stroke="#D2D2D2" stroke-width="0.2"/>
    <text x="12.45" y="15.5" text-anchor="middle" font-size="1.7" fill="#2D2D2D">QR</text>

    <text x="32.2" y="16.5" text-anchor="middle" font-size="1.85" font-weight="700">Kalpten Gelen QR</text>
    <text x="32.2" y="18.8" text-anchor="middle" font-size="1.8">&#9829;</text>
  </g>
</svg>
`,
  },
]

for (const file of files) {
  const svgPath = path.join(outDir, `${file.name}.svg`)
  const pdfPath = path.join(outDir, `${file.name}.pdf`)

  fs.writeFileSync(svgPath, file.svg, 'utf8')

  const doc = new PDFDocument({ autoFirstPage: false, compress: true })
  doc.addPage({
    size: [mmToPt(file.widthMm), mmToPt(file.heightMm)],
    margin: 0,
  })

  const out = fs.createWriteStream(pdfPath)
  doc.pipe(out)

  SVGtoPDF(doc, file.svg, 0, 0, {
    width: mmToPt(file.widthMm),
    height: mmToPt(file.heightMm),
    preserveAspectRatio: 'xMinYMin meet',
    fontCallback,
  })

  doc.end()

  await new Promise((resolve, reject) => {
    out.on('finish', resolve)
    out.on('error', reject)
  })

  console.log(`Rebuilt: ${path.relative(process.cwd(), svgPath)}`)
  console.log(`Rebuilt: ${path.relative(process.cwd(), pdfPath)}`)
}
