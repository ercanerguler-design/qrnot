'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lang } from '@/lib/i18n'

interface Memory {
  id: string
  author_name: string
  message: string
  media_type: string | null
  status: string
  created_at: string
}

const T = {
  tr: {
    loading: 'Anılar yükleniyor…',
    noAccess: 'Bu filmi sadece anı defteri sahibi izleyebilir. Sahip linkinle aç ya da yönetim panelinden “Herkese açık duvar”ı aç.',
    empty: 'Henüz onaylanmış anı yok.',
    start: '▶ Filmi başlat',
    memories: 'anı',
    thanks: 'Bu güzel anılar için teşekkürler 💛',
    replay: '↺ Baştan izle',
    prev: 'Önceki',
    next: 'Sonraki',
    pause: 'Duraklat',
    play: 'Oynat',
    fullscreen: 'Tam ekran',
    voice: 'sesli mesaj bıraktı',
  },
  en: {
    loading: 'Loading memories…',
    noAccess: 'Only the guestbook owner can watch this film. Open it with your owner link, or turn on the public wall in your panel.',
    empty: 'No approved memories yet.',
    start: '▶ Start the film',
    memories: 'memories',
    thanks: 'Thank you for these beautiful memories 💛',
    replay: '↺ Watch again',
    prev: 'Previous',
    next: 'Next',
    pause: 'Pause',
    play: 'Play',
    fullscreen: 'Fullscreen',
    voice: 'left a voice message',
  },
}

const TEXT_MS = 7000
const IMAGE_MS = 6500

