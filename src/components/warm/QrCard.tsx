'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { Lang } from '@/lib/i18n'

// QR önizleme + yüksek çözünürlüklü PNG / vektör SVG indirme (baskı için).

function svgMarkup(container: HTMLDivElement | null, size: number) {
  const svg = container?.querySelector('svg')
  if (!svg) return null
  const clone = svg.cloneNode(true) as SVGElement
  clone.setAttribute('width', String(size))
  clone.setAttribute('height', String(size))
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clone)
}

function trigger(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
}

export default function QrCard({ url, slug, lang, size = 200 }: { url: string; slug: string; lang: Lang; size?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  const downloadPng = () => {
    const exportSize = 1200
    const markup = svgMarkup(ref.current, exportSize)
    if (!markup) return
    const image = new Image()
    image.onload = () => {
      const padding = 96
      const canvas = document.createElement('canvas')
      canvas.width = exportSize + padding * 2
      canvas.height = exportSize + padding * 2
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, padding, padding, exportSize, exportSize)
      trigger(canvas.toDataURL('image/png'), `qrnot-${slug}.png`)
    }
    image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`
  }

  const downloadSvg = () => {
    const markup = svgMarkup(ref.current, 1024)
    if (!markup) return
    const href = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
    trigger(href, `qrnot-${slug}.svg`)
    setTimeout(() => URL.revokeObjectURL(href), 4000)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={ref} className="rounded-3xl border border-line bg-white p-5 shadow-[0_12px_30px_-18px_rgba(31,36,64,0.35)]">
        <QRCodeSVG value={url} size={size} level="H" marginSize={0} fgColor="#1f2440" />
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        <button type="button" onClick={downloadPng} className="w-btn w-btn-ghost w-btn-sm">
          ⬇ PNG
        </button>
        <button type="button" onClick={downloadSvg} className="w-btn w-btn-ghost w-btn-sm">
          ⬇ SVG {lang === 'en' ? '(print)' : '(baskı)'}
        </button>
      </div>
    </div>
  )
}
