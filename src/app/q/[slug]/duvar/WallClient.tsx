'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
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
    noAccess: 'Canlı duvarı sadece anı defteri sahibi açabilir. Yönetim panelindeki “Canlı duvar” butonunu kullan.',
    scan: 'Sen de bir anı bırak',
    scanHint: 'Telefon kameranla okut',
    waiting: 'İlk anılar bekleniyor…',
    voice: '🎙️ Sesli mesaj bıraktı',
    video: '🎬 Video bıraktı',
    count: 'anı',
    fullscreen: '⛶ Tam ekran',
  },
  en: {
    noAccess: 'Only the guestbook owner can open the live wall. Use the “Live wall” button in your panel.',
    scan: 'Leave a memory too',
    scanHint: 'Scan with your phone camera',
    waiting: 'Waiting for the first memories…',
    voice: '🎙️ Left a voice message',
    video: '🎬 Left a video',
    count: 'memories',
    fullscreen: '⛶ Fullscreen',
  },
}

const POLL_MS = 8000
const ROTATE_MS = 9000

export default function WallClient({ slug, lang, eventName, isPublic, qrUrl }: { slug: string; lang: Lang; eventName: string; isPublic: boolean; qrUrl: string }) {
  const t = T[lang]
  const [token, setToken] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)
  const [items, setItems] = useState<Memory[]>([])
  const [featured, setFeatured] = useState(0)
  const [fresh, setFresh] = useState<string[]>([])
  const known = useRef<Set<string>>(new Set())

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('token')
    const tk = fromUrl || localStorage.getItem(`qrnote_token_${slug}`) || ''
    const raf = window.requestAnimationFrame(() => setToken(tk))
    return () => window.cancelAnimationFrame(raf)
  }, [slug])

  useEffect(() => {
    if (token === null) return
    if (!token && !isPublic) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDenied(true)
      return
    }
    let alive = true
    const poll = async () => {
      try {
        const res = await fetch(`/api/qr/${slug}/guestbook/entries${token ? `?token=${encodeURIComponent(token)}` : ''}`, { cache: 'no-store' })
        const data = await res.json()
        if (!alive) return
        const approved = ((data.entries || []) as Memory[]).filter((e) => e.status === 'approved')
        const newIds = approved.map((e) => e.id).filter((id) => !known.current.has(id))
        if (known.current.size > 0 && newIds.length) {
          setFresh(newIds)
          setFeatured(0) // en yeni anıyı öne çıkar
        }
        newIds.forEach((id) => known.current.add(id))
        setItems(approved)
      } catch {
        /* bağlantı kopsa da duvar açık kalsın; bir sonraki turda tekrar denenir */
      }
    }
    void poll()
    const id = window.setInterval(poll, POLL_MS)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [slug, token, isPublic])

  useEffect(() => {
    if (items.length < 2) return
    const id = window.setInterval(() => setFeatured((i) => (i + 1) % items.length), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [items.length])

  const mediaSrc = (id: string) => `/api/qr/${slug}/guestbook/entries/${id}/media${token ? `?token=${encodeURIComponent(token)}` : ''}`

  if (denied) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0b0810] p-6 text-center text-white/80">{t.noAccess}</div>
  }

  const main = items[featured] || null
  const rest = items.filter((_, i) => i !== featured).slice(0, 8)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0810] p-6 text-white lg:p-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-[#f3c66b]/15 blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 h-[660px] w-[660px] rounded-full bg-[#ff5fa8]/15 blur-[140px]" />
      </div>

      <header className="relative flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f3c66b]">QRNot</p>
          <h1 className="font-display mt-2 text-4xl font-semibold lg:text-6xl">{eventName}</h1>
          <p className="mt-2 text-white/60">
            {items.length} {t.count}
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-3xl bg-white p-4 text-[#1a1020]">
          <QRCodeSVG value={qrUrl} size={120} level="M" />
          <div className="max-w-[10rem]">
            <p className="font-bold">{t.scan}</p>
            <p className="mt-1 text-xs text-[#5a4a63]">{t.scanHint}</p>
          </div>
        </div>
      </header>

      <main className="relative mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="flex min-h-[60vh] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.05] p-8">
          {!main ? (
            <p className="text-xl text-white/60">{t.waiting}</p>
          ) : (
            <div key={main.id} className="flex w-full animate-[wallIn_.7s_ease] flex-col items-center gap-5 text-center">
              {main.media_type === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaSrc(main.id)} alt={main.author_name} className="max-h-[48vh] rounded-3xl object-contain" />
              )}
              {main.media_type === 'video' && <video src={mediaSrc(main.id)} autoPlay muted loop playsInline className="max-h-[48vh] rounded-3xl bg-black" />}
              {main.media_type === 'audio' && <p className="text-2xl text-[#ff8fb8]">{t.voice}</p>}
              {main.message && <p className="font-display max-w-3xl whitespace-pre-line text-3xl leading-snug lg:text-5xl">“{main.message}”</p>}
              <p className="text-2xl font-semibold text-[#f3c66b]">— {main.author_name}</p>
            </div>
          )}
        </section>

        <section className="grid content-start gap-3">
          {rest.map((m) => (
            <article
              key={m.id}
              className={`rounded-2xl border p-4 transition ${fresh.includes(m.id) ? 'border-[#f3c66b] bg-[#f3c66b]/10' : 'border-white/10 bg-white/[0.04]'}`}
            >
              <p className="font-semibold text-[#f3c66b]">{m.author_name}</p>
              <p className="mt-1 line-clamp-3 text-white/80">
                {m.message || (m.media_type === 'audio' ? t.voice : m.media_type === 'video' ? t.video : '📷')}
              </p>
            </article>
          ))}
        </section>
      </main>

      <button
        type="button"
        onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}
        className="fixed bottom-4 right-4 rounded-full bg-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/20"
      >
        {t.fullscreen}
      </button>
      <style>{`@keyframes wallIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}