export default function FilmClient({ slug, lang, eventName, welcome, isPublic }: { slug: string; lang: Lang; eventName: string; welcome: string; isPublic: boolean }) {
  const t = T[lang]
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'denied' | 'ready'>('loading')
  const [items, setItems] = useState<Memory[]>([])
  const [index, setIndex] = useState(-1) // -1: kapak, items.length: kapanış
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const mediaRef = useRef<HTMLMediaElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('token')
    const stored = localStorage.getItem(`qrnote_token_${slug}`)
    const tk = fromUrl || stored
    const raf = window.requestAnimationFrame(() => setToken(tk || ''))
    return () => window.cancelAnimationFrame(raf)
  }, [slug])

  useEffect(() => {
    if (token === null) return
    if (!token && !isPublic) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState('denied')
      return
    }
    fetch(`/api/qr/${slug}/guestbook/entries${token ? `?token=${encodeURIComponent(token)}` : ''}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const list = ((data.entries || []) as Memory[]).filter((e) => e.status === 'approved').sort((a, b) => a.created_at.localeCompare(b.created_at))
        setItems(list)
        setState('ready')
      })
      .catch(() => setState('denied'))
  }, [slug, token, isPublic])

  const mediaSrc = (id: string) => `/api/qr/${slug}/guestbook/entries/${id}/media${token ? `?token=${encodeURIComponent(token)}` : ''}`
  const current = index >= 0 && index < items.length ? items[index] : null
  const go = useCallback((next: number) => {
    setProgress(0)
    setIndex(Math.max(-1, Math.min(next, items.length)))
  }, [items.length])

  // Yazı ve fotoğraf slaytları zamanlayıcıyla ilerler; ses / video bitince ilerler
  useEffect(() => {
    if (!playing || !current) return
    if (current.media_type === 'audio' || current.media_type === 'video') return
    const duration = current.media_type === 'image' ? IMAGE_MS : TEXT_MS
    const started = Date.now()
    const id = window.setInterval(() => {
      const p = (Date.now() - started) / duration
      setProgress(Math.min(1, p))
      if (p >= 1) {
        window.clearInterval(id)
        go(index + 1)
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [playing, current, index, go])

  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    if (playing) void el.play().catch(() => undefined)
    else el.pause()
  }, [playing, index])

  const start = () => {
    setPlaying(true)
    go(0)
    rootRef.current?.requestFullscreen?.().catch(() => undefined)
  }

  if (state === 'loading') return <Shell><p className="text-white/70">{t.loading}</p></Shell>
  if (state === 'denied') return <Shell><p className="max-w-md text-center text-white/80">{t.noAccess}</p></Shell>
  if (items.length === 0) return <Shell><p className="text-white/80">{t.empty}</p></Shell>

  return (
    <div ref={rootRef} className="relative flex min-h-screen flex-col overflow-hidden bg-[#0b0810] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#f3c66b]/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full bg-[#ff5fa8]/20 blur-[130px]" />
      </div>

      <div className="relative flex flex-1 items-center justify-center p-6">
        {index === -1 && (
          <div className="max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f3c66b]">QRNot</p>
            <h1 className="font-display mt-4 text-5xl font-semibold sm:text-7xl">{eventName}</h1>
            {welcome && <p className="mx-auto mt-5 max-w-lg whitespace-pre-line text-lg text-white/75">{welcome}</p>}
            <p className="mt-6 text-white/60">
              {items.length} {t.memories}
            </p>
            <button type="button" onClick={start} className="mt-8 rounded-full bg-gradient-to-r from-[#f3c66b] to-[#ff5fa8] px-8 py-4 text-lg font-bold text-[#1a1020]">
              {t.start}
            </button>
          </div>
        )}

        {current && (
          <div key={current.id} className="flex w-full max-w-4xl animate-[fadeIn_.6s_ease] flex-col items-center gap-6 text-center">
            {current.media_type === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaSrc(current.id)} alt={current.author_name} className="max-h-[62vh] rounded-3xl object-contain shadow-2xl" />
            )}
            {current.media_type === 'video' && (
              <video
                ref={(el) => {
                  mediaRef.current = el
                }}
                src={mediaSrc(current.id)}
                playsInline
                autoPlay={playing}
                className="max-h-[62vh] rounded-3xl bg-black shadow-2xl"
                onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
                onEnded={() => go(index + 1)}
              />
            )}
            {current.media_type === 'audio' && (
              <div className="flex flex-col items-center gap-5">
                <div className="flex h-24 items-center gap-1.5">
                  {Array.from({ length: 28 }, (_, i) => (
                    <i
                      key={i}
                      className="block w-2 rounded-full bg-[#ff5fa8]"
                      style={{ height: `${25 + ((i * 37) % 70)}%`, opacity: playing ? 1 : 0.4, animation: playing ? `pulse 1.${i % 9}s ease-in-out infinite` : undefined }}
                    />
                  ))}
                </div>
                <p className="text-white/60">🎙️ {t.voice}</p>
                <audio
                  ref={(el) => {
                    mediaRef.current = el
                  }}
                  src={mediaSrc(current.id)}
                  autoPlay={playing}
                  onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
                  onEnded={() => go(index + 1)}
                />
              </div>
            )}
            {current.message && <p className="font-display max-w-3xl whitespace-pre-line text-2xl leading-relaxed sm:text-4xl">“{current.message}”</p>}
            <p className="text-xl font-semibold text-[#f3c66b]">— {current.author_name}</p>
          </div>
        )}

        {index === items.length && (
          <div className="text-center">
            <h2 className="font-display text-4xl font-semibold sm:text-6xl">{eventName}</h2>
            <p className="mt-4 text-xl text-white/80">{t.thanks}</p>
            <button type="button" onClick={start} className="mt-8 rounded-full border border-white/30 px-7 py-3 font-semibold">
              {t.replay}
            </button>
          </div>
        )}
      </div>

      {index >= 0 && index < items.length && (
        <div className="relative space-y-3 p-4">
          <div className="h-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-gradient-to-r from-[#f3c66b] to-[#ff5fa8] transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="flex items-center justify-center gap-3 text-sm">
            <button type="button" className="rounded-full bg-white/10 px-4 py-2" onClick={() => go(index - 1)}>
              ‹ {t.prev}
            </button>
            <button type="button" className="rounded-full bg-white/20 px-5 py-2 font-semibold" onClick={() => setPlaying((p) => !p)}>
              {playing ? `❚❚ ${t.pause}` : `▶ ${t.play}`}
            </button>
            <button type="button" className="rounded-full bg-white/10 px-4 py-2" onClick={() => go(index + 1)}>
              {t.next} ›
            </button>
            <span className="ml-2 tabular-nums text-white/60">
              {index + 1} / {items.length}
            </span>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes pulse{0%,100%{transform:scaleY(.6)}50%{transform:scaleY(1)}}`}</style>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#0b0810] p-6">{children}</div>
}
