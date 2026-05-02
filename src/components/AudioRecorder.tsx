'use client'

import { useState, useRef, useCallback } from 'react'

interface AudioRecorderProps {
  onAudioReady: (file: File) => void
}

export default function AudioRecorder({ onAudioReady }: AudioRecorderProps) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'done'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setFileName(file.name)
        onAudioReady(file)
        setMode('done')
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setMode('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      alert('Mikrofon erişimi reddedildi. Lütfen izin ver.')
    }
  }, [onAudioReady])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setFileName('')
    setSeconds(0)
    setMode('idle')
  }, [previewUrl])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      alert('Lütfen bir ses dosyası seçin.')
      return
    }
    const url = URL.createObjectURL(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(url)
    setFileName(file.name)
    onAudioReady(file)
    setMode('done')
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="w-full space-y-4">
      {mode === 'idle' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={startRecording}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition-all active:scale-95"
          >
            <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
            Kayıt Başlat
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 rounded-xl border border-neutral-700 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Dosya Yükle
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {mode === 'recording' && (
        <div className="flex items-center justify-between bg-red-950/40 border border-red-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-mono text-lg">{fmt(seconds)}</span>
            <span className="text-red-500 text-sm">Kayıt devam ediyor...</span>
          </div>
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-semibold transition-all active:scale-95"
          >
            Durdur
          </button>
        </div>
      )}

      {mode === 'done' && previewUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-green-950/30 border border-green-800 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-400 text-sm truncate">{fileName}</span>
          </div>
          <audio controls src={previewUrl} className="w-full h-10" />
          <button
            onClick={reset}
            className="text-neutral-500 hover:text-neutral-300 text-sm underline transition-colors"
          >
            Değiştir
          </button>
        </div>
      )}
    </div>
  )
}
