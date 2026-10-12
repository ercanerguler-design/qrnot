'use client'

import { useEffect, useState } from 'react'
import MediaCapture from '@/components/warm/MediaCapture'
import VoicePlayer from '@/components/warm/VoicePlayer'
import { uploadMediaDirect } from '@/lib/clientUpload'
import type { QRCode } from '@/lib/db'
import type { GuestbookEntry, PublicGuestbookSettings } from '@/lib/guestbook'
import { formatDate, type Lang } from '@/lib/i18n'
import { OwnerSecrets, ScanShell } from './ScanShared'

const GB_T = {
  tr: {
    setupBadge: 'Dijital Anı Defteri',
    setupTitle: 'Anı defterini kur',
    setupDesc: 'Etkinliğinin adını yaz, misafirlerin bu QR\'ı okutup sesli mesaj, video, fotoğraf ve yazılı anı bıraksın.',
    eventName: 'Etkinlik adı',
    eventPh: 'Örn: Ayşe & Mehmet\'in Düğünü',
    welcome: 'Misafirlere karşılama notu',
    welcomePh: 'Bu özel günde bize bir anı bırakır mısın? ❤️',
    pin: 'Yazma PIN\'i',
    pinHint: 'İsteğe bağlı. Masa kartına yazarsın; sadece etkinlikteki misafirler anı bırakabilir.',
    pinPh: '4-8 haneli rakam',
    moderation: 'Anılar ben onaylayınca görünsün',
    publicWall: 'Onaylı anılar bu sayfada herkese görünsün',
    create: 'Anı defterini oluştur',
    saving: 'Kaydediliyor…',
    doneTitle: 'Anı defterin hazır! 🎉',
    doneDesc: 'QR\'ı masalara koy. Gelen anıları sahip linkinden yönetebilirsin.',
    leaveTitle: 'Bir anı bırak',
    yourName: 'Adın',
    namePh: 'Örn: Zeynep Teyze',
    message: 'Mesajın',
    messagePh: 'İçinden geleni yaz…',
    addMedia: 'Ses, video ya da fotoğraf ekle',
    none: 'Sadece yazı',
    audio: 'Ses',
    video: 'Video',
    image: 'Fotoğraf',
    pinLabel: 'Masa kartındaki PIN',
    send: 'Anımı gönder',
    sending: 'Gönderiliyor…',
    uploading: 'Yükleniyor',
    thanksTitle: 'Teşekkürler! 💛',
    thanksPending: 'Anın kaydedildi. Ev sahibi onayladıktan sonra görünecek.',
    thanksApproved: 'Anın anı defterine eklendi.',
    already: 'Bu anı defterine zaten bir anı bıraktın. Teşekkürler!',
    closed: 'Bu anı defteri şu an yeni anı kabul etmiyor.',
    wall: 'Anılar',
    empty: 'İlk anıyı sen bırak!',
    manage: 'Anı defterini yönet',
    needName: 'Adını yazmalısın.',
    needContent: 'Bir mesaj yaz ya da ses/video/fotoğraf ekle.',
    error: 'Bir hata oluştu. Lütfen tekrar dene.',
  },
  en: {
    setupBadge: 'Audio & Video Guestbook',
    setupTitle: 'Set up your guestbook',
    setupDesc: 'Name your event and let guests scan this QR to leave voice messages, videos, photos and written notes.',
    eventName: 'Event name',
    eventPh: 'e.g. Emma & James\'s Wedding',
    welcome: 'Welcome note for guests',
    welcomePh: 'Would you leave us a memory on this special day? ❤️',
    pin: 'Guest PIN',
    pinHint: 'Optional. Print it on the table card so only your guests can leave memories.',
    pinPh: '4-8 digits',
    moderation: 'Show memories only after I approve them',
    publicWall: 'Show approved memories publicly on this page',
    create: 'Create guestbook',
    saving: 'Saving…',
    doneTitle: 'Your guestbook is ready! 🎉',
    doneDesc: 'Put the QR on your tables. Manage incoming memories from your owner link.',
    leaveTitle: 'Leave a memory',
    yourName: 'Your name',
    namePh: 'e.g. Aunt Sarah',
    message: 'Your message',
    messagePh: 'Write from the heart…',
    addMedia: 'Add voice, video or photo',
    none: 'Text only',
    audio: 'Voice',
    video: 'Video',
    image: 'Photo',
    pinLabel: 'PIN from the table card',
    send: 'Send my memory',
    sending: 'Sending…',
    uploading: 'Uploading',
    thanksTitle: 'Thank you! 💛',
    thanksPending: 'Your memory was saved. It will appear after the hosts approve it.',
    thanksApproved: 'Your memory was added to the guestbook.',
    already: 'You have already left a memory in this guestbook. Thank you!',
    closed: 'This guestbook is not accepting new memories right now.',
    wall: 'Memories',
    empty: 'Be the first to leave a memory!',
    manage: 'Manage guestbook',
    needName: 'Please enter your name.',
    needContent: 'Write a message or add a voice note, video or photo.',
    error: 'Something went wrong. Please try again.',
  },
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-cream-2/60 p-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#e8505b]" />
      <span className="text-sm text-ink-2">{label}</span>
    </label>
  )
}

