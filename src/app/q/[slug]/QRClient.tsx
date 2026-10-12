'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import MediaCapture from '@/components/warm/MediaCapture'
import VoicePlayer from '@/components/warm/VoicePlayer'
import type { QRCode, QRMedia } from '@/lib/db'
import type { PublicGuestbookSettings } from '@/lib/guestbook'
import { withLang, type Lang } from '@/lib/i18n'
import { getMaxVideoSeconds, spotifyEmbedUrl, youtubeEmbedUrl } from '@/lib/media'
import { GuestbookSetupView, GuestbookView } from './GuestbookClient'
import { attachMedia, composeProfileTitle, ErrorBox, MAX_AUDIO_SECONDS, OwnerSecrets, parseProfileTitle, QR_T, ScanShell } from './ScanShared'

interface Props {
  qr: QRCode
  lang: Lang
  mode: 'standard' | 'guestbook'
  guestbook: PublicGuestbookSettings | null
  viaNfc?: boolean
}

function MediaTabs({
  value,
  onChange,
  lang,
}: {
  value: 'audio' | 'video' | 'image'
  onChange: (value: 'audio' | 'video' | 'image') => void
  lang: Lang
}) {
  const t = QR_T[lang]
  const options = [
    ['audio', `🎙️ ${t.audio}`],
    ['video', `🎬 ${t.video}`],
    ['image', `🖼️ ${t.image}`],
  ] as const
  return (
    <div className="w-seg grid-cols-3" role="group">
      {options.map(([key, label]) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  )
}

function ClaimView({ qr, lang }: { qr: QRCode; lang: Lang }) {
  const t = QR_T[lang]
  const [mediaMode, setMediaMode] = useState<'audio' | 'video' | 'image'>('audio')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyLocation, setEmergencyLocation] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [showLinks, setShowLinks] = useState(false)
  const [showEmergency, setShowEmergency] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ manageUrl: string; recoveryCode: string } | null>(null)

  const maxVideoSeconds = getMaxVideoSeconds(qr.order_type)
  const canSubmit = Boolean(mediaFile || youtubeUrl.trim() || spotifyUrl.trim() || externalUrl.trim())

  const handleClaim = async () => {
    if (!canSubmit) {
      setError(t.needContent)
      return
    }
    setLoading(true)
    setError(null)

    try {
      const fd = new FormData()
      if (mediaFile) {
        setProgress(0)
        await attachMedia(fd, mediaFile, { slug: qr.slug, onProgress: setProgress })
      }
      setProgress(null)
      fd.append('title', composeProfileTitle(title, emergencyPhone, emergencyLocation, lang === 'en' ? 'Voice note' : 'Sesli Not'))
      if (youtubeUrl.trim()) fd.append('youtube_url', youtubeUrl.trim())
      if (spotifyUrl.trim()) fd.append('spotify_url', spotifyUrl.trim())
      if (externalUrl.trim()) fd.append('external_url', externalUrl.trim())

      const res = await fetch(`/api/qr/${qr.slug}/claim`, { method: 'POST', body: fd })
      const payload = (await res.json().catch(() => null)) as { error?: string; ownerToken?: string; manageUrl?: string; recoveryCode?: string } | null
      if (!res.ok) throw new Error(payload?.error || (res.status === 413 ? t.tooLarge : t.genericError))
      if (!payload?.ownerToken || !payload.manageUrl || !payload.recoveryCode) throw new Error(t.genericError)

      localStorage.setItem(`qrnote_token_${qr.slug}`, payload.ownerToken)
      setResult({ manageUrl: payload.manageUrl, recoveryCode: payload.recoveryCode })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.genericError)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  if (result) {
    return (
      <ScanShell lang={lang}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sage-soft text-3xl">✓</div>
          <h1 className="font-display text-3xl font-semibold">{t.doneTitle}</h1>
          <p className="mt-2 text-ink-2">{t.doneDesc}</p>
        </div>
        <OwnerSecrets slug={qr.slug} manageUrl={result.manageUrl} recoveryCode={result.recoveryCode} lang={lang} />
      </ScanShell>
    )
  }

  return (
    <ScanShell lang={lang}>
      <div className="mb-6 text-center">
        {qr.is_demo ? <span className="w-chip w-chip-gold">{t.demo}</span> : <span className="w-chip">{t.setupBadge}</span>}
        <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">{t.setupTitle}</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-2">{t.setupDesc}</p>
      </div>

      <div className="w-card space-y-6 p-5 sm:p-6">
        <div>
          <label className="w-label" htmlFor="qr-title">
            {t.titleLabel} <span className="font-normal text-muted">({t.optional})</span>
          </label>
          <input id="qr-title" className="w-input" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder={t.titlePh} />
        </div>

        <div className="space-y-3">
          <p className="w-label">{t.contentType}</p>
          <MediaTabs
            value={mediaMode}
            lang={lang}
            onChange={(next) => {
              setMediaMode(next)
              setMediaFile(null)
            }}
          />
          <MediaCapture key={mediaMode} mode={mediaMode} lang={lang} maxSeconds={mediaMode === 'video' ? maxVideoSeconds : MAX_AUDIO_SECONDS} onChange={setMediaFile} />
        </div>

        <div className="w-divider" />

        <div>
          <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setShowLinks((v) => !v)} aria-expanded={showLinks}>
            <span className="font-semibold text-ink">🔗 {t.linksTitle} <span className="text-sm font-normal text-muted">({t.optional})</span></span>
            <span className="text-muted">{showLinks ? '−' : '+'}</span>
          </button>
          {showLinks && (
            <div className="mt-3 space-y-2">
              <input className="w-input" type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder={t.youtubePh} />
              <input className="w-input" type="url" value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} placeholder={t.spotifyPh} />
              <input className="w-input" type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder={t.linkPh} />
            </div>
          )}
        </div>

        <div>
          <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setShowEmergency((v) => !v)} aria-expanded={showEmergency}>
            <span className="font-semibold text-ink">🆘 {t.emergencyTitle} <span className="text-sm font-normal text-muted">({t.optional})</span></span>
            <span className="text-muted">{showEmergency ? '−' : '+'}</span>
          </button>
          {showEmergency && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted">{t.emergencyHint}</p>
              <input className="w-input" type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder={t.phonePh} />
              <input className="w-input" value={emergencyLocation} onChange={(e) => setEmergencyLocation(e.target.value)} placeholder={t.locationPh} />
            </div>
          )}
        </div>

        {error && <ErrorBox text={error} lang={lang} />}

        {progress !== null && (
          <div className="space-y-1">
            <div className="w-progress">
              <span style={{ width: `${Math.round(progress)}%` }} />
            </div>
            <p className="text-xs text-muted">
              {t.uploading} %{Math.round(progress)}
            </p>
          </div>
        )}

        <button type="button" onClick={handleClaim} disabled={loading} className="w-btn w-btn-primary w-btn-block py-4 text-base">
          {loading ? (progress !== null ? `${t.uploading}…` : t.saving) : `${t.submit} →`}
        </button>
      </div>
    </ScanShell>
  )
}

