'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { Lang } from '@/lib/i18n'

const T = {
  tr: {
    toolbar: 'Masa kartları — A4 kağıda 4 kart. Kesip masalara koy.',
    pin: 'PIN (karta yazılacak)',
    print: 'Yazdır',
    scan: 'Bize bir anı bırak',
    line: 'Telefonunun kamerasıyla okut; sesli mesaj, video ya da fotoğraf bırak.',
    pinLabel: 'PIN',
    noApp: 'Uygulama gerekmez',
  },
  en: {
    toolbar: 'Table cards — 4 cards per A4 sheet. Cut and place on tables.',
    pin: 'PIN (printed on the card)',
    print: 'Print',
    scan: 'Leave us a memory',
    line: 'Scan with your phone camera and leave a voice message, video or photo.',
    pinLabel: 'PIN',
    noApp: 'No app needed',
  },
}

export default function PrintCards({ lang, url, eventName, pinRequired }: { lang: Lang; url: string; eventName: string; pinRequired: boolean }) {
  const t = T[lang]
  const [pin, setPin] = useState('')

  return (
    <div className="min-h-screen bg-[#ece7e2] print:bg-white">
      <style>{`@media print { @page { size: A4; margin: 0; } .no-print { display: none !important; } }`}</style>
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 text-ink">
        <p className="text-sm">{t.toolbar}</p>
        <div className="flex items-center gap-2">
          {pinRequired && (
            <input
              className="w-input w-40 py-2"
              inputMode="numeric"
              placeholder={t.pin}
              value={pin}
              maxLength={8}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />
          )}
          <button type="button" className="w-btn w-btn-primary w-btn-sm" onClick={() => window.print()}>
            🖨️ {t.print}
          </button>
        </div>
      </div>

      <div className="mx-auto my-6 grid h-[297mm] w-[210mm] grid-cols-2 grid-rows-2 bg-white shadow-xl print:my-0 print:shadow-none">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex flex-col items-center justify-center border border-dashed border-[#d9cfc7] p-8 text-center text-[#1f2440]">
            <p className="font-display text-[13px] uppercase tracking-[0.3em] text-[#c9963a]">♥</p>
            <h2 className="font-display mt-2 text-2xl font-semibold leading-tight">{eventName}</h2>
            <p className="font-display mt-1 text-lg italic text-[#e8505b]">{t.scan}</p>
            <div className="my-5 rounded-2xl border border-[#efe1d6] p-3">
              <QRCodeSVG value={url} size={150} level="H" marginSize={0} fgColor="#1f2440" />
            </div>
            <p className="max-w-[70mm] text-[12px] leading-snug text-[#4a4f6a]">{t.line}</p>
            {pinRequired && (
              <p className="mt-3 rounded-full bg-[#fdeee4] px-4 py-1 font-mono text-sm font-semibold tracking-[0.3em]">
                {t.pinLabel}: {pin || '••••'}
              </p>
            )}
            <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#7b7f96]">{t.noApp} · qrnot.com</p>
          </div>
        ))}
      </div>
    </div>
  )
}
