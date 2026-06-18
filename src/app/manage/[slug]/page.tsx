'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import MediaRecorder from '@/components/MediaRecorder'
import QRDisplay from '@/components/QRDisplay'
import Link from 'next/link'
import type { QRMedia } from '@/lib/db'
import { getMaxVideoSeconds } from '@/lib/media'

interface NoteInfo {
  slug: string
  title: string
  play_count: number
  created_at: string
  order_type?: 'trial' | 'individual' | 'corporate' | 'demo'
  media_items?: QRMedia[]
}

const EMERGENCY_PHONE_MARKER = '[TEL:'
const LOCATION_MARKER = '[LOC:'

function parseProfileTitle(rawTitle: string) {
  const source = (rawTitle || '').trim()
  const telMatch = source.match(/\[TEL:([^\]]+)\]/)
  const locMatch = source.match(/\[LOC:([^\]]+)\]/)
  const phone = telMatch?.[1]?.trim() || ''
  const location = locMatch?.[1]?.trim() || ''
  const cleanTitle = source
    .replace(/\[TEL:[^\]]+\]/g, '')
    .replace(/\[LOC:[^\]]+\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return { cleanTitle, phone, location }
}

function composeProfileTitle(baseTitle: string, emergencyPhone: string, location: string) {
  const safeBase = (baseTitle || '').trim() || 'Sesli Not'
  const safePhone = emergencyPhone.trim()
  const safeLocation = location.trim()
  const withMeta = `${safeBase}${safePhone ? ` ${EMERGENCY_PHONE_MARKER}${safePhone}]` : ''}${safeLocation ? ` ${LOCATION_MARKER}${safeLocation}]` : ''}`
  return withMeta.slice(0, 100)
}

function parseWhatsAppSupport(errorText: string) {
  const url = errorText.match(/https?:\/\/wa\.me\/\S+/)?.[0] || null
  const message = url ? errorText.replace(url, '').trim() : errorText
  return { message, url }
}

const MAX_REQUEST_FILE_SIZE_BYTES = 4 * 1024 * 1024

function ManagePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const token = searchParams.get('token') || ''

  const [note, setNote] = useState<NoteInfo | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [authError, setAuthError] = useState(!token)

  const [mediaMode, setMediaMode] = useState<'audio' | 'video' | 'image'>('audio')
  const [newMedia, setNewMedia] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyLocation, setEmergencyLocation] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [origin] = useState(() => (typeof window !== 'undefined' ? window.location.origin : ''))
  const parsedSaveError = saveError ? parseWhatsAppSupport(saveError) : null

  const playUrl = `${origin}/q/${slug}`
  const ownerUrl = `${origin}/manage/${slug}?token=${token}`
  const maxVideoSeconds = getMaxVideoSeconds(note?.order_type)

  const hydrateLinks = useCallback((mediaItems: QRMedia[]) => {
    const youtube = mediaItems.find((item) => item.media_type === 'youtube')?.external_url || ''
    const spotify = mediaItems.find((item) => item.media_type === 'spotify')?.external_url || ''
    const external = mediaItems.find((item) => item.media_type === 'link')?.external_url || ''
    setYoutubeUrl(youtube)
    setSpotifyUrl(spotify)
    setExternalUrl(external)
  }, [])

  const fetchNote = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/qr/${slug}`, { cache: 'no-store' })
    if (!res.ok) {
      setAuthError(true)
      setLoading(false)
      return
    }

    const data = await res.json()
    if (!token) {
      setAuthError(true)
      setLoading(false)
      return
    }

    const profile = parseProfileTitle(data.title || '')
    setNote(data)
    setNewTitle(profile.cleanTitle)
    setEmergencyPhone(profile.phone)
    setEmergencyLocation(profile.location)
    hydrateLinks(Array.isArray(data.media_items) ? data.media_items : [])
    setLoading(false)
  }, [hydrateLinks, slug, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNote()
  }, [fetchNote, token])

  const handleSave = async () => {
    if (!note) return

    if (newMedia && newMedia.size > MAX_REQUEST_FILE_SIZE_BYTES) {
      setSaveError('Dosya cok buyuk. Lutfen 4MB altinda bir dosya sec veya medyayi kisaltip tekrar dene.')
      return
    }

    setSaving(true)
    setSaveError(null)

    const formData = new FormData()
    formData.append('token', token)
    if (newMedia) formData.append('media', newMedia)
    formData.append('title', composeProfileTitle(newTitle, emergencyPhone, emergencyLocation))
    formData.append('youtube_url', youtubeUrl.trim())
    formData.append('spotify_url', spotifyUrl.trim())
    formData.append('external_url', externalUrl.trim())

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const res = await fetch(`/api/qr/${slug}/update`, {
        method: 'PUT',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const contentType = res.headers.get('content-type') || ''
      let data: { error?: string } | null = null
      let rawText = ''

      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null)
      } else {
        rawText = await res.text().catch(() => '')
      }

      if (!res.ok) {
        const fallback = rawText || 'Guncelleme basarisiz'
        const lower = fallback.toLowerCase()
        if (res.status === 413 || lower.includes('request entity too large')) {
          setSaveError('Dosya cok buyuk. Lutfen 4MB altinda bir dosya sec veya medyayi kisaltip tekrar dene.')
          return
        }

        setSaveError(data?.error || fallback)
        return
      }

      setSaved(true)
      setNewMedia(null)
      await fetchNote()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setSaveError('Istek zaman asimina ugradi. Lutfen tekrar dene.')
      } else {
        setSaveError('Baglanti hatasi. Lutfen tekrar dene.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCopyOwnerLink = async () => {
    await navigator.clipboard.writeText(ownerUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`QRNote sahip linkim: ${ownerUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500">Yukleniyor...</div>
      </div>
    )
  }

  if (authError || !note) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">Erisim Reddedildi</h1>
          <p className="text-neutral-500 text-sm mb-6">Gecersiz veya eksik sahiplik linki.</p>
          <Link href={`/recover/${slug}`} className="inline-block mb-4 text-violet-400 hover:text-violet-300 text-sm transition-colors">
            Kurtarma kodu ile geri al -&gt;
          </Link>
          <br />
          <Link href="/account" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">
            Hesabıma Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link href="/account" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
            &larr; Hesabıma Dön
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">QR Icerigini Guncelle</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {note.play_count} kez acildi · {new Date(note.created_at).toLocaleDateString('tr-TR')}
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6 flex flex-col items-center gap-4">
          <p className="text-neutral-400 text-sm">QR Kodun</p>
          <QRDisplay url={playUrl} size={180} />
          <a href={playUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 text-xs transition-colors">
            {playUrl}
          </a>
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={handleCopyOwnerLink}
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-sm font-medium py-3 rounded-xl transition-all"
            >
              {linkCopied ? 'Kopyalandi' : 'Sahip Linkini Kopyala'}
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-3 rounded-xl transition-all"
            >
              WhatsApp ile Paylas
            </button>
          </div>
          <Link href={`/recover/${slug}`} className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors">
            Link kaybolursa kurtarma kodu ile geri al
          </Link>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold">Icerikler</h2>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Baslik</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={80}
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white rounded-xl px-4 py-3 outline-none transition-colors text-sm"
            />
          </div>

          <div className="space-y-3">
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="Acil durumda ara: telefon"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
            <input
              type="text"
              value={emergencyLocation}
              onChange={(e) => setEmergencyLocation(e.target.value)}
              placeholder="Konum / adres"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setMediaMode('audio'); setNewMedia(null); setImagePreviewUrl(null) }}
              className={`py-2 rounded-lg text-sm border ${mediaMode === 'audio' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}
            >
              Ses
            </button>
            <button
              onClick={() => { setMediaMode('video'); setNewMedia(null); setImagePreviewUrl(null) }}
              className={`py-2 rounded-lg text-sm border ${mediaMode === 'video' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}
            >
              Video
            </button>
            <button
              onClick={() => { setMediaMode('image'); setNewMedia(null); setImagePreviewUrl(null) }}
              className={`py-2 rounded-lg text-sm border ${mediaMode === 'image' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}
            >
              Resim
            </button>
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Yeni Medya Kaydi (opsiyonel)</label>
            {(mediaMode === 'audio' || mediaMode === 'video') && (
              <MediaRecorder mode={mediaMode} maxVideoSeconds={maxVideoSeconds} onMediaReady={setNewMedia} />
            )}
            {mediaMode === 'image' && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setNewMedia(file)
                    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
                    if (file) {
                      setImagePreviewUrl(URL.createObjectURL(file))
                    } else {
                      setImagePreviewUrl(null)
                    }
                  }}
                  className="w-full bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl px-3 py-2 text-sm"
                />
                {imagePreviewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreviewUrl} alt="Onizleme" className="w-full rounded-xl border border-neutral-700 bg-black object-contain max-h-72" />
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="YouTube linki"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
            <input
              type="url"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="Spotify linki"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="Diger link"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
            <p className="text-[11px] text-neutral-500">Bir link alanini bos birakarak kaydedersen ilgili kart silinir.</p>
          </div>

          {parsedSaveError && (
            <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-xl">
              <p>{parsedSaveError.message}</p>
              {parsedSaveError.url && (
                <a
                  href={parsedSaveError.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  WhatsApp Destek
                </a>
              )}
            </div>
          )}

          {saved && (
            <div className="bg-green-950/40 border border-green-800 text-green-400 text-sm px-4 py-3 rounded-xl">✓ Guncellendi!</div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManagePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="text-neutral-500">Yukleniyor...</div></div>}>
      <ManagePage />
    </Suspense>
  )
}
