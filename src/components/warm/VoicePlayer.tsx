'use client'

import { useEffect, useRef, useState } from 'react'
import type { Lang } from '@/lib/i18n'

// Yeni temaya uygun büyük "oynat" butonlu ses çalar.

function clock(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export default function VoicePlayer({ src, title, lang, compact = false }: { src: string; title?: string; lang: Lang; compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onReady = () => setReady(true)
    const onTime = () => setCurrent(audio.currentTime)
    const onDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setPlaying(false)
      setCurrent(0)
    }
    const onError = () => {
      setError(true)
      setPlaying(false)
    }
    audio.addEventListener('loadedmetadata', onReady)
    audio.addEventListener('canplay', onReady)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('loadedmetadata', onReady)
      audio.removeEventListener('canplay', onReady)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [src])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (error) {
      setError(false)
      audio.load()
      return
    }
    if (audio.paused) void audio.play().catch(() => setError(true))
    else audio.pause()
  }

  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    audio.currentTime = ((event.clientX - rect.left) / rect.width) * duration
  }

  const progress = duration ? Math.min(100, (current / duration) * 100) : 0
  const size = compact ? 'h-11 w-11' : 'h-16 w-16'

  return (
    <div className={compact ? 'flex items-center gap-3' : 'flex items-center gap-4'}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className={`${size} inline-flex shrink-0 items-center justify-center rounded-full bg-coral text-white shadow-[0_10px_24px_-10px_rgba(232,80,91,0.9)] transition-transform hover:bg-coral-2 active:scale-95`}
        aria-label={playing ? (lang === 'en' ? 'Pause' : 'Duraklat') : lang === 'en' ? 'Play' : 'Oynat'}
      >
        {playing ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-0.5">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        {title && !compact && <p className="mb-2 truncate text-sm font-semibold text-ink">{title}</p>}
        <div className="h-2 cursor-pointer overflow-hidden rounded-full bg-cream-2" onClick={seek} role="presentation">
          <div className="h-full rounded-full bg-coral transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-muted">
          <span>{clock(current)}</span>
          <span>
            {error
              ? lang === 'en'
                ? 'Could not load — tap to retry'
                : 'Yüklenemedi — tekrar dene'
              : !ready
                ? lang === 'en'
                  ? 'Loading…'
                  : 'Yükleniyor…'
                : clock(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
