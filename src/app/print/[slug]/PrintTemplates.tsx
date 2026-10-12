'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { Lang } from '@/lib/i18n'

type Template = 'card' | 'tag' | 'sticker'

const T = {
  en: {
    toolbar: 'Choose a template, edit the text, then print on A4 (scale 100%).',
    card: 'Gift cards (4 / A4)',
    tag: 'Gift tags (8 / A4)',
    sticker: 'Round stickers (12 / A4)',
    top: 'Top text',
    bottom: 'Bottom text',
    print: 'Print',
    defaultTop: 'A message for you',
    defaultBottom: 'Scan to listen ♥',
  },
  tr: {
    toolbar: 'Şablonu seç, yazıları düzenle ve A4 olarak yazdır (ölçek %100).',
    card: "Hediye kartı (A4'te 4)",
    tag: "Hediye etiketi (A4'te 8)",
    sticker: "Yuvarlak sticker (A4'te 12)",
    top: 'Üst yazı',
    bottom: 'Alt yazı',
    print: 'Yazdır',
    defaultTop: 'Sana bir mesajım var',
    defaultBottom: 'Okut ve dinle ♥',
  },
}

const LAYOUT: Record<Template, { cols: number; rows: number; qr: number }> = {
  card: { cols: 2, rows: 2, qr: 170 },
  tag: { cols: 2, rows: 4, qr: 110 },
  sticker: { cols: 3, rows: 4, qr: 92 },
}

export default function PrintTemplates({ lang, url }: { lang: Lang; url: string }) {
  const t = T[lang]
  const [template, setTemplate] = useState<Template>('card')
  const [top, setTop] = useState(t.defaultTop)
  const [bottom, setBottom] = useState(t.defaultBottom)
  const layout = LAYOUT[template]
  const count = layout.cols * layout.rows

  return (
    <div className="min-h-screen bg-[#ece7e2] print:bg-white">
      <style>{`@media print { @page { size: A4; margin: 0; } .no-print { display: none !important; } }`}</style>
      <div className="no-print sticky top-0 z-10 space-y-3 border-b border-line bg-paper px-4 py-3 text-ink">
        <p className="text-sm text-ink-2">{t.toolbar}</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-seg grid-cols-3" role="group">
            {(['card', 'tag', 'sticker'] as const).map((key) => (
              <button key={key} type="button" aria-pressed={template === key} onClick={() => setTemplate(key)}>
                {t[key]}
              </button>
            ))}
          </div>
          <input className="w-input w-48 py-2" value={top} maxLength={40} onChange={(e) => setTop(e.target.value)} aria-label={t.top} />
          <input className="w-input w-48 py-2" value={bottom} maxLength={40} onChange={(e) => setBottom(e.target.value)} aria-label={t.bottom} />
          <button type="button" className="w-btn w-btn-primary w-btn-sm" onClick={() => window.print()}>
            🖨️ {t.print}
          </button>
        </div>
      </div>

      <div
        className="mx-auto my-6 grid h-[297mm] w-[210mm] bg-white p-[8mm] shadow-xl print:my-0 print:shadow-none"
        style={{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)`, gridTemplateRows: `repeat(${layout.rows}, 1fr)` }}
      >
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center justify-center p-[3mm]">
            <div
              className={`flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-[#d9cfc7] text-center text-[#1f2440] ${
                template === 'sticker' ? 'aspect-square max-h-full w-auto rounded-full' : 'rounded-2xl'
              }`}
            >
              {template !== 'sticker' && <p className="font-display px-2 text-lg font-semibold leading-tight">{top}</p>}
              <QRCodeSVG value={url} size={layout.qr} level="H" marginSize={0} fgColor="#1f2440" />
              <p className={`font-display px-2 italic text-[#e8505b] ${template === 'sticker' ? 'text-[11px]' : 'text-base'}`}>{bottom}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
