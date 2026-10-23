'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import MediaCapture from '@/components/warm/MediaCapture'
import NfcWriter from '@/components/warm/NfcWriter'
import QrCard from '@/components/warm/QrCard'
import type { PublicGuestbookSettings } from '@/lib/guestbook'
import { formatDate, withLang, type Lang } from '@/lib/i18n'
import { getMaxAudioSeconds, getMaxVideoSeconds } from '@/lib/media'
import { SITE_URL } from '@/lib/site'
import { attachMedia, composeProfileTitle, ErrorBox, parseProfileTitle, ScanShell } from '@/app/q/[slug]/ScanShared'
import GuestbookAdmin from './GuestbookAdmin'
import ManageExtras, { type ExtrasInfo } from './ManageExtras'

interface OwnerInfo extends Omit<ExtrasInfo, 'media'> {
  slug: string
  title: string
  orderType?: 'trial' | 'individual' | 'corporate' | 'demo'
  playCount: number
  nfcScanCount: number
  nfcEncodedAt: string | null
  nfcLocked: boolean
  recordingCount: number
  recordingLimit: number
  createdAt: string
  mode: 'standard' | 'guestbook'
  guestbook: PublicGuestbookSettings | null
  media: Array<{
    id: string
    media_type: string
    source_type: string
    external_url: string | null
    title: string
    is_primary: boolean
    transcript?: string | null
    transcript_lang?: string | null
  }>
}

const T = {
  tr: {
    loading: 'Yükleniyor…',
    deniedTitle: 'Erişim reddedildi',
    deniedDesc: 'Bu sahip linki geçersiz ya da eski. Kurtarma kodunla yeni link alabilirsin.',
    recover: 'Kurtarma kodu ile geri al',
    account: 'Hesabıma dön',
    badge: 'Yönetim paneli',
    guestbookBadge: 'Anı defteri yönetimi',
    views: 'görüntülenme',
    nfcViews: 'NFC ile',
    created: 'Oluşturma',
    yourQr: 'QR kodun',
    openPage: 'QR sayfasını aç',
    content: 'İçerik',
    current: 'Şu anki içerik',
    noCurrent: 'Henüz medya yok',
    title: 'Başlık',
    replaceMedia: 'Medyayı değiştir',
    replaceHint: 'Yeni dosya eklersen eski ses/video/fotoğraf ile değiştirilir.',
    audio: 'Ses',
    video: 'Video',
    image: 'Fotoğraf',
    links: 'Bağlantılar',
    linksHint: 'Bir alanı boş bırakıp kaydedersen o kart kaldırılır.',
    youtubePh: 'YouTube linki',
    spotifyPh: 'Spotify linki',
    linkPh: 'Başka bir link',
    emergency: 'Acil durum bilgisi',
    phonePh: 'Telefon',
    locationPh: 'Adres / konum',
    save: 'Değişiklikleri kaydet',
    saving: 'Kaydediliyor…',
    uploading: 'Yükleniyor',
    saved: 'Kaydedildi ✓',
    error: 'Kaydedilemedi. Tekrar dene.',
    remaining: 'Kalan değişiklik hakkı',
    unlimitedPremium: 'Sınırsız değişiklik için Premium →',
    ownerLink: 'Sahip linkini kopyala',
    copied: 'Kopyalandı ✓',
    lost: 'Link kaybolursa kurtarma kodu ile geri al',
  },
  en: {
    loading: 'Loading…',
    deniedTitle: 'Access denied',
    deniedDesc: 'This owner link is invalid or outdated. Use your recovery code to get a new one.',
    recover: 'Recover with code',
    account: 'Back to my account',
    badge: 'Owner panel',
    guestbookBadge: 'Guestbook admin',
    views: 'views',
    nfcViews: 'via NFC',
    created: 'Created',
    yourQr: 'Your QR code',
    openPage: 'Open QR page',
    content: 'Content',
    current: 'Current content',
    noCurrent: 'No media yet',
    title: 'Title',
    replaceMedia: 'Replace media',
    replaceHint: 'Adding a new file replaces the current voice/video/photo.',
    audio: 'Voice',
    video: 'Video',
    image: 'Photo',
    links: 'Links',
    linksHint: 'Leave a field empty and save to remove that card.',
    youtubePh: 'YouTube link',
    spotifyPh: 'Spotify link',
    linkPh: 'Another link',
    emergency: 'Emergency info',
    phonePh: 'Phone',
    locationPh: 'Address / location',
    save: 'Save changes',
    saving: 'Saving…',
    uploading: 'Uploading',
    saved: 'Saved ✓',
    error: 'Could not save. Try again.',
    remaining: 'Changes left',
    unlimitedPremium: 'Unlimited changes with Premium →',
    ownerLink: 'Copy owner link',
    copied: 'Copied ✓',
    lost: 'Lost the link? Recover it with your code',
  },
}

