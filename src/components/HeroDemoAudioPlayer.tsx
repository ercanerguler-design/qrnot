'use client'

import { useEffect, useRef, useState } from 'react'

const DEMO_AUDIO_URL = '/demo-voice.wav'

function formatSeconds(value: number) {
  const safe = Math.max(0, Math.ceil(value || 0))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function HeroDemoAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState(formatSeconds(0))
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleToggle = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    try {
      setError(null)
      await audioRef.current.play()
      setIsPlaying(true)
    } catch {
      setError('Ses oynatilamadi')
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => {
      const total = Number.isFinite(audio.duration) ? audio.duration : 0
      setTimeLeft(formatSeconds(total))
    }

    const onTimeUpdate = () => {
      const total = Number.isFinite(audio.duration) ? audio.duration : 0
      const current = audio.currentTime || 0
      const ratio = total > 0 ? Math.min(current / total, 1) : 0
      setProgress(ratio)
      setTimeLeft(formatSeconds(total - current))
    }

    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setTimeLeft(formatSeconds(audio.duration || 0))
      audio.currentTime = 0
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
      <audio ref={audioRef} preload="metadata" src={DEMO_AUDIO_URL} />
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={() => void handleToggle()}
          className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/50"
          aria-label={isPlaying ? 'Sesi durdur' : 'Sesi oynat'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M7 6h4v12H7zM13 6h4v12h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className="bg-neutral-700 rounded-full h-1.5 w-full">
            <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
        <span className="text-neutral-500 text-xs">{timeLeft}</span>
      </div>
      <p className="text-[11px] text-neutral-500 text-left">Play ile ornek ses kaydi oynatilir.</p>
      {error ? <p className="text-[11px] text-red-300 mt-1">{error}</p> : null}
    </div>
  )
}
