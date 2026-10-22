'use client'

import { useEffect, useState } from 'react'
import MediaCapture from '@/components/warm/MediaCapture'
import VoicePlayer from '@/components/warm/VoicePlayer'
import { uploadMediaDirect } from '@/lib/clientUpload'
import type { Lang } from '@/lib/i18n'
import { ErrorBox } from './ScanShared'

// QR oynatma sayfasındaki ek özellikler: zaman kapsülü, kayıp modu, grup mesajları, cevap ver, altyazı.

export interface GroupMessage {
  id: string
  author_name: string
  message: string
  media_type: string | null
  created_at: string
}

export interface PlayExtrasData {
  lockedUntil: string | null
  lostMode: boolean
  repliesEnabled: boolean
  groupMessages: GroupMessage[]
  captionMediaIds: string[]
}

const T = {
  tr: {
    capsuleBadge: 'Zaman kapsülü',
    capsuleTitle: 'Bu mesaj henüz açılmadı',
    capsuleDesc: 'Sana özel bir mesaj bırakıldı. Belirlenen günde kendiliğinden açılacak.',
    opensOn: 'Açılış',
    days: 'gün',
    hours: 'saat',
    minutes: 'dk',
    seconds: 'sn',
    capsuleHint: 'O gün bu QR’ı tekrar okut ya da bu sayfayı yeniden aç.',
    lostTitle: 'Bu eşya kayıp!',
    lostDesc: 'Bulduysan sahibine ulaşmasına yardım et. Konumunu sadece senin onayınla, tek seferlik paylaşırsın.',
    foundTitle: 'Bu eşyayı mı buldun?',
    sendLocation: '📍 Konumumu sahibine gönder',
    sendNoteOnly: 'Sadece not gönder',
    notePh: 'Kısa bir not (ör. "Kadıköy iskelesinde buldum")',
    contactPh: 'Telefonun ya da e-postan (isteğe bağlı)',
    locating: 'Konum alınıyor…',
    sent: 'Teşekkürler! Sahibine bildirim gönderildi 💛',
    denied: 'Konum izni verilmedi. İstersen sadece not gönderebilirsin.',
    groupTitle: 'Herkesten mesajlar',
    replyTitle: 'Cevap ver',
    replyDesc: 'Bu hediyeyi gönderen kişiye sesli ya da yazılı bir cevap bırak. Cevabını sadece o görür.',
    replyOpen: '↩️ Cevap ver',
    yourName: 'Adın',
    message: 'Mesajın',
    addVoice: '🎙️ Sesli cevap ekle',
    removeVoice: 'Sesi kaldır',
    send: 'Gönder',
    sending: 'Gönderiliyor…',
    replySent: 'Cevabın iletildi 💛',
    error: 'Bir şeyler ters gitti, tekrar dene.',
    captions: 'Altyazı',
    captionLang: 'Dil',
    loading: 'Yükleniyor…',
  },
  en: {
    capsuleBadge: 'Time capsule',
    capsuleTitle: 'This message hasn’t opened yet',
    capsuleDesc: 'Someone left you a message. It will open by itself on the chosen day.',
    opensOn: 'Opens on',
    days: 'days',
    hours: 'hrs',
    minutes: 'min',
    seconds: 'sec',
    capsuleHint: 'Scan this QR again — or reopen this page — on that day.',
    lostTitle: 'This item is lost!',
    lostDesc: 'If you found it, help it get home. You share your location only with your consent, just once.',
    foundTitle: 'Did you find this item?',
    sendLocation: '📍 Send my location to the owner',
    sendNoteOnly: 'Send a note only',
    notePh: 'A short note (e.g. "Found it at the ferry pier")',
    contactPh: 'Your phone or email (optional)',
    locating: 'Getting your location…',
    sent: 'Thank you! The owner has been notified 💛',
    denied: 'Location permission denied. You can still send a note.',
    groupTitle: 'Messages from everyone',
    replyTitle: 'Reply',
    replyDesc: 'Leave a voice or written reply for the person who gave you this gift. Only they can see it.',
    replyOpen: '↩️ Reply',
    yourName: 'Your name',
    message: 'Your message',
    addVoice: '🎙️ Add a voice reply',
    removeVoice: 'Remove voice',
    send: 'Send',
    sending: 'Sending…',
    replySent: 'Your reply was sent 💛',
    error: 'Something went wrong, please try again.',
    captions: 'Captions',
    captionLang: 'Language',
    loading: 'Loading…',
  },
}

