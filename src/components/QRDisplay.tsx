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

    const canvas = document.createElement('canvas')
    const padding = 32
    canvas.width = size + padding * 2
    canvas.height = size + padding * 2

    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const img = new Image()
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const svgUrl = URL.createObjectURL(blob)

    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size)
      URL.revokeObjectURL(svgUrl)
      const link = document.createElement('a')
      link.download = 'qrnote.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = svgUrl
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
