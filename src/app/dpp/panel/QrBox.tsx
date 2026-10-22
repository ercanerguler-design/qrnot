'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useRef, useState } from 'react'
import { useT } from './i18n'
import { Button } from './ui'

// Pasaport QR'ı: ekranda gösterir, baskı için SVG (vektörel) ya da PNG indirir.

export default function QrBox({ url, filename, size = 168 }: { url: string; filename: string; size?: number }) {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const svgText = () => {
    const svg = ref.current?.querySelector('svg')
    if (!svg) return ''
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    return new XMLSerializer().serializeToString(clone)
  }

  const download = (href: string, ext: string) => {
    const a = document.createElement('a')
    a.href = href
    a.download = `${filename}.${ext}`
    a.click()
  }

  const downloadSvg = () => {
    const href = URL.createObjectURL(new Blob([svgText()], { type: 'image/svg+xml' }))
    download(href, 'svg')
    setTimeout(() => URL.revokeObjectURL(href), 3000)
  }

  const downloadPng = () => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1200
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, 1200, 1200)
      ctx.drawImage(img, 0, 0, 1200, 1200)
      download(canvas.toDataURL('image/png'), 'png')
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText())}`
  }

  return (
    <div>
      <div ref={ref} className="mx-auto w-fit rounded-xl border border-slate-200 bg-white p-3">
        <QRCodeSVG value={url} size={size} level="M" marginSize={2} />
      </div>
      <p className="mt-2 break-all text-center text-xs text-slate-500">{url}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={downloadSvg}>
          SVG
        </Button>
        <Button size="sm" onClick={downloadPng}>
          PNG
        </Button>
        <Button
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
        >
          {copied ? t('copied') : t('qr_copy_link')}
        </Button>
      </div>
    </div>
  )
}
