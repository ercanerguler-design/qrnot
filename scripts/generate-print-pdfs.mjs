import fs from 'node:fs'
import path from 'node:path'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'

const printPackDir = path.resolve('deliverables/print-pack')

const mmToPt = (mm) => (mm * 72) / 25.4

const parseSizeMm = (svgContent) => {
  const widthMatch = svgContent.match(/width="([0-9.]+)mm"/i)
  const heightMatch = svgContent.match(/height="([0-9.]+)mm"/i)

  if (!widthMatch || !heightMatch) {
    throw new Error('SVG width/height in mm not found.')
  }

  return {
    widthMm: Number(widthMatch[1]),
    heightMm: Number(heightMatch[1]),
  }
}

const svgFiles = fs
  .readdirSync(printPackDir)
  .filter((f) => f.toLowerCase().endsWith('.svg'))

const arialRegular = 'C:\\Windows\\Fonts\\arial.ttf'
const arialBold = 'C:\\Windows\\Fonts\\arialbd.ttf'

for (const svgFile of svgFiles) {
  const svgPath = path.join(printPackDir, svgFile)
  const svgContent = fs.readFileSync(svgPath, 'utf8')
  const { widthMm, heightMm } = parseSizeMm(svgContent)

  const pdfPath = path.join(printPackDir, svgFile.replace(/\.svg$/i, '.pdf'))

  const doc = new PDFDocument({
    autoFirstPage: false,
    compress: true,
  })

  if (fs.existsSync(arialRegular)) {
    doc.registerFont('ArialUnicode', arialRegular)
  }
  if (fs.existsSync(arialBold)) {
    doc.registerFont('ArialUnicode-Bold', arialBold)
  }

  doc.addPage({
    size: [mmToPt(widthMm), mmToPt(heightMm)],
    margin: 0,
  })

  const out = fs.createWriteStream(pdfPath)
  doc.pipe(out)

  SVGtoPDF(doc, svgContent, 0, 0, {
    width: mmToPt(widthMm),
    height: mmToPt(heightMm),
    preserveAspectRatio: 'xMinYMin meet',
    fontCallback: (_family, bold, _italic) => {
      if (bold && fs.existsSync(arialBold)) return 'ArialUnicode-Bold'
      if (fs.existsSync(arialRegular)) return 'ArialUnicode'
      return 'Helvetica'
    },
  })

  doc.end()

  await new Promise((resolve, reject) => {
    out.on('finish', resolve)
    out.on('error', reject)
  })

  console.log(`Generated: ${path.relative(process.cwd(), pdfPath)}`)
}
