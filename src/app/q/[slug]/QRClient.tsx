'use client'

import { useEffect, useMemo, useState } from 'react'
import AudioPlayer from '@/components/AudioPlayer'
import MediaRecorder from '@/components/MediaRecorder'
import Link from 'next/link'
import type { QRCode, QRMedia } from '@/lib/db'
import { getMaxVideoSeconds, spotifyEmbedUrl, youtubeEmbedUrl } from '@/lib/media'

interface Props {
  qr: QRCode
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

function buildMapsUrl(location: string) {
  if (!location.trim()) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`
}

function parseWhatsAppSupport(errorText: string) {
  const url = errorText.match(/https?:\/\/wa\.me\/\S+/)?.[0] || null
  const message = url ? errorText.replace(url, '').trim() : errorText
  return { message, url }
}

const MAX_REQUEST_FILE_SIZE_BYTES = 4 * 1024 * 1024

function DemoBadge({ passive = false }: { passive?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${passive ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-amber-500/10 border-amber-500/25 text-amber-300'}`}>
      <span className="w-2 h-2 rounded-full bg-amber-400" />
      {passive ? 'Demo QR Pasif' : 'Demo QR'}
    </div>
  )
}

function renderMediaLabel(mediaType: QRMedia['media_type']) {
  if (mediaType === 'audio') return 'Ses'
  if (mediaType === 'video') return 'Video'
  if (mediaType === 'image') return 'Resim'
  if (mediaType === 'youtube') return 'YouTube'
  if (mediaType === 'spotify') return 'Spotify'
  return 'Bağlantı'
}