export function GuestbookSetupView({ qr, lang }: { qr: QRCode; lang: Lang }) {
  const t = GB_T[lang]
  const [eventName, setEventName] = useState('')
  const [welcome, setWelcome] = useState('')
  const [pin, setPin] = useState('')
  const [moderation, setModeration] = useState(true)
  const [publicWall, setPublicWall] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ manageUrl: string; recoveryCode: string } | null>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/qr/${qr.slug}/guestbook/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, welcome, pin, moderation, publicWall }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      localStorage.setItem(`qrnote_token_${qr.slug}`, data.ownerToken)
      setResult({ manageUrl: data.manageUrl, recoveryCode: data.recoveryCode })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setLoading(false)
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
        <span className="w-chip w-chip-gold">📖 {t.setupBadge}</span>
        <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">{t.setupTitle}</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-2">{t.setupDesc}</p>
      </div>
      <div className="w-card space-y-5 p-5 sm:p-6">
        <div>
          <label className="w-label" htmlFor="gb-event">{t.eventName}</label>
          <input id="gb-event" className="w-input" value={eventName} maxLength={120} onChange={(e) => setEventName(e.target.value)} placeholder={t.eventPh} />
        </div>
        <div>
          <label className="w-label" htmlFor="gb-welcome">{t.welcome}</label>
          <textarea id="gb-welcome" className="w-input min-h-24" value={welcome} maxLength={400} onChange={(e) => setWelcome(e.target.value)} placeholder={t.welcomePh} />
        </div>
        <div>
          <label className="w-label" htmlFor="gb-pin">{t.pin}</label>
          <input id="gb-pin" className="w-input tracking-[0.3em]" inputMode="numeric" value={pin} maxLength={8} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder={t.pinPh} />
          <p className="mt-1.5 text-xs text-muted">{t.pinHint}</p>
        </div>
        <div className="space-y-2">
          <Toggle checked={moderation} onChange={setModeration} label={t.moderation} />
          <Toggle checked={publicWall} onChange={setPublicWall} label={t.publicWall} />
        </div>
        {error && <div className="w-alert w-alert-error">{error}</div>}
        <button type="button" onClick={submit} disabled={loading || !eventName.trim()} className="w-btn w-btn-primary w-btn-block py-4 text-base">
          {loading ? t.saving : `${t.create} →`}
        </button>
      </div>
    </ScanShell>
  )
}

export function EntryCard({ entry, slug, lang, token }: { entry: GuestbookEntry; slug: string; lang: Lang; token?: string }) {
  const src = `/api/qr/${slug}/guestbook/entries/${entry.id}/media${token ? `?token=${encodeURIComponent(token)}` : ''}`
  return (
    <article className="w-card space-y-3 p-4">
      <header className="flex items-center justify-between gap-3">
        <p className="font-semibold text-ink">{entry.author_name}</p>
        <time className="text-xs text-muted" dateTime={entry.created_at}>
          {formatDate(entry.created_at, lang)}
        </time>
      </header>
      {entry.message && <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{entry.message}</p>}
      {entry.media_type === 'audio' && (
        <div className="rounded-2xl bg-cream-2 p-3">
          <VoicePlayer src={src} lang={lang} compact />
        </div>
      )}
      {entry.media_type === 'video' && <video controls playsInline preload="metadata" src={src} className="w-full rounded-2xl bg-ink" />}
      {entry.media_type === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={entry.author_name} loading="lazy" className="max-h-96 w-full rounded-2xl bg-cream-2 object-contain" />
      )}
    </article>
  )
}

