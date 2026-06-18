import fs from 'node:fs'
import path from 'node:path'
import PDFDocument from 'pdfkit'

const inputDir = path.resolve('deliverables/patent-tr')

if (!fs.existsSync(inputDir)) {
  console.error('Directory not found:', inputDir)
  process.exit(1)
}

const windowsFontsDir = process.env.WINDIR
  ? path.join(process.env.WINDIR, 'Fonts')
  : 'C:/Windows/Fonts'

const regularFontPath = path.join(windowsFontsDir, 'arial.ttf')
const boldFontPath = path.join(windowsFontsDir, 'arialbd.ttf')

const hasRegularFont = fs.existsSync(regularFontPath)
const hasBoldFont = fs.existsSync(boldFontPath)

const mdFiles = fs
  .readdirSync(inputDir)
  .filter((name) => name.toLowerCase().endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'tr'))

const stripMarkdown = (line) => {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
}

const setupFonts = (doc) => {
  if (hasRegularFont) {
    doc.registerFont('TR-Regular', regularFontPath)
  }
  if (hasBoldFont) {
    doc.registerFont('TR-Bold', boldFontPath)
  }
}

const setFont = (doc, weight = 'regular', size = 11) => {
  const regular = hasRegularFont ? 'TR-Regular' : 'Helvetica'
  const bold = hasBoldFont ? 'TR-Bold' : 'Helvetica-Bold'
  doc.font(weight === 'bold' ? bold : regular).fontSize(size)
}

const writeLine = (doc, rawLine) => {
  const line = rawLine || ''
  const marginLeft = 54
  const maxWidth = doc.page.width - marginLeft * 2

  if (!line.trim()) {
    doc.moveDown(0.45)
    return
  }

  if (line.startsWith('### ')) {
    setFont(doc, 'bold', 13)
    doc.text(stripMarkdown(line), marginLeft, doc.y, { width: maxWidth })
    doc.moveDown(0.2)
    return
  }

  if (line.startsWith('## ')) {
    setFont(doc, 'bold', 14)
    doc.text(stripMarkdown(line), marginLeft, doc.y, { width: maxWidth })
    doc.moveDown(0.25)
    return
  }

  if (line.startsWith('# ')) {
    setFont(doc, 'bold', 16)
    doc.text(stripMarkdown(line), marginLeft, doc.y, { width: maxWidth })
    doc.moveDown(0.3)
    return
  }

  if (/^\s*[-*]\s+/.test(line)) {
    setFont(doc, 'regular', 11)
    doc.text(`• ${stripMarkdown(line.replace(/^\s*[-*]\s+/, ''))}`, marginLeft, doc.y, {
      width: maxWidth,
      indent: 8,
    })
    return
  }

  if (/^\s*\d+\.\s+/.test(line)) {
    setFont(doc, 'regular', 11)
    doc.text(stripMarkdown(line), marginLeft, doc.y, { width: maxWidth })
    return
  }

  setFont(doc, 'regular', 11)
  doc.text(stripMarkdown(line), marginLeft, doc.y, { width: maxWidth })
}

const renderMarkdownToPdf = async (mdPath, pdfPath, title = '') => {
  const content = fs.readFileSync(mdPath, 'utf8')
  const lines = content.split(/\r?\n/)

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 54, right: 54, bottom: 54, left: 54 },
    autoFirstPage: true,
    compress: true,
  })

  setupFonts(doc)

  const out = fs.createWriteStream(pdfPath)
  doc.pipe(out)

  if (title) {
    setFont(doc, 'bold', 17)
    doc.text(title)
    doc.moveDown(0.35)
  }

  for (const line of lines) {
    writeLine(doc, line)
  }

  doc.end()

  await new Promise((resolve, reject) => {
    out.on('finish', resolve)
    out.on('error', reject)
  })
}

const renderCombinedPdf = async (files, outputPath) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 54, right: 54, bottom: 54, left: 54 },
    autoFirstPage: true,
    compress: true,
  })

  setupFonts(doc)

  const out = fs.createWriteStream(outputPath)
  doc.pipe(out)

  setFont(doc, 'bold', 18)
  doc.text('QRNot Patent Basvuru Tam Set (TR)')
  doc.moveDown(0.4)
  setFont(doc, 'regular', 11)
  doc.text('Bu dosya patent-tr klasorundeki tum belgelerin birlesik PDF versiyonudur.')
  doc.moveDown(0.8)

  files.forEach((file, index) => {
    if (index > 0) {
      doc.addPage()
    }

    setFont(doc, 'bold', 15)
    doc.text(file)
    doc.moveDown(0.35)

    const content = fs.readFileSync(path.join(inputDir, file), 'utf8')
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      writeLine(doc, line)
    }
  })

  doc.end()

  await new Promise((resolve, reject) => {
    out.on('finish', resolve)
    out.on('error', reject)
  })
}

for (const mdFile of mdFiles) {
  const mdPath = path.join(inputDir, mdFile)
  const pdfPath = path.join(inputDir, mdFile.replace(/\.md$/i, '.pdf'))
  const title = mdFile.replace(/\.md$/i, '')
  await renderMarkdownToPdf(mdPath, pdfPath, title)
  console.log('Generated:', path.relative(process.cwd(), pdfPath))
}

const combinedPath = path.join(inputDir, '10-Patent-Basvuru-Tam-Set.pdf')
await renderCombinedPdf(mdFiles, combinedPath)
console.log('Generated:', path.relative(process.cwd(), combinedPath))
