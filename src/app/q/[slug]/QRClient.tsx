'use client'

import { useState, useEffect } from 'react'
import AudioRecorder from '@/components/AudioRecorder'
import AudioPlayer from '@/components/AudioPlayer'
import Link from 'next/link'
import type { QRCode } from '@/lib/db'

interface Props {
  qr: QRCode
}

/* ──────────────────────────────────────────────
   Sahiplenilmemiş QR → Kullanıcı ses kaydeder
────────────────────────────────────────────── */
function ClaimView({ qr }: Props) {
  const [audio, setAudio] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [manageUrl, setManageUrl] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [copied, setCopied] = useState<'owner' | 'recovery' | null>(null)

  const handleClaim = async () => {
    if (!audio) return
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append('audio', audio)
    if (title.trim()) fd.append('title', title.trim())

    try {
      const res = await fetch(`/api/qr/${qr.slug}/claim`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kayıt başarısız')

      // QR sahibinin güncelleme yetkisini localStorage'da tut
      const key = `qrnote_token_${qr.slug}`
      localStorage.setItem(key, data.ownerToken)
      setManageUrl(data.manageUrl)
      setRecoveryCode(data.recoveryCode)
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (value: string, target: 'owner' | 'recovery') => {
    await navigator.clipboard.writeText(value)
    setCopied(target)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`QRNote sahip linkim: ${manageUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  if (done) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-950 border border-green-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">QR Kodun Hazır!</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Artık bu QR kodu tarayan herkes sesini duyacak. Aşağıdaki sahip linkini sakla; sadece bu link ile sesini değiştirebilirsin.
          </p>
          <div className="bg-amber-950/40 border border-amber-800 rounded-2xl p-4 mb-6 text-left">
            <p className="text-amber-400 text-xs font-semibold mb-2">⚠️ Sahip Linkin — Kaydet!</p>
            <p className="text-amber-300/70 text-xs break-all">{manageUrl}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleCopy(manageUrl, 'owner')}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-sm font-medium py-3 rounded-xl transition-all"
            >
              {copied === 'owner' ? 'Kopyalandı' : 'Sahip Linkini Kopyala'}
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-3 rounded-xl transition-all"
            >
              WhatsApp ile Paylaş
            </button>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-6 text-left">
            <p className="text-white text-xs font-semibold mb-2">Kurtarma Kodun</p>
            <p className="text-neutral-300 text-lg tracking-[0.25em] font-semibold mb-3">{recoveryCode}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCopy(recoveryCode, 'recovery')}
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
              >
                {copied === 'recovery' ? 'Kopyalandı' : 'Kurtarma Kodunu Kopyala'}
              </button>
              <Link href={`/recover/${qr.slug}`} className="text-violet-400 hover:text-violet-300 text-xs transition-colors">
                Link kaybolursa buradan geri al
              </Link>
            </div>
          </div>
          <a
            href={manageUrl}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm"
          >
            Sesini Sonradan Güncelle →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">🎙️</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sesini Kaydet</h1>
          <p className="text-neutral-500 text-sm">
            Bu QR kod henüz sahiplenilmedi. İlk sesi kaydeden sahip olur.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          {/* Başlık */}
          <div>
            <label className="block text-neutral-400 text-sm mb-2">
              Başlık <span className="text-neutral-700">(isteğe bağlı)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Örn: Annemin Sesi ❤️"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-600 rounded-xl px-4 py-3 outline-none transition-colors text-sm"
            />
          </div>

          {/* Recorder */}
          <div>
            <label className="block text-neutral-400 text-sm mb-2">Ses Kaydı</label>
            <AudioRecorder onAudioReady={setAudio} />
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={handleClaim}
            disabled={!audio || loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Yükleniyor...
              </>
            ) : 'QR Kodumu Sahiplen →'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Sahiplenilmiş QR → Ses oynatma
────────────────────────────────────────────── */
function PlayView({ qr }: Props) {
  const [manageUrl, setManageUrl] = useState<string | null>(null)
  const audioUrl = `/api/qr/${qr.slug}/audio?v=${encodeURIComponent(qr.updated_at)}`

  useEffect(() => {
    const token = localStorage.getItem(`qrnote_token_${qr.slug}`)
    if (token) {
      const base = window.location.origin
      setManageUrl(`${base}/manage/${qr.slug}?token=${token}`)
    }
  }, [qr.slug])

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">🎙️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">
            {qr.title || 'Sesli Not'}
          </h1>
          <p className="text-neutral-600 text-sm">
            {qr.play_count} kez dinlendi
          </p>
        </div>

        {/* Player */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-5">
          {qr.audio_url ? (
            <AudioPlayer audioUrl={audioUrl} />
          ) : (
            <p className="text-neutral-600 text-sm text-center py-4">Ses dosyası bulunamadı.</p>
          )}
        </div>

        {/* Yönet butonu — sadece sahibiyse göster */}
        {manageUrl && (
          <div className="space-y-3">
            <a
              href={manageUrl}
              className="block w-full text-center bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-sm font-medium py-3 rounded-xl transition-all"
            >
              Sesini Güncelle →
            </a>
            <Link
              href={`/recover/${qr.slug}`}
              className="block w-full text-center text-neutral-500 hover:text-neutral-300 text-xs transition-colors"
            >
              Sahip linkini mi kaybettin?
            </Link>
          </div>
        )}

        <p className="text-center text-neutral-800 text-xs mt-8">
          <Link href="/" className="hover:text-neutral-600 transition-colors">QRNote</Link>
        </p>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Ana Client component
────────────────────────────────────────────── */
export default function QRClient({ qr }: Props) {
  if (!qr.is_claimed) return <ClaimView qr={qr} />
  return <PlayView qr={qr} />
}
