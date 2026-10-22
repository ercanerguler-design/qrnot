'use client'

import { useState } from 'react'
import MediaCapture from '@/components/warm/MediaCapture'
import { uploadMediaDirect } from '@/lib/clientUpload'
import type { Lang } from '@/lib/i18n'
import { ErrorBox, ScanShell } from '../ScanShared'

const T = {
  tr: {
    badge: 'Grup hediyesi',
    title: 'Hediyeye senin mesajın da eklensin',
    desc: 'Bu hediyeyi birlikte hazırlıyorsunuz. Sesli, videolu, fotoğraflı ya da yazılı mesajını bırak; hediye sahibi onaylayınca hediyeyi alan kişi herkesin mesajını görecek.',
    invalidTitle: 'Bu davet linki geçersiz',
    invalidDesc: 'Link kapatılmış ya da yanlış kopyalanmış olabilir. Seni davet eden kişiden yeni link iste.',
    yourName: 'Adın',
    message: 'Mesajın',
    none: '✍️ Sadece yazı',
    audio: '🎙️ Ses',
    video: '🎬 Video',
    image: '🖼️ Fotoğraf',
    send: 'Mesajımı ekle',
    sending: 'Gönderiliyor…',
    uploading: 'Yükleniyor',
    doneTitle: 'Teşekkürler! 💛',
    doneDesc: 'Mesajın hediyeye eklendi. Hediye sahibi onayladıktan sonra görünecek.',
    error: 'Bir şeyler ters gitti, tekrar dene.',
  },
  en: {
    badge: 'Group gift',
    title: 'Add your message to the gift',
    desc: 'You are making this gift together. Leave a voice, video, photo or written message — once the gift owner approves it, the recipient will see everyone’s messages.',
    invalidTitle: 'This invite link is not valid',
    invalidDesc: 'The link may have been closed or copied incorrectly. Ask the person who invited you for a new link.',
    yourName: 'Your name',
    message: 'Your message',
    none: '✍️ Text only',
    audio: '🎙️ Voice',
    video: '🎬 Video',
    image: '🖼️ Photo',
    send: 'Add my message',
    sending: 'Sending…',
    uploading: 'Uploading',
    doneTitle: 'Thank you! 💛',
    doneDesc: 'Your message was added to the gift. It will appear once the gift owner approves it.',
    error: 'Something went wrong, please try again.',
  },
}

export default function GroupContributeClient({ slug, groupKey, title, lang, valid }: { slug: string; groupKey: string; title: string; lang: Lang; valid: boolean }) {
  const t = T[lang]
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'none' | 'audio' | 'video' | 'image'>('none')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      let mediaBlobUrl: string | null = null
      if (file) {
        setProgress(0)
        mediaBlobUrl = await uploadMediaDirect({ slug, scope: 'gp', file, groupKey, onProgress: setProgress })
        setProgress(null)
      }
      const res = await fetch(`/api/qr/${slug}/group?k=${encodeURIComponent(groupKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: name, message, media_blob_url: mediaBlobUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.error)
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  if (!valid) {
    return (
      <ScanShell lang={lang}>
        <div className="w-card p-8 text-center">
          <div className="mb-3 text-5xl">🔒</div>
          <h1 className="font-display text-2xl font-semibold">{t.invalidTitle}</h1>
          <p className="mt-2 text-ink-2">{t.invalidDesc}</p>
        </div>
      </ScanShell>
    )
  }

  if (done) {
    return (
      <ScanShell lang={lang}>
        <div className="w-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sage-soft text-3xl">💛</div>
          <h1 className="font-display text-2xl font-semibold">{t.doneTitle}</h1>
          <p className="mt-2 text-ink-2">{t.doneDesc}</p>
        </div>
      </ScanShell>
    )
  }

  return (
    <ScanShell lang={lang}>
      <div className="mb-6 text-center">
        <span className="w-chip w-chip-gold">👨‍👩‍👧 {t.badge}</span>
        <h1 className="font-display mt-3 text-3xl font-semibold">{title || t.title}</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-2">{t.desc}</p>
      </div>
      <div className="w-card space-y-5 p-5 sm:p-6">
        <input className="w-input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={t.yourName} autoComplete="name" />
        <textarea className="w-input min-h-28" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder={t.message} />
        <div className="w-seg grid-cols-2 sm:grid-cols-4" role="group">
          {(['none', 'audio', 'video', 'image'] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => {
                setMode(key)
                setFile(null)
              }}
            >
              {t[key]}
            </button>
          ))}
        </div>
        {mode !== 'none' && <MediaCapture key={mode} mode={mode} lang={lang} maxSeconds={120} onChange={setFile} />}
        {error && <ErrorBox text={error} lang={lang} />}
        {progress !== null && (
          <div className="w-progress">
            <span style={{ width: `${Math.round(progress)}%` }} />
          </div>
        )}
        <button type="button" className="w-btn w-btn-primary w-btn-block py-4" disabled={busy || !name.trim() || (!message.trim() && !file)} onClick={submit}>
          {busy ? (progress !== null ? `${t.uploading} %${Math.round(progress)}` : t.sending) : t.send}
        </button>
      </div>
    </ScanShell>
  )
}
