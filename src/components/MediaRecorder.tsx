'use client'

import { useCallback, useRef, useState } from 'react'
import { formatAudioDuration, getMaxAudioSeconds } from '@/lib/audio'

interface MediaRecorderProps {
  mode: 'audio' | 'video'
  maxVideoSeconds: number
  onMediaReady: (file: File) => void
}

function isSafariLikeBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isSafari = /Safari/i.test(ua)
  const isChromium = /Chrome|Chromium|Edg|OPR/i.test(ua)
  return isSafari && !isChromium
}

function getPreferredVideoMimeTypes() {
  // Chromium engines are typically most reliable with WebM+Opus,
  // while Safari-family browsers generally need MP4.
  if (isSafariLikeBrowser()) {
    return [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=h264,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ]
  }

  return [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=h264,mp4a.40.2',
    'video/mp4',
  ]
}

async function hasDecodableAudioTrack(blob: Blob) {
  if (typeof window === 'undefined' || !blob.size) return false

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return false

  const ctx = new AudioContextCtor()
  try {
    const buffer = await blob.arrayBuffer()
    const decoded = await ctx.decodeAudioData(buffer.slice(0))
    return decoded.duration > 0 && decoded.numberOfChannels > 0
  } catch {
    return false
  } finally {
    await ctx.close()
  }
}

export default function MediaRecorder({ mode, maxVideoSeconds, onMediaReady }: MediaRecorderProps) {
  const maxSeconds = mode === 'audio' ? getMaxAudioSeconds() : maxVideoSeconds
  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const stopInternal = useCallback(() => {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    setMessage(null)

    try {
      const BrowserMediaRecorder =
        typeof window !== 'undefined' && 'MediaRecorder' in window
          ? window.MediaRecorder
          : null

      if (!BrowserMediaRecorder) {
        setMessage('Bu tarayici medya kaydini desteklemiyor.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia(
        mode === 'audio'
          ? {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            }
          : {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user',
              },
            }
      )

      if (mode === 'video' && stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((track) => track.stop())
        setMessage('Mikrofon bulunamadi. Video sesi icin mikrofon izni ver.')
        return
      }

      streamRef.current = stream
      chunksRef.current = []

      const preferredMimeTypes = mode === 'audio'
        ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        : getPreferredVideoMimeTypes()

      const selectedMimeType = preferredMimeTypes.find((mimeType) => BrowserMediaRecorder.isTypeSupported(mimeType))
      const recorder = selectedMimeType
        ? new BrowserMediaRecorder(stream, { mimeType: selectedMimeType })
        : new BrowserMediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blobType = recorder.mimeType || (mode === 'audio' ? 'audio/webm' : 'video/webm')
        const blob = new Blob(chunksRef.current, { type: blobType })
        const extension = blobType.includes('mp4') ? 'mp4' : 'webm'
        const file = new File([blob], `${mode}-recording-${Date.now()}.${extension}`, { type: blobType })

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }

        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setFileName(file.name)
        setStatus('done')
        onMediaReady(file)

        if (mode === 'video') {
          void hasDecodableAudioTrack(blob).then((hasAudio) => {
            if (!hasAudio) {
              setMessage('Video kaydinda ses algilanmadi. Mikrofon girisini ve izinleri kontrol et.')
            }
          })
        }

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start(500)
      setStatus('recording')
      setSeconds(0)

      timerRef.current = setInterval(() => {
        setSeconds((current) => {
          const next = current + 1
          if (next >= maxSeconds) {
            setMessage(`Maksimum ${formatAudioDuration(maxSeconds)} doldugu icin kayit durduruldu.`)
            stopInternal()
          }
          return Math.min(next, maxSeconds)
        })
      }, 1000)
    } catch {
      setMessage(mode === 'audio' ? 'Mikrofon izni gerekli.' : 'Kamera ve mikrofon izni gerekli.')
    }
  }, [maxSeconds, mode, onMediaReady, previewUrl, stopInternal])

  const reset = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setFileName('')
    setSeconds(0)
    setStatus('idle')
    setMessage(null)
  }, [previewUrl])

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const expectedPrefix = `${mode}/`
    if (!file.type.startsWith(expectedPrefix)) {
      setMessage(mode === 'audio' ? 'Lutfen bir ses dosyasi sec.' : 'Lutfen bir video dosyasi sec.')
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setFileName(file.name)
    setStatus('done')
    setMessage(null)
    onMediaReady(file)
  }

  const stopLabel = mode === 'audio' ? 'Kaydi Durdur' : 'Videoyu Durdur'

  return (
    <div className="space-y-4">
      <p className="text-neutral-500 text-xs">Maksimum sure: {formatAudioDuration(maxSeconds)}</p>

      {status === 'idle' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={start}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {mode === 'audio' ? 'Kayit Baslat' : 'Video Kaydina Basla'}
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 rounded-xl border border-neutral-700 transition-all"
          >
            Dosya Yukle
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={mode === 'audio' ? 'audio/*' : 'video/*'}
            className="hidden"
            onChange={onUpload}
          />
        </div>
      )}

      {status === 'recording' && (
        <div className="flex items-center justify-between bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
          <span className="text-red-300 text-sm font-mono">{Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')} / {Math.floor(maxSeconds / 60)}:{(maxSeconds % 60).toString().padStart(2, '0')}</span>
          <button
            onClick={stopInternal}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            {stopLabel}
          </button>
        </div>
      )}

      {status === 'done' && previewUrl && (
        <div className="space-y-3">
          <div className="bg-green-950/40 border border-green-800 rounded-xl px-4 py-3 text-green-300 text-sm truncate">{fileName}</div>
          {mode === 'audio' ? (
            <audio controls src={previewUrl} className="w-full h-10" />
          ) : (
            <video controls src={previewUrl} className="w-full rounded-xl border border-neutral-700 max-h-72 bg-black" />
          )}
          <button
            onClick={reset}
            className="text-neutral-400 hover:text-neutral-200 text-sm underline"
          >
            Degistir
          </button>
        </div>
      )}

      {message && (
        <div className="bg-amber-950/40 border border-amber-800 text-amber-400 text-sm px-4 py-3 rounded-xl">
          {message}
        </div>
      )}
    </div>
  )
}