const LANGS: Array<[string, string]> = [
  ['tr', 'Türkçe'],
  ['en', 'English'],
  ['de', 'Deutsch'],
  ['fr', 'Français'],
  ['nl', 'Nederlands'],
  ['ar', 'العربية'],
  ['ru', 'Русский'],
  ['es', 'Español'],
]

// --- Zaman kapsülü --------------------------------------------------------------------------
export function TimeCapsuleCard({ unlockAt, lang }: { unlockAt: string; lang: Lang }) {
  const t = T[lang]
  const target = new Date(unlockAt).getTime()
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const raf = window.requestAnimationFrame(tick)
    const id = window.setInterval(tick, 1000)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    // Süre dolunca sayfayı yenile: içerik sunucudan açılmış olarak gelir
    if (now !== null && now >= target) window.location.reload()
  }, [now, target])

  const left = Math.max(0, target - (now ?? target))
  const parts: Array<[number, string]> = [
    [Math.floor(left / 86400000), t.days],
    [Math.floor((left % 86400000) / 3600000), t.hours],
    [Math.floor((left % 3600000) / 60000), t.minutes],
    [Math.floor((left % 60000) / 1000), t.seconds],
  ]

  return (
    <div className="w-card p-6 text-center sm:p-8">
      <span className="w-chip w-chip-gold">⏳ {t.capsuleBadge}</span>
      <h2 className="font-display mt-4 text-2xl font-semibold sm:text-3xl">{t.capsuleTitle}</h2>
      <p className="mt-2 text-ink-2">{t.capsuleDesc}</p>
      <div className="mt-6 grid grid-cols-4 gap-2">
        {parts.map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-cream-2 px-2 py-4">
            <div className="font-display text-3xl font-semibold tabular-nums">{now === null ? '–' : value}</div>
            <div className="text-xs text-muted">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm font-semibold">
        {t.opensOn}: {new Date(unlockAt).toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR', { dateStyle: 'long', timeStyle: 'short' })}
      </p>
      <p className="mt-1 text-xs text-muted">{t.capsuleHint}</p>
    </div>
  )
}

// --- Kayıp modu -----------------------------------------------------------------------------
export function LostModeCard({ slug, lang, lostMode }: { slug: string; lang: Lang; lostMode: boolean }) {
  const t = T[lang]
  const [open, setOpen] = useState(lostMode)
  const [note, setNote] = useState('')
  const [contact, setContact] = useState('')
  const [state, setState] = useState<'idle' | 'locating' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const send = async (coords: { lat: number; lng: number; accuracy: number } | null) => {
    setState('sending')
    try {
      const res = await fetch(`/api/qr/${slug}/found`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(coords || {}), message: note, contact }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      setState('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
      setState('idle')
    }
  }

  const shareLocation = () => {
    setError(null)
    if (!('geolocation' in navigator)) {
      setError(t.denied)
      return
    }
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => void send({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => {
        setError(t.denied)
        setState('idle')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }

  if (state === 'sent') return <div className="w-alert w-alert-success mt-4 text-center">{t.sent}</div>

  return (
    <div className={`w-card mt-4 space-y-3 p-5 ${lostMode ? 'border-2 border-coral' : ''}`}>
      {lostMode ? (
        <>
          <p className="font-display text-xl font-semibold text-coral">🚨 {t.lostTitle}</p>
          <p className="text-sm text-ink-2">{t.lostDesc}</p>
        </>
      ) : (
        <button type="button" onClick={() => setOpen((v) => !v)} className="w-full text-left text-sm font-semibold text-ink-2">
          🔎 {t.foundTitle}
        </button>
      )}
      {open && (
        <div className="space-y-2">
          <textarea className="w-input min-h-20" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={t.notePh} />
          <input className="w-input" value={contact} maxLength={80} onChange={(e) => setContact(e.target.value)} placeholder={t.contactPh} />
          <button type="button" className="w-btn w-btn-primary w-btn-block" disabled={state !== 'idle'} onClick={shareLocation}>
            {state === 'locating' ? t.locating : state === 'sending' ? t.sending : t.sendLocation}
          </button>
          {note.trim() && (
            <button type="button" className="w-btn w-btn-ghost w-btn-block" disabled={state !== 'idle'} onClick={() => void send(null)}>
              {t.sendNoteOnly}
            </button>
          )}
          {error && <ErrorBox text={error} lang={lang} />}
        </div>
      )}
    </div>
  )
}

// --- Grup mesajları -------------------------------------------------------------------------
function EntryMedia({ slug, entry, lang }: { slug: string; entry: GroupMessage; lang: Lang }) {
  const src = `/api/qr/${slug}/entries/${entry.id}/media`
  if (entry.media_type === 'audio') return <VoicePlayer src={src} lang={lang} compact />
  if (entry.media_type === 'video') return <video controls playsInline preload="metadata" src={src} className="w-full rounded-xl bg-ink" />
  // eslint-disable-next-line @next/next/no-img-element
  if (entry.media_type === 'image') return <img src={src} alt={entry.author_name} className="max-h-96 w-full rounded-xl object-contain" loading="lazy" />
  return null
}

export function GroupMessages({ slug, lang, messages }: { slug: string; lang: Lang; messages: GroupMessage[] }) {
  if (messages.length === 0) return null
  const t = T[lang]
  return (
    <section className="mt-6 space-y-3">
      <h2 className="font-display text-xl font-semibold">👨‍👩‍👧 {t.groupTitle}</h2>
      {messages.map((m) => (
        <article key={m.id} className="w-card space-y-3 p-4">
          <p className="font-semibold">{m.author_name}</p>
          {m.message && <p className="whitespace-pre-line text-ink-2">{m.message}</p>}
          {m.media_type && <EntryMedia slug={slug} entry={m} lang={lang} />}
        </article>
      ))}
    </section>
  )
}

// --- Cevap ver ------------------------------------------------------------------------------
export function ReplyBox({ slug, lang }: { slug: string; lang: Lang }) {
  const t = T[lang]
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [voice, setVoice] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      let mediaBlobUrl: string | null = null
      if (file) mediaBlobUrl = await uploadMediaDirect({ slug, scope: 'rp', file })
      const res = await fetch(`/api/qr/${slug}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: name, message, media_blob_url: mediaBlobUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.error)
    } finally {
      setBusy(false)
    }
  }

  if (done) return <div className="w-alert w-alert-success mt-4 text-center">{t.replySent}</div>
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-btn w-btn-dark w-btn-block mt-4">
        {t.replyOpen}
      </button>
    )

  return (
    <section className="w-card mt-4 space-y-3 p-5">
      <h2 className="font-display text-xl font-semibold">↩️ {t.replyTitle}</h2>
      <p className="text-sm text-ink-2">{t.replyDesc}</p>
      <input className="w-input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={t.yourName} />
      <textarea className="w-input min-h-24" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder={t.message} />
      {voice ? (
        <div className="space-y-2">
          <MediaCapture mode="audio" lang={lang} maxSeconds={120} onChange={setFile} />
          <button
            type="button"
            className="text-xs text-muted hover:text-ink"
            onClick={() => {
              setVoice(false)
              setFile(null)
            }}
          >
            {t.removeVoice}
          </button>
        </div>
      ) : (
        <button type="button" className="w-btn w-btn-ghost w-btn-sm" onClick={() => setVoice(true)}>
          {t.addVoice}
        </button>
      )}
      {error && <ErrorBox text={error} lang={lang} />}
      <button type="button" className="w-btn w-btn-primary w-btn-block" disabled={busy || !name.trim() || (!message.trim() && !file)} onClick={submit}>
        {busy ? t.sending : t.send}
      </button>
    </section>
  )
}

// --- Altyazı --------------------------------------------------------------------------------
export function CaptionPanel({ slug, mediaId, lang }: { slug: string; mediaId: string; lang: Lang }) {
  const t = T[lang]
  const [target, setTarget] = useState<string>(lang)
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/qr/${slug}/media/${mediaId}/caption?lang=${target}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || t.error)
        if (alive) setText(data.text)
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : t.error)
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => {
      alive = false
    }
  }, [slug, mediaId, target, t.error])

  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">💬 {t.captions}</p>
        <label className="flex items-center gap-2 text-xs text-muted">
          {t.captionLang}
          <select className="w-input w-auto py-1 text-sm" value={target} onChange={(e) => setTarget(e.target.value)}>
            {LANGS.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-2" dir={target === 'ar' ? 'rtl' : 'ltr'}>
        {loading ? t.loading : error ? error : text}
      </p>
    </div>
  )
}