export function GuestbookView({ qr, lang, settings }: { qr: QRCode; lang: Lang; settings: PublicGuestbookSettings }) {
  const t = GB_T[lang]
  const [mediaMode, setMediaMode] = useState<'none' | 'audio' | 'video' | 'image'>('none')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [pin, setPin] = useState('')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sentStatus, setSentStatus] = useState<'pending' | 'approved' | null>(null)
  const [alreadyPosted, setAlreadyPosted] = useState(false)
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [ownerToken, setOwnerToken] = useState<string | null>(null)

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setOwnerToken(localStorage.getItem(`qrnote_token_${qr.slug}`)))
    return () => window.cancelAnimationFrame(raf)
  }, [qr.slug])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/qr/${qr.slug}/guestbook/entries`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data.entries)) setEntries(data.entries)
        if (data.alreadyPosted) setAlreadyPosted(true)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [qr.slug, sentStatus])

  const send = async () => {
    if (!name.trim()) return setError(t.needName)
    if (!message.trim() && !mediaFile) return setError(t.needContent)
    setSending(true)
    setError(null)
    try {
      let mediaBlobUrl: string | null = null
      if (mediaFile) {
        setProgress(0)
        mediaBlobUrl = await uploadMediaDirect({ slug: qr.slug, scope: 'gb', file: mediaFile, pin, onProgress: setProgress })
        setProgress(null)
      }
      const res = await fetch(`/api/qr/${qr.slug}/guestbook/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: name, message, media_blob_url: mediaBlobUrl, pin }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      setSentStatus(data.status === 'approved' ? 'approved' : 'pending')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.error)
    } finally {
      setSending(false)
      setProgress(null)
    }
  }

  const mediaOptions = [
    ['none', `✍️ ${t.none}`],
    ['audio', `🎙️ ${t.audio}`],
    ['video', `🎬 ${t.video}`],
    ['image', `🖼️ ${t.image}`],
  ] as const

  return (
    <ScanShell lang={lang}>
      <div className="mb-6 text-center">
        <span className="w-chip w-chip-gold">📖 {t.setupBadge}</span>
        <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">{settings.eventName || qr.title}</h1>
        {settings.welcome && <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-ink-2">{settings.welcome}</p>}
      </div>

      {!settings.open ? (
        <div className="w-alert w-alert-info text-center">{t.closed}</div>
      ) : sentStatus ? (
        <div className="w-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sage-soft text-3xl">💛</div>
          <h2 className="font-display text-2xl font-semibold">{t.thanksTitle}</h2>
          <p className="mt-2 text-ink-2">{sentStatus === 'approved' ? t.thanksApproved : t.thanksPending}</p>
        </div>
      ) : alreadyPosted ? (
        <div className="w-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sage-soft text-3xl">💛</div>
          <p className="text-ink-2">{t.already}</p>
        </div>
      ) : (
        <div className="w-card space-y-5 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">{t.leaveTitle}</h2>
          <div>
            <label className="w-label" htmlFor="gb-name">{t.yourName}</label>
            <input id="gb-name" className="w-input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={t.namePh} autoComplete="name" />
          </div>
          <div>
            <label className="w-label" htmlFor="gb-msg">{t.message}</label>
            <textarea id="gb-msg" className="w-input min-h-28" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder={t.messagePh} />
          </div>
          <div className="space-y-3">
            <p className="w-label">{t.addMedia}</p>
            <div className="w-seg grid-cols-2 sm:grid-cols-4" role="group">
              {mediaOptions.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={mediaMode === key}
                  onClick={() => {
                    setMediaMode(key)
                    setMediaFile(null)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {mediaMode !== 'none' && (
              <MediaCapture key={mediaMode} mode={mediaMode} lang={lang} maxSeconds={mediaMode === 'video' ? 60 : 120} onChange={setMediaFile} />
            )}
          </div>
          {settings.pinRequired && (
            <div>
              <label className="w-label" htmlFor="gb-pin-in">{t.pinLabel}</label>
              <input id="gb-pin-in" className="w-input tracking-[0.3em]" inputMode="numeric" value={pin} maxLength={8} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
            </div>
          )}
          {error && <div className="w-alert w-alert-error">{error}</div>}
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
          <button type="button" onClick={send} disabled={sending} className="w-btn w-btn-primary w-btn-block py-4 text-base">
            {sending ? t.sending : `${t.send} →`}
          </button>
        </div>
      )}

      {settings.publicWall && (
        <section className="mt-10">
          <h2 className="font-display mb-4 text-2xl font-semibold">{t.wall}</h2>
          {entries.length === 0 ? (
            <p className="text-center text-muted">{t.empty}</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} slug={qr.slug} lang={lang} />
              ))}
            </div>
          )}
        </section>
      )}

      {ownerToken && (
        <a href={`/manage/${qr.slug}?token=${ownerToken}`} className="w-btn w-btn-ghost w-btn-block mt-6">
          ⚙️ {t.manage}
        </a>
      )}
    </ScanShell>
  )
}