function ExpiredDemoView({ lang }: { lang: Lang }) {
  const t = QR_T[lang]
  return (
    <ScanShell lang={lang}>
      <div className="w-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gold-soft text-3xl">⏳</div>
        <h1 className="font-display text-2xl font-semibold">{t.expiredTitle}</h1>
        <p className="mt-2 text-ink-2">{t.expiredDesc}</p>
        <div className="mt-6 grid gap-3">
          <Link href={withLang('/shop', lang)} className="w-btn w-btn-primary">
            {t.goShop}
          </Link>
          <Link href={withLang('/account', lang)} className="w-btn w-btn-ghost">
            {t.goAccount}
          </Link>
        </div>
      </div>
    </ScanShell>
  )
}

function mediaLabel(type: QRMedia['media_type'], lang: Lang) {
  const t = QR_T[lang]
  if (type === 'audio') return `🎙️ ${t.audio}`
  if (type === 'video') return `🎬 ${t.video}`
  if (type === 'image') return `🖼️ ${t.image}`
  if (type === 'youtube') return '▶ YouTube'
  if (type === 'spotify') return '♫ Spotify'
  return `🔗 ${t.link}`
}

function PlayView({ qr, lang, viaNfc }: { qr: QRCode; lang: Lang; viaNfc?: boolean }) {
  const t = QR_T[lang]
  const [manageUrl, setManageUrl] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const profile = useMemo(() => parseProfileTitle(qr.title || ''), [qr.title])
  const mapsUrl = profile.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.location)}` : null

  useEffect(() => {
    const token = localStorage.getItem(`qrnote_token_${qr.slug}`)
    const next = token ? `${window.location.origin}/manage/${qr.slug}?token=${token}` : null
    const raf = window.requestAnimationFrame(() => setManageUrl(next))
    return () => window.cancelAnimationFrame(raf)
  }, [qr.slug])

  const items = useMemo<QRMedia[]>(() => {
    const list = qr.media_items || []
    if (list.length > 0) return list
    if (!qr.audio_url) return []
    return [
      {
        id: 'legacy-audio',
        qr_id: qr.id,
        media_type: 'audio',
        source_type: 'blob',
        blob_url: qr.audio_url,
        external_url: null,
        title: qr.title || '',
        sort_order: 0,
        is_primary: true,
        created_at: qr.created_at,
        updated_at: qr.updated_at,
      } as QRMedia,
    ]
  }, [qr])

  const active = items.find((item) => item.id === activeId) || items.find((item) => item.is_primary) || items[0] || null
  const version = encodeURIComponent(qr.updated_at)
  const mediaSrc = (item: QRMedia) =>
    item.id === 'legacy-audio' ? `/api/qr/${qr.slug}/audio?v=${version}` : `/api/qr/${qr.slug}/media/${item.id}?v=${version}`

  return (
    <ScanShell lang={lang}>
      <div className="mb-6 text-center">
        {viaNfc && <span className="w-chip w-chip-sage mb-3">📶 {t.nfcHello}</span>}
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{profile.cleanTitle || 'QRNot'}</h1>
        <p className="mt-1 text-sm text-muted">
          {qr.play_count} {t.opened}
        </p>
      </div>

      <div className="w-card space-y-5 p-5 sm:p-6">
        {items.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${item.id === active?.id ? 'border-ink bg-ink text-white' : 'border-line-2 bg-paper text-ink-2 hover:border-ink-2'}`}
              >
                {mediaLabel(item.media_type, lang)}
              </button>
            ))}
          </div>
        )}

        {!active && <p className="py-8 text-center text-muted">{t.noContent}</p>}

        {active?.source_type === 'blob' && active.media_type === 'audio' && (
          <div className="rounded-2xl bg-cream-2 p-5">
            <VoicePlayer src={mediaSrc(active)} title={profile.cleanTitle || undefined} lang={lang} />
          </div>
        )}

        {active?.source_type === 'blob' && active.media_type === 'video' && (
          <video controls playsInline src={mediaSrc(active)} className="w-full rounded-2xl bg-ink" />
        )}

        {active?.source_type === 'blob' && active.media_type === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaSrc(active)} alt={profile.cleanTitle || 'QRNot'} className="max-h-128 w-full rounded-2xl bg-cream-2 object-contain" />
        )}

        {active?.media_type === 'youtube' && active.external_url &&
          (youtubeEmbedUrl(active.external_url) ? (
            <iframe
              src={youtubeEmbedUrl(active.external_url) || undefined}
              className="aspect-video w-full rounded-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="YouTube"
            />
          ) : (
            <a href={active.external_url} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-dark w-btn-block">
              {t.openYoutube}
            </a>
          ))}

        {active?.media_type === 'spotify' && active.external_url &&
          (spotifyEmbedUrl(active.external_url) ? (
            <iframe
              src={spotifyEmbedUrl(active.external_url) || undefined}
              className="h-96 w-full rounded-2xl"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify"
            />
          ) : (
            <a href={active.external_url} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-dark w-btn-block">
              {t.openSpotify}
            </a>
          ))}

        {active?.media_type === 'link' && active.external_url && (
          <a href={active.external_url} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-dark w-btn-block">
            {t.openLink} ↗
          </a>
        )}
      </div>

      {(profile.phone || profile.location) && (
        <div className="w-card mt-4 space-y-3 p-5">
          <p className="font-semibold text-ink">🆘 {t.emergency}</p>
          {profile.phone && (
            <a href={`tel:${profile.phone}`} className="w-btn w-btn-primary w-btn-block">
              📞 {t.call}: {profile.phone}
            </a>
          )}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-ghost w-btn-block">
              📍 {t.openMap}
            </a>
          )}
        </div>
      )}

      {manageUrl && (
        <div className="mt-4 space-y-2 text-center">
          <a href={manageUrl} className="w-btn w-btn-ghost w-btn-block">
            ✏️ {t.edit}
          </a>
          <Link href={withLang(`/recover/${qr.slug}`, lang)} className="text-xs text-muted hover:text-ink">
            {t.lostLink}
          </Link>
        </div>
      )}
    </ScanShell>
  )
}

export default function QRClient({ qr, lang, mode, guestbook, viaNfc }: Props) {
  if (qr.is_demo && qr.is_active === false) return <ExpiredDemoView lang={lang} />
  if (mode === 'guestbook' && guestbook) {
    if (!qr.is_claimed) return <GuestbookSetupView qr={qr} lang={lang} />
    return <GuestbookView qr={qr} lang={lang} settings={guestbook} />
  }
  if (!qr.is_claimed) return <ClaimView qr={qr} lang={lang} />
  return <PlayView qr={qr} lang={lang} viaNfc={viaNfc} />
}
