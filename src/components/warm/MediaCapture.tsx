'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lang } from '@/lib/i18n'

// Yeni temaya uygun, iki dilli ses/video kaydedici + dosya seçici.
// Mantık components/MediaRecorder.tsx ile aynıdır (Safari için MP4, Chromium için WebM).

const T = {
  tr: {
    maxDuration: 'En fazla',
    startAudio: 'Kayda başla',
    startVideo: 'Video çekmeye başla',
    upload: 'Dosya seç',
    stop: 'Durdur',
    change: 'Değiştir',
    notSupported: 'Bu tarayıcı kayıt yapmayı desteklemiyor. "Dosya seç" ile yükleyebilirsin.',
    micNeeded: 'Mikrofon izni gerekli.',
    camNeeded: 'Kamera ve mikrofon izni gerekli.',
    noMic: 'Mikrofon bulunamadı. Videoda ses için mikrofon izni ver.',
    maxReached: 'Süre dolduğu için kayıt durduruldu.',
    wrongAudio: 'Lütfen bir ses dosyası seç.',
    wrongVideo: 'Lütfen bir video dosyası seç.',
    wrongImage: 'Lütfen bir fotoğraf seç.',
    noAudioTrack: 'Videoda ses algılanmadı. Mikrofon iznini kontrol et.',
    recording: 'Kaydediliyor',
    pickPhoto: 'Fotoğraf seç',
  },
  en: {
    maxDuration: 'Up to',
    startAudio: 'Start recording',
    startVideo: 'Start video',
    upload: 'Choose file',
    stop: 'Stop',
    change: 'Change',
    notSupported: 'This browser cannot record. Use "Choose file" to upload instead.',
    micNeeded: 'Microphone permission is required.',
    camNeeded: 'Camera and microphone permission is required.',
    noMic: 'No microphone found. Allow microphone access for video sound.',
    maxReached: 'Recording stopped because the time limit was reached.',
    wrongAudio: 'Please choose an audio file.',
    wrongVideo: 'Please choose a video file.',
    wrongImage: 'Please choose a photo.',
    noAudioTrack: 'No sound detected in the video. Check microphone permission.',
    recording: 'Recording',
    pickPhoto: 'Choose photo',
  },
}

function isSafariLike() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua)
}

function preferredTypes(mode: 'audio' | 'video') {
  if (mode === 'audio') {
    return isSafariLike()
      ? ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  }
  return isSafariLike()
    ? ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']
}

function formatDuration(totalSeconds: number, lang: Lang) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (lang === 'en') return minutes > 0 ? `${minutes} min${seconds ? ` ${seconds} s` : ''}` : `${seconds} s`
  return minutes > 0 ? `${minutes} dk${seconds ? ` ${seconds} sn` : ''}` : `${seconds} sn`
}