function ClaimView({ qr }: Props) {
  const [mediaMode, setMediaMode] = useState<'audio' | 'video' | 'image'>('audio')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyLocation, setEmergencyLocation] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [manageUrl, setManageUrl] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [copied, setCopied] = useState<'owner' | 'recovery' | null>(null)

  const maxVideoSeconds = getMaxVideoSeconds(qr.order_type)
  const canSubmit = Boolean(mediaFile || youtubeUrl.trim() || spotifyUrl.trim() || externalUrl.trim())
  const parsedError = error ? parseWhatsAppSupport(error) : null

  const handleClaim = async () => {
    if (!canSubmit) return

    if (mediaFile && mediaFile.size > MAX_REQUEST_FILE_SIZE_BYTES) {
      setError('Dosya cok buyuk. Lutfen 4MB altinda bir dosya sec veya medyayi kisaltip tekrar dene.')
      return
    }

    setLoading(true)
    setError(null)

    const fd = new FormData()
    if (mediaFile) fd.append('media', mediaFile)
    fd.append('title', composeProfileTitle(title, emergencyPhone, emergencyLocation))
    if (youtubeUrl.trim()) fd.append('youtube_url', youtubeUrl.trim())
    if (spotifyUrl.trim()) fd.append('spotify_url', spotifyUrl.trim())
    if (externalUrl.trim()) fd.append('external_url', externalUrl.trim())

    try {
      const res = await fetch(`/api/qr/${qr.slug}/claim`, { method: 'POST', body: fd })
      const contentType = res.headers.get('content-type') || ''
      let payload: { error?: string; ownerToken?: string; manageUrl?: string; recoveryCode?: string } | null = null
      let rawText = ''

      if (contentType.includes('application/json')) {
        payload = await res.json().catch(() => null)
      } else {
        rawText = await res.text().catch(() => '')
      }

      if (!res.ok) {
        const fallback = rawText || 'Kayit basarisiz'
        const lower = fallback.toLowerCase()
        if (res.status === 413 || lower.includes('request entity too large')) {
          throw new Error('Dosya cok buyuk. Lutfen 4MB altinda bir dosya sec veya medyayi kisaltip tekrar dene.')
        }

        throw new Error(payload?.error || fallback)
      }

      if (!payload?.ownerToken || !payload.manageUrl || !payload.recoveryCode) {
        throw new Error('Sunucu yaniti eksik. Lutfen tekrar dene.')
      }

      localStorage.setItem(`qrnote_token_${qr.slug}`, payload.ownerToken)
      setManageUrl(payload.manageUrl)
      setRecoveryCode(payload.recoveryCode)
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
          <h1 className="text-2xl font-bold text-white mb-3">QR Kodun Hazir!</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Artık bu QR kodu tarayan herkes medya ve bağlantı kartlarını görecek.
          </p>
          <div className="bg-amber-950/40 border border-amber-800 rounded-2xl p-4 mb-6 text-left">
            <p className="text-amber-400 text-xs font-semibold mb-2">Sahip Linkin - Kaydet!</p>
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
              WhatsApp ile Paylas
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
            İçeriklerini Sonradan Güncelle -&gt;
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-left mb-3">
            <Link href="/account" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
              ← Geri Dön
            </Link>
          </div>
          {qr.is_demo && <div className="flex justify-center mb-4"><DemoBadge /></div>}
          <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">🎬</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">QR İçeriğini Oluştur</h1>
          <p className="text-neutral-500 text-sm">Ses, video, resim ve platform linklerini bir arada ekleyebilirsin.</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-neutral-400 text-sm mb-2">
              Başlık <span className="text-neutral-700">(isteğe bağlı)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Örn: Ailem İçin QR"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-600 rounded-xl px-4 py-3 outline-none transition-colors text-sm"
            />
          </div>

          <div className="space-y-3">
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="Acil durumda ara: telefon (opsiyonel)"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
            <input
              type="text"
              value={emergencyLocation}
              onChange={(e) => setEmergencyLocation(e.target.value)}
              placeholder="Konum / adres (opsiyonel)"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setMediaMode('audio')
                setMediaFile(null)
                setImagePreviewUrl(null)
              }}
              className={`py-2 rounded-lg text-sm border ${mediaMode === 'audio' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}
            >
              Ses
            </button>
            <button
              onClick={() => {
                setMediaMode('video')
                setMediaFile(null)
                setImagePreviewUrl(null)
              }}
              className={`py-2 rounded-lg text-sm border ${mediaMode === 'video' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}
            >
              Video
            </button>
            <button
              onClick={() => {
                setMediaMode('image')
                setMediaFile(null)
                setImagePreviewUrl(null)
              }}
              className={`py-2 rounded-lg text-sm border ${mediaMode === 'image' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}
            >
              Resim
            </button>
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Medya Kaydı</label>
            {(mediaMode === 'audio' || mediaMode === 'video') && (
              <MediaRecorder mode={mediaMode} maxVideoSeconds={maxVideoSeconds} onMediaReady={setMediaFile} />
            )}
            {mediaMode === 'image' && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setMediaFile(file)
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
                  <img src={imagePreviewUrl} alt="Önizleme" className="w-full rounded-xl border border-neutral-700 bg-black object-contain max-h-72" />
                )}
              </div>
            )}
            {mediaMode === 'video' && (
              <p className="text-[11px] text-neutral-500 mt-2">
                Standart video limiti {Math.floor(maxVideoSeconds / 60)} dk {(maxVideoSeconds % 60)} sn.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="YouTube linki (opsiyonel)"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
            <input
              type="url"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="Spotify linki (opsiyonel)"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="Diğer link (opsiyonel)"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-500 rounded-xl px-4 py-3 outline-none text-sm"
            />
          </div>

          {parsedError && (
            <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-xl">
              <p>{parsedError.message}</p>
              {parsedError.url && (
                <a
                  href={parsedError.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  WhatsApp Destek
                </a>
              )}
            </div>
          )}

          <button
            onClick={handleClaim}
            disabled={!canSubmit || loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all"
          >
            {loading ? 'Yükleniyor...' : 'QR Kodumu Sahiplen ->'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ExpiredDemoView() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4"><DemoBadge passive /></div>
        <div className="w-16 h-16 bg-amber-950/40 border border-amber-800 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">⏳</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Demo süresi doldu</h1>
        <p className="text-neutral-400 text-sm leading-relaxed mb-6">
          Bu demo QR artık aktif değil. Yeni demo oluşturabilir veya kalıcı paket satın alabilirsin.
        </p>
        <div className="space-y-3">
          <Link href="/account" className="block w-full text-center bg-white hover:bg-neutral-100 text-neutral-950 font-semibold py-3 rounded-xl transition-all">
            Hesaba Git
          </Link>
          <a
            href="https://wa.me/905433929230?text=Merhaba%20QRNote%2C%20demo%20QR%20surem%20doldu.%20Kalici%20paket%20almak%20istiyorum."
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-all"
          >
            WhatsApp ile Satın Almaya Geç
          </a>
        </div>
      </div>
    </div>
  )
}

function PlayView({ qr }: Props) {
  const [manageUrl, setManageUrl] = useState<string | null>(null)
  const [mediaItems, setMediaItems] = useState<QRMedia[]>(() => qr.media_items || [])
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null)
  const profile = useMemo(() => parseProfileTitle(qr.title || ''), [qr.title])
  const mapsUrl = useMemo(() => buildMapsUrl(profile.location), [profile.location])

  useEffect(() => {
    const token = localStorage.getItem(`qrnote_token_${qr.slug}`)
    const nextManageUrl = token ? `${window.location.origin}/manage/${qr.slug}?token=${token}` : null
    const rafId = window.requestAnimationFrame(() => {
      setManageUrl(nextManageUrl)
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [qr.slug])

  useEffect(() => {
    if (qr.media_items && qr.media_items.length > 0) {
      return
    }

    fetch(`/api/qr/${qr.slug}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.media_items)) {
          setMediaItems(data.media_items)
        }
      })
      .catch(() => {
        // istemci fallback: media gelmezse legacy audio calismaya devam eder
      })
  }, [qr.media_items, qr.slug])

  const effectiveItems = useMemo(() => {
    if (mediaItems.length > 0) return mediaItems
    if (!qr.audio_url) return []

    return [
      {
        id: 'legacy-audio',
        qr_id: qr.id,
        media_type: 'audio',
        source_type: 'blob',
        blob_url: qr.audio_url,
        external_url: null,
        title: qr.title || 'Sesli Not',
        sort_order: 0,
        is_primary: true,
        created_at: qr.created_at,
        updated_at: qr.updated_at,
      } as QRMedia,
    ]
  }, [mediaItems, qr.audio_url, qr.created_at, qr.id, qr.title, qr.updated_at])

  const activeMedia = useMemo(() => {
    if (effectiveItems.length === 0) return null
    const selected = effectiveItems.find((item) => item.id === activeMediaId)
    if (selected) return selected

    return effectiveItems.find((item) => item.is_primary) || effectiveItems[0]
  }, [activeMediaId, effectiveItems])

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">🎧</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">{profile.cleanTitle || 'QR Medya'}</h1>
          <p className="text-neutral-600 text-sm">{qr.play_count} kez acildi</p>
        </div>

        {(profile.phone || profile.location) && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-5 space-y-3">
            <p className="text-neutral-300 text-sm font-medium">Acil Durum Bilgisi</p>
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="block text-center bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-sm font-semibold"
              >
                Acil Durumda Ara: {profile.phone}
              </a>
            )}
            {profile.location && mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl text-sm font-semibold"
              >
                Konumu Ac
              </a>
            )}
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {effectiveItems.map((item) => {
              const selected = item.id === activeMedia?.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMediaId(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${selected ? 'bg-violet-600 border-violet-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}
                >
                  {renderMediaLabel(item.media_type)}
                </button>
              )
            })}
          </div>

          {!activeMedia && <p className="text-neutral-500 text-sm text-center py-6">Icerik bulunamadi.</p>}

          {activeMedia?.source_type === 'blob' && activeMedia.media_type === 'audio' && (
            <AudioPlayer
              audioUrl={activeMedia.id === 'legacy-audio'
                ? `/api/qr/${qr.slug}/audio?v=${encodeURIComponent(qr.updated_at)}`
                : `/api/qr/${qr.slug}/media/${activeMedia.id}?v=${encodeURIComponent(qr.updated_at)}`}
              title={activeMedia.title || qr.title}
            />
          )}

          {activeMedia?.source_type === 'blob' && activeMedia.media_type === 'video' && (
            <video
              controls
              playsInline
              src={`/api/qr/${qr.slug}/media/${activeMedia.id}?v=${encodeURIComponent(qr.updated_at)}`}
              className="w-full rounded-xl border border-neutral-700 bg-black"
            />
          )}

          {activeMedia?.source_type === 'blob' && activeMedia.media_type === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/qr/${qr.slug}/media/${activeMedia.id}?v=${encodeURIComponent(qr.updated_at)}`}
              alt={activeMedia.title || qr.title || 'QR resmi'}
              className="w-full rounded-xl border border-neutral-700 bg-black object-contain max-h-130"
            />
          )}

          {activeMedia?.media_type === 'youtube' && activeMedia.external_url && (
            youtubeEmbedUrl(activeMedia.external_url) ? (
              <iframe
                src={youtubeEmbedUrl(activeMedia.external_url) || undefined}
                className="w-full aspect-video rounded-xl border border-neutral-700"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="YouTube"
              />
            ) : (
              <a href={activeMedia.external_url} target="_blank" rel="noopener noreferrer" className="block text-center bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-sm font-semibold">
                YouTube&apos;da Ac
              </a>
            )
          )}

          {activeMedia?.media_type === 'spotify' && activeMedia.external_url && (
            spotifyEmbedUrl(activeMedia.external_url) ? (
              <iframe
                src={spotifyEmbedUrl(activeMedia.external_url) || undefined}
                className="w-full h-96 rounded-xl border border-neutral-700"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Spotify"
              />
            ) : (
              <a href={activeMedia.external_url} target="_blank" rel="noopener noreferrer" className="block text-center bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-sm font-semibold">
                Spotify&apos;da Ac
              </a>
            )
          )}

          {activeMedia?.media_type === 'link' && activeMedia.external_url && (
            <a
              href={activeMedia.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl text-sm font-semibold"
            >
              Baglantiyi Ac
            </a>
          )}
        </div>

        {manageUrl && (
          <div className="space-y-3">
            <a
              href={manageUrl}
              className="block w-full text-center bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-sm font-medium py-3 rounded-xl transition-all"
            >
              Iceriklerini Guncelle -&gt;
            </a>
            <Link
              href={`/recover/${qr.slug}`}
              className="block w-full text-center text-neutral-500 hover:text-neutral-300 text-xs transition-colors"
            >
              Sahip linkini mi kaybettin?
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QRClient({ qr }: Props) {
  if (qr.is_demo && qr.is_active === false) return <ExpiredDemoView />
  if (!qr.is_claimed) return <ClaimView qr={qr} />
  return <PlayView qr={qr} />
}

