'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lang } from '@/lib/i18n'
import { setCaptionAudio } from '@/lib/captionAudio'

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
    checking: 'Dosya kontrol ediliyor…',
    tooLong: (max: string) => `Bu kayıt ${max} sınırından uzun. Lütfen kısaltıp tekrar seç.`,
    tooBig: (mb: number) => `Dosya çok büyük (en fazla ${mb} MB). Videoyu kısalt ya da telefonda 1080p çözünürlükte çek.`,
    tooBigIos: (mb: number) =>
      `Dosya çok büyük (en fazla ${mb} MB). iPhone 4K çekimleri çok yer kaplar: Ayarlar › Kamera › Video Kaydı › “1080p HD, 30 fps” seçip yeniden çek ya da videoyu Fotoğraflar’da kısalt.`,
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
    checking: 'Checking file…',
    tooLong: (max: string) => `This recording is longer than ${max}. Please trim it and choose again.`,
    tooBig: (mb: number) => `The file is too large (max ${mb} MB). Trim the video or record it at 1080p on your phone.`,
    tooBigIos: (mb: number) =>
      `The file is too large (max ${mb} MB). iPhone 4K videos are very large: go to Settings › Camera › Record Video › “1080p HD at 30 fps” and record again, or trim the video in Photos.`,
  },
}

// Bazı telefonlar (özellikle Android ve .mov/.mkv dosyaları) dosya türünü boş gönderir; uzantıdan tamamlanır.
const MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  '3gp': 'video/3gpp',
  avi: 'video/x-msvideo',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
}

function normalizeFile(file: File, mode: 'audio' | 'video' | 'image'): File | null {
  const type = (file.type || '').toLowerCase()
  if (type.startsWith(`${mode}/`)) return file
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  let guessed = MIME_BY_EXT[ext]
  if (ext === 'webm' && mode === 'audio') guessed = 'audio/webm'
  if (!guessed || !guessed.startsWith(`${mode}/`)) return null
  if (type && type !== 'application/octet-stream') return null
  return new File([file], file.name, { type: guessed, lastModified: file.lastModified })
}

/** Tarayıcının okuyabildiği süre (sn). Okunamazsa null: karar sunucuya ve sınıra bırakılır. */
function readDuration(url: string, mode: 'audio' | 'video'): Promise<number | null> {
  return new Promise((resolve) => {
    const el = document.createElement(mode)
    let done = false
    const finish = (value: number | null) => {
      if (done) return
      done = true
      el.removeAttribute('src')
      el.load()
      resolve(value)
    }
    const timer = setTimeout(() => finish(null), 8000)
    el.preload = 'metadata'
    el.muted = true
    el.onloadedmetadata = () => {
      clearTimeout(timer)
      finish(Number.isFinite(el.duration) && el.duration > 0 ? el.duration : null)
    }
    el.onerror = () => {
      clearTimeout(timer)
      finish(null)
    }
    el.src = url
  })
}

function isSafariLike() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua)
}

function isAppleMobile() {
  if (typeof navigator === 'undefined') return false
  // iPadOS kendini Mac olarak tanıtır; dokunmatik ekranla ayırt edilir.
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
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
  maxBytes,
}: {
  mode: 'audio' | 'video' | 'image'
  lang: Lang
  maxSeconds: number
  onChange: (file: File | null) => void
  allowRecord?: boolean
  /** Seçilen dosya için üst sınır (bayt); yüklemeye başlamadan uyarır. */
  maxBytes?: number
}) {
  const t = T[lang]
  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
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
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') audioRecorderRef.current.stop()
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

    // Videoda sesi ayrıca, düşük bit hızıyla kaydet: büyük videolarda altyazı bu küçük dosyadan üretilir.
    let captionAudio: Promise<File | null> = Promise.resolve(null)
    if (mode === 'video') {
      try {
        const audioType = preferredTypes('audio').find((type) => Recorder.isTypeSupported(type))
        const audioRecorder = new Recorder(new MediaStream(stream.getAudioTracks()), {
          ...(audioType ? { mimeType: audioType } : {}),
          audioBitsPerSecond: 48000,
        })
        const audioChunks: Blob[] = []
        audioRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunks.push(event.data)
        }
        captionAudio = new Promise((resolve) => {
          audioRecorder.onstop = () => {
            const type = audioRecorder.mimeType || 'audio/webm'
            resolve(new File(audioChunks, `ses-${Date.now()}.${type.includes('mp4') ? 'm4a' : 'webm'}`, { type }))
          }
          audioRecorder.onerror = () => resolve(null)
        })
        audioRecorderRef.current = audioRecorder
        audioRecorder.start(1000)
      } catch {
        audioRecorderRef.current = null
      }
    }

    recorder.onstop = async () => {
      const type = recorder.mimeType || (mode === 'audio' ? 'audio/webm' : 'video/webm')
      const blob = new Blob(chunksRef.current, { type })
      const extension = type.includes('mp4') ? 'mp4' : 'webm'
      const file = new File([blob], `${mode}-${Date.now()}.${extension}`, { type })
      const audio = await Promise.race([captionAudio, new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))])
      if (audio && audio.size > 0) setCaptionAudio(file, audio)
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

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return
    const file = normalizeFile(picked, mode)
    if (!file) {
      setMessage(mode === 'audio' ? t.wrongAudio : mode === 'video' ? t.wrongVideo : t.wrongImage)
      return
    }
    if (maxBytes && file.size > maxBytes) {
      const mb = Math.floor(maxBytes / 1024 / 1024)
      setMessage(isAppleMobile() ? t.tooBigIos(mb) : t.tooBig(mb))
      return
    }
    const url = URL.createObjectURL(file)
    if (mode !== 'image') {
      setMessage(t.checking)
      const duration = await readDuration(url, mode)
      if (duration !== null && duration > maxSeconds + 1) {
        URL.revokeObjectURL(url)
        setMessage(t.tooLong(formatDuration(maxSeconds, lang)))
        return
      }
    }
    setMessage(null)
    setPreview(url)
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
