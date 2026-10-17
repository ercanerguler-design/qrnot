'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

export interface CatalogImage {
  src: string
  width: number
  height: number
  alt: string
}

/** Katalog görseli: tıklayınca tam ekran açılır; ok tuşları / kaydırma ile gezilir, Esc ile kapanır. */
export function CatalogImageButton({ images, index, sizes, priority = false }: { images: CatalogImage[]; index: number; sizes: string; priority?: boolean }) {
  const [open, setOpen] = useState<number | null>(null)
  const image = images[index]

  const close = useCallback(() => setOpen(null), [])
  const step = useCallback((dir: number) => setOpen((cur) => (cur === null ? cur : (cur + dir + images.length) % images.length)), [images.length])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close, step])

  const current = open === null ? null : images[open]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(index)}
        className="group relative block w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_30px_80px_-30px_rgba(255,31,143,0.45)] transition hover:border-white/25"
        aria-label={`${image.alt} — büyüt`}
      >
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={image.alt}
          sizes={sizes}
          priority={priority}
          className="h-auto w-full transition duration-500 group-hover:scale-[1.015]"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
          ⤢ Büyüt
        </span>
      </button>

      {current && (
        <div role="dialog" aria-modal="true" aria-label={current.alt} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm" onClick={close}>
          <div className="relative max-h-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <Image src={current.src} width={current.width} height={current.height} alt={current.alt} sizes="100vw" className="h-auto max-h-[88vh] w-auto rounded-2xl object-contain" />
            <p className="mt-3 text-center text-sm text-white/70">{current.alt}</p>
          </div>
          <button type="button" onClick={close} className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20" aria-label="Kapat">
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  step(-1)
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-xl text-white hover:bg-white/20"
                aria-label="Önceki"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  step(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-xl text-white hover:bg-white/20"
                aria-label="Sonraki"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