function clock(totalSeconds: number) {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

export default function MediaCapture({
  mode,
  lang,
  maxSeconds,
  onChange,
  allowRecord = true,
}: {
  mode: 'audio' | 'video' | 'image'
  lang: Lang
  maxSeconds: number
  onChange: (file: File | null) => void
  allowRecord?: boolean
}) {
  const t = T[lang]
  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const setPreview = (url: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = url
    setPreviewUrl(url)
  }

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = async () => {
    if (mode === 'image') return
    setMessage(null)
    const Recorder = typeof window !== 'undefined' && 'MediaRecorder' in window ? window.MediaRecorder : null
    if (!Recorder || !navigator.mediaDevices?.getUserMedia) {
      setMessage(t.notSupported)
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia(
        mode === 'audio'
          ? { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
          : {
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
              video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            }
      )
    } catch {
      setMessage(mode === 'audio' ? t.micNeeded : t.camNeeded)
      return
    }

    if (mode === 'video' && stream.getAudioTracks().length === 0) {
      stream.getTracks().forEach((track) => track.stop())
      setMessage(t.noMic)
      return
    }

    if (mode === 'video' && liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream
      void liveVideoRef.current.play().catch(() => undefined)
    }

    chunksRef.current = []
    const mimeType = preferredTypes(mode).find((type) => Recorder.isTypeSupported(type))
    const recorder = mimeType ? new Recorder(stream, { mimeType }) : new Recorder(stream)

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onstop = () => {
      const type = recorder.mimeType || (mode === 'audio' ? 'audio/webm' : 'video/webm')
      const blob = new Blob(chunksRef.current, { type })
      const extension = type.includes('mp4') ? 'mp4' : 'webm'
      const file = new File([blob], `${mode}-${Date.now()}.${extension}`, { type })
      stream.getTracks().forEach((track) => track.stop())
      if (liveVideoRef.current) liveVideoRef.current.srcObject = null
      setPreview(URL.createObjectURL(blob))
      setFileName(file.name)
      setStatus('done')
      onChange(file)
    }

    recorderRef.current = recorder
    recorder.start(500)
    setStatus('recording')
    setSeconds(0)
    timerRef.current = setInterval(() => {
      setSeconds((current) => {
        const next = current + 1
        if (next >= maxSeconds) {
          setMessage(t.maxReached)
          stop()
        }
        return Math.min(next, maxSeconds)
      })
    }, 1000)
  }

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith(`${mode}/`)) {
      setMessage(mode === 'audio' ? t.wrongAudio : mode === 'video' ? t.wrongVideo : t.wrongImage)
      return
    }
    setMessage(null)
    setPreview(URL.createObjectURL(file))
    setFileName(file.name)
    setStatus('done')
    onChange(file)
  }

  const reset = () => {
    setPreview(null)
    setFileName('')
    setSeconds(0)
    setStatus('idle')
    setMessage(null)
    onChange(null)
  }

  const accept = mode === 'audio' ? 'audio/*' : mode === 'video' ? 'video/*' : 'image/*'

  return (
    <div className="space-y-3">
      {mode !== 'image' && (
        <p className="text-xs text-muted">
          {t.maxDuration} {formatDuration(maxSeconds, lang)}
        </p>
      )}

      {mode === 'video' && (
        <video
          ref={liveVideoRef}
          muted
          playsInline
          className={status === 'recording' ? 'max-h-72 w-full rounded-2xl bg-ink object-cover' : 'hidden'}
        />
      )}

      {status === 'idle' && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {mode !== 'image' && allowRecord && (
            <button type="button" onClick={start} className="w-btn w-btn-primary flex-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-white" aria-hidden="true" />
              {mode === 'audio' ? t.startAudio : t.startVideo}
            </button>
          )}
          <button type="button" onClick={() => inputRef.current?.click()} className="w-btn w-btn-ghost flex-1">
            {mode === 'image' ? t.pickPhoto : t.upload}
          </button>
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onPick} />
        </div>
      )}

      {status === 'recording' && (
        <div className="flex items-center justify-between rounded-2xl border border-coral/30 bg-coral-soft px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-coral-2">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-coral" aria-hidden="true" />
            {t.recording} · <span className="font-mono">{clock(seconds)} / {clock(maxSeconds)}</span>
          </span>
          <button type="button" onClick={stop} className="w-btn w-btn-dark w-btn-sm">
            {t.stop}
          </button>
        </div>
      )}

      {status === 'done' && previewUrl && (
        <div className="space-y-2">
          {mode === 'audio' && <audio controls src={previewUrl} className="w-full" />}
          {mode === 'video' && <video controls playsInline src={previewUrl} className="max-h-72 w-full rounded-2xl bg-ink" />}
          {mode === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="max-h-72 w-full rounded-2xl border border-line bg-cream-2 object-contain" />
          )}
          <div className="flex items-center justify-between gap-3 text-xs text-muted">
            <span className="truncate">{fileName}</span>
            <button type="button" onClick={reset} className="w-link shrink-0">
              {t.change}
            </button>
          </div>
        </div>
      )}

      {message && <div className="w-alert w-alert-warn">{message}</div>}
    </div>
  )
}