const MEDIA_ICON: Record<string, string> = { audio: '🎙️', video: '🎬', image: '🖼️', youtube: '▶', spotify: '♫', link: '🔗' }

export default function ManageClient({ slug, lang }: { slug: string; lang: Lang }) {
  const t = T[lang]
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [info, setInfo] = useState<OwnerInfo | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'denied'>(token ? 'loading' : 'denied')
  const [mediaMode, setMediaMode] = useState<'audio' | 'video' | 'image'>('audio')
  const [newMedia, setNewMedia] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [captureKey, setCaptureKey] = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    const res = await fetch(`/api/qr/${slug}/owner?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    if (!res.ok) {
      setState('denied')
      return
    }
    const data = (await res.json()) as OwnerInfo
    const profile = parseProfileTitle(data.title || '')
    setInfo(data)
    setTitle(profile.cleanTitle)
    setPhone(profile.phone)
    setLocation(profile.location)
    setYoutubeUrl(data.media.find((m) => m.media_type === 'youtube')?.external_url || '')
    setSpotifyUrl(data.media.find((m) => m.media_type === 'spotify')?.external_url || '')
    setExternalUrl(data.media.find((m) => m.media_type === 'link')?.external_url || '')
    setState('ready')
    localStorage.setItem(`qrnote_token_${slug}`, token)
  }, [slug, token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const save = async () => {
    if (!info) return
    setSaving(true)
    setNotice(null)
    try {
      const fd = new FormData()
      fd.append('token', token)
      if (newMedia) {
        setProgress(0)
        await attachMedia(fd, newMedia, { slug, token, onProgress: setProgress })
        setProgress(null)
      }
      fd.append('title', composeProfileTitle(title, phone, location, lang === 'en' ? 'Voice note' : 'Sesli Not'))
      fd.append('youtube_url', youtubeUrl.trim())
      fd.append('spotify_url', spotifyUrl.trim())
      fd.append('external_url', externalUrl.trim())
      const res = await fetch(`/api/qr/${slug}/update`, { method: 'PUT', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      setNewMedia(null)
      setCaptureKey((k) => k + 1)
      setNotice({ tone: 'success', text: t.saved })
      await load()
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error && err.message ? err.message : t.error })
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  if (state === 'loading') {
    return (
      <ScanShell lang={lang}>
        <p className="py-20 text-center text-muted">{t.loading}</p>
      </ScanShell>
    )
  }

  if (state === 'denied' || !info) {
    return (
      <ScanShell lang={lang}>
        <div className="w-card p-8 text-center">
          <div className="mb-3 text-5xl">🔒</div>
          <h1 className="font-display text-2xl font-semibold">{t.deniedTitle}</h1>
          <p className="mt-2 text-ink-2">{t.deniedDesc}</p>
          <div className="mt-6 grid gap-2">
            <Link href={withLang(`/recover/${slug}`, lang)} className="w-btn w-btn-primary">
              {t.recover}
            </Link>
            <Link href={withLang('/account', lang)} className="w-btn w-btn-ghost">
              {t.account}
            </Link>
          </div>
        </div>
      </ScanShell>
    )
  }

  const playUrl = `${SITE_URL}/q/${slug}`
  const ownerUrl = typeof window !== 'undefined' ? window.location.href : ''
  const remaining = Math.max(0, info.recordingLimit - info.recordingCount)
  const blobMedia = info.media.filter((m) => m.source_type === 'blob')

  return (
    <ScanShell lang={lang} wide>
      <div className="mb-6">
        <span className="w-chip">{info.mode === 'guestbook' ? `📖 ${t.guestbookBadge}` : `⚙️ ${t.badge}`}</span>
        <h1 className="font-display mt-3 text-3xl font-semibold">{parseProfileTitle(info.title).cleanTitle || slug}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>👁 {info.playCount} {t.views}</span>
          <span>📶 {info.nfcScanCount} {t.nfcViews}</span>
          <span>
            {t.created}: {formatDate(info.createdAt, lang)}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <section className="w-card grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
          <QrCard url={playUrl} slug={slug} lang={lang} size={168} />
          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold">{t.yourQr}</h2>
            <a href={withLang(`/q/${slug}`, lang)} target="_blank" rel="noopener noreferrer" className="w-link block break-all text-sm">
              {playUrl} ↗
            </a>
            <button
              type="button"
              className="w-btn w-btn-ghost w-btn-sm"
              onClick={async () => {
                await navigator.clipboard.writeText(ownerUrl).catch(() => undefined)
                setCopied(true)
                setTimeout(() => setCopied(false), 1800)
              }}
            >
              🔑 {copied ? t.copied : t.ownerLink}
            </button>
            <Link href={withLang(`/recover/${slug}`, lang)} className="block text-xs text-muted hover:text-ink">
              {t.lost}
            </Link>
          </div>
        </section>

        {info.mode === 'guestbook' && info.guestbook ? (
          <GuestbookAdmin slug={slug} token={token} lang={lang} initial={info.guestbook} />
        ) : (
          <section className="w-card space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">{t.content}</h2>
              <span className="flex flex-wrap items-center gap-2">
                <span className={`w-chip ${!info.premium && remaining === 0 ? 'w-chip-gold' : 'w-chip-ink'}`}>
                  {t.remaining}: {info.premium ? '∞' : remaining}
                </span>
                {!info.premium && (
                  <Link href={withLang('/shop/premium', lang)} className="w-link text-xs font-semibold">
                    {t.unlimitedPremium}
                  </Link>
                )}
              </span>
            </div>

            <div>
              <p className="w-label">{t.current}</p>
              <div className="flex flex-wrap gap-2">
                {info.media.length === 0 && <span className="text-sm text-muted">{t.noCurrent}</span>}
                {info.media.map((m) => (
                  <span key={m.id} className="w-chip w-chip-ink">
                    {MEDIA_ICON[m.media_type] || '•'} {m.media_type === 'audio' ? t.audio : m.media_type === 'video' ? t.video : m.media_type === 'image' ? t.image : m.title}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="w-label" htmlFor="m-title">{t.title}</label>
              <input id="m-title" className="w-input" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-3">
              <p className="w-label">{t.replaceMedia}</p>
              {blobMedia.length > 0 && <p className="-mt-1 text-xs text-muted">{t.replaceHint}</p>}
              <div className="w-seg grid-cols-3" role="group">
                {(['audio', 'video', 'image'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={mediaMode === key}
                    onClick={() => {
                      setMediaMode(key)
                      setNewMedia(null)
                    }}
                  >
                    {MEDIA_ICON[key]} {t[key]}
                  </button>
                ))}
              </div>
              <MediaCapture
                key={`${mediaMode}-${captureKey}`}
                mode={mediaMode}
                lang={lang}
                maxSeconds={mediaMode === 'video' ? getMaxVideoSeconds(info.orderType) : getMaxAudioSeconds(info.orderType)}
                onChange={setNewMedia}
              />
            </div>

            <div className="space-y-2">
              <p className="w-label">🔗 {t.links}</p>
              <input className="w-input" type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder={t.youtubePh} />
              <input className="w-input" type="url" value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} placeholder={t.spotifyPh} />
              <input className="w-input" type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder={t.linkPh} />
              <p className="text-xs text-muted">{t.linksHint}</p>
            </div>

            <div className="space-y-2">
              <p className="w-label">🆘 {t.emergency}</p>
              <input className="w-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePh} />
              <input className="w-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.locationPh} />
            </div>

            {notice && (notice.tone === 'error' ? <ErrorBox text={notice.text} lang={lang} /> : <div className="w-alert w-alert-success">{notice.text}</div>)}

            {progress !== null && (
              <div className="w-progress">
                <span style={{ width: `${Math.round(progress)}%` }} />
              </div>
            )}

            <button type="button" onClick={save} disabled={saving} className="w-btn w-btn-primary w-btn-block py-4">
              {saving ? (progress !== null ? `${t.uploading} %${Math.round(progress)}` : t.saving) : t.save}
            </button>
          </section>
        )}

        {info.mode !== 'guestbook' && <ManageExtras slug={slug} token={token} lang={lang} info={info} onChanged={() => void load()} />}

        <NfcWriter
          slug={slug}
          token={token}
          lang={lang}
          scanCount={info.nfcScanCount}
          encodedAt={info.nfcEncodedAt}
          locked={info.nfcLocked}
          onWritten={() => void load()}
        />
      </div>
    </ScanShell>
  )
}
