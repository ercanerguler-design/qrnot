'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface AudioPlayerProps {
  audioUrl: string
  title?: string
}

export default function AudioPlayer({ audioUrl, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [loading, setLoading] = useState(true)

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }, [playing])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoaded = () => setLoading(false)
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrentTime(0) }
    const onDuration = () => setDuration(audio.duration)
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }

    audio.addEventListener('canplaythrough', onLoaded)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('timeupdate', onTimeUpdate)

    return () => {
      audio.removeEventListener('canplaythrough', onLoaded)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [])

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * duration
  }

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 select-none">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {title && (
        <p className="text-white font-medium mb-4 text-sm truncate">{title}</p>
      )}

      {/* Progress bar */}
      <div
        className="w-full h-2 bg-neutral-700 rounded-full cursor-pointer mb-4 relative overflow-hidden"
        onClick={seek}
      >
        <div
          className="h-full bg-violet-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-neutral-500 text-xs">{fmt(currentTime)}</span>
        <button
          onClick={toggle}
          disabled={loading}
          className="w-14 h-14 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-violet-900/40"
          aria-label={playing ? 'Durdur' : 'Oynat'}
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : playing ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <span className="text-neutral-500 text-xs">{fmt(duration)}</span>
      </div>
    </div>
  )
}
