'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'

interface QRDisplayProps {
  url: string
  size?: number
}

export default function QRDisplay({ url, size = 220 }: QRDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const downloadQR = () => {
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return

    // Clone and enforce explicit dimensions + namespace so canvas can draw it
    const cloned = svgEl.cloneNode(true) as SVGElement
    cloned.setAttribute('width', String(size))
    cloned.setAttribute('height', String(size))
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const svgData = new XMLSerializer().serializeToString(cloned)
    // Base64 data URI is more reliable than blob URLs across browsers (no CORS tainting)
    const base64 = btoa(unescape(encodeURIComponent(svgData)))
    const dataUri = `data:image/svg+xml;base64,${base64}`

    const canvas = document.createElement('canvas')
    const padding = 32
    canvas.width = size + padding * 2
    canvas.height = size + padding * 2

    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size)
      const link = document.createElement('a')
      link.download = 'qrnote.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.onerror = () => {
      // Fallback: download raw SVG if canvas fails
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.download = 'qrnote.svg'
      link.href = URL.createObjectURL(blob)
      link.click()
      setTimeout(() => URL.revokeObjectURL(link.href), 5000)
    }
    img.src = dataUri
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="bg-white p-5 rounded-2xl shadow-xl shadow-black/30"
      >
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          includeMargin={false}
          fgColor="#1a1a2e"
        />
      </div>
      <button
        onClick={downloadQR}
        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-sm px-5 py-2.5 rounded-xl transition-all active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        QR Kodu İndir (PNG)
      </button>
    </div>
  )
}
