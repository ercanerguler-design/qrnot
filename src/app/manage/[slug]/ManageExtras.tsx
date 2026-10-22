'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import VoicePlayer from '@/components/warm/VoicePlayer'
import { withLang, type Lang } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'

// Yönetim paneli ek bölümleri: zaman kapsülü, kayıp modu, bildirim, cevaplar, grup hediyesi, altyazı.

export interface ExtrasInfo {
  unlockAt: string | null
  lostMode: boolean
  notifyScans: boolean
  repliesEnabled: boolean
  groupToken: string | null
  premium: boolean
  aiCaptions: boolean
  media: Array<{ id: string; media_type: string; source_type: string; transcript?: string | null; transcript_lang?: string | null }>
}

interface Entry {
  id: string
  author_name: string
  message: string
  media_type: string | null
  status: string
  created_at: string
}

const T = {
  tr: {
    featuresTitle: 'Özellikler',
    capsule: '⏳ Zaman kapsülü',
    capsuleHint: 'İçerik bu tarihe kadar kilitli kalır; okutan kişi geri sayım görür. Örn. çocuğunun 18. yaş günü.',
    capsuleOn: 'Açılış',
    capsuleSet: 'Kilitle',
    capsuleRemove: 'Kilidi kaldır',
    lost: '🚨 Kayıp modu',
    lostHint: 'Açıkken QR sayfasında “Bu eşya kayıp” uyarısı çıkar; bulan kişi izin verirse konumunu sana gönderir.',
    notify: '🔔 Okutma bildirimi',
    notifyHint: 'QR’ın okutulunca bildirim al (en fazla 10 dakikada bir).',
    notifySetup: 'Telefonuma bildirim gelsin →',
    replies: '↩️ Cevap ver',
    repliesHint: 'Hediyeyi alan kişi sana sesli ya da yazılı cevap bırakabilsin.',
    group: '👨‍👩‍👧 Grup hediyesi',
    groupHint: 'Davet linkini paylaş; herkes hediyeye mesaj eklesin. Mesajlar sen onaylayınca görünür.',
    groupLink: 'Davet linki',
    copy: 'Kopyala',
    copied: 'Kopyalandı ✓',
    newLink: 'Linki yenile',
    on: 'Açık',
    off: 'Kapalı',
    saved: 'Kaydedildi ✓',
    error: 'Kaydedilemedi, tekrar dene.',
    repliesTitle: 'Gelen cevaplar',
    groupTitle: 'Grup mesajları',
    empty: 'Henüz yok',
    approve: 'Onayla',
    reject: 'Gizle',
    remove: 'Sil',
    confirmDelete: 'Bu mesaj kalıcı olarak silinsin mi?',
    pending: 'Onay bekliyor',
    approved: 'Görünür',
    rejected: 'Gizli',
    download: 'İndir',
    captionsTitle: '💬 Yapay zekâ altyazı',
    captionsHint: 'Ses ve videonu yazıya dökeriz; okutan kişi 8 dilden birinde okur.',
    makeCaption: 'Altyazı oluştur',
    remakeCaption: 'Yeniden oluştur',
    working: 'Hazırlanıyor… (1 dakikaya kadar sürebilir)',
    premiumOnly: 'Altyazı Premium üyelikle kullanılabilir.',
    getPremium: 'Premium’a geç (199 TL / yıl) →',
    notActive: 'Altyazı servisi çok yakında aktif olacak.',
    noMedia: 'Altyazı için önce ses ya da video ekle.',
    audio: '🎙️ Ses',
    video: '🎬 Video',
    premiumBadge: '💎 Premium',
  },
  en: {
    featuresTitle: 'Features',
    capsule: '⏳ Time capsule',
    capsuleHint: 'Content stays locked until this date; anyone who scans sees a countdown. E.g. your child’s 18th birthday.',
    capsuleOn: 'Opens',
    capsuleSet: 'Lock',
    capsuleRemove: 'Remove lock',
    lost: '🚨 Lost mode',
    lostHint: 'Shows a “This item is lost” banner; the finder can send you their location with their consent.',
    notify: '🔔 Scan notifications',
    notifyHint: 'Get notified when your QR is scanned (at most every 10 minutes).',
    notifySetup: 'Send notifications to my phone →',
    replies: '↩️ Replies',
    repliesHint: 'Let the recipient leave you a voice or written reply.',
    group: '👨‍👩‍👧 Group gift',
    groupHint: 'Share the invite link so everyone can add a message. Messages appear once you approve them.',
    groupLink: 'Invite link',
    copy: 'Copy',
    copied: 'Copied ✓',
    newLink: 'Reset link',
    on: 'On',
    off: 'Off',
    saved: 'Saved ✓',
    error: 'Could not save, try again.',
    repliesTitle: 'Replies',
    groupTitle: 'Group messages',
    empty: 'None yet',
    approve: 'Approve',
    reject: 'Hide',
    remove: 'Delete',
    confirmDelete: 'Permanently delete this message?',
    pending: 'Pending',
    approved: 'Visible',
    rejected: 'Hidden',
    download: 'Download',
    captionsTitle: '💬 AI captions',
    captionsHint: 'We turn your voice and video into text; viewers read it in one of 8 languages.',
    makeCaption: 'Create captions',
    remakeCaption: 'Recreate',
    working: 'Working… (can take up to a minute)',
    premiumOnly: 'Captions are part of Premium.',
    getPremium: 'Go Premium ($9.99 / year) →',
    notActive: 'The caption service will be live very soon.',
    noMedia: 'Add a voice or video message first.',
    audio: '🎙️ Voice',
    video: '🎬 Video',
    premiumBadge: '💎 Premium',
  },
}

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-line bg-cream-2/60 p-4">
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-6 w-6 shrink-0 accent-[#e8505b]" />
    </label>
  )
}

export default function ManageExtras({ slug, token, lang, info, onChanged }: { slug: string; token: string; lang: Lang; info: ExtrasInfo; onChanged: () => void }) {
  const t = T[lang]
  const [unlockInput, setUnlockInput] = useState(toLocalInput(info.unlockAt))
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [replies, setReplies] = useState<Entry[]>([])
  const [group, setGroup] = useState<Entry[]>([])
  const [captionBusy, setCaptionBusy] = useState<string | null>(null)
  const [captionError, setCaptionError] = useState<string | null>(null)

  const saveSettings = async (patch: Record<string, unknown>) => {
    setNotice(null)
    const res = await fetch(`/api/qr/${slug}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...patch }),
    })
    const data = await res.json().catch(() => ({}))
    setNotice(res.ok ? { ok: true, text: t.saved } : { ok: false, text: data.error || t.error })
    if (res.ok) onChanged()
  }

  const loadEntries = useCallback(async () => {
    const [r, g] = await Promise.all([
      fetch(`/api/qr/${slug}/replies?token=${encodeURIComponent(token)}`, { cache: 'no-store' }).then((x) => (x.ok ? x.json() : { entries: [] })),
      fetch(`/api/qr/${slug}/group?token=${encodeURIComponent(token)}`, { cache: 'no-store' }).then((x) => (x.ok ? x.json() : { entries: [] })),
    ])
    setReplies(r.entries || [])
    setGroup(g.entries || [])
  }, [slug, token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEntries()
  }, [loadEntries])

  const entryAction = async (id: string, method: 'PATCH' | 'DELETE', status?: string) => {
    if (method === 'DELETE' && !window.confirm(t.confirmDelete)) return
    await fetch(`/api/qr/${slug}/entries/${id}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, status }),
    })
    await loadEntries()
  }

  const makeCaption = async (mediaId: string) => {
    setCaptionBusy(mediaId)
    setCaptionError(null)
    try {
      const res = await fetch(`/api/qr/${slug}/media/${mediaId}/caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      onChanged()
    } catch (err) {
      setCaptionError(err instanceof Error ? err.message : t.error)
    } finally {
      setCaptionBusy(null)
    }
  }

  const inviteUrl = info.groupToken ? `${SITE_URL}/q/${slug}/katki?k=${info.groupToken}` : ''
  const captionMedia = info.media.filter((m) => m.source_type === 'blob' && (m.media_type === 'audio' || m.media_type === 'video'))
  const mediaSrc = (id: string, download = false) => `/api/qr/${slug}/entries/${id}/media?token=${encodeURIComponent(token)}${download ? '&download=1' : ''}`

  const renderEntry = (e: Entry, withApprove: boolean) => (
    <article key={e.id} className="space-y-2 rounded-2xl border border-line bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{e.author_name}</p>
        <span className="text-xs text-muted">{new Date(e.created_at).toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR')}</span>
      </div>
      {e.message && <p className="whitespace-pre-line text-sm text-ink-2">{e.message}</p>}
      {e.media_type === 'audio' && <VoicePlayer src={mediaSrc(e.id)} lang={lang} compact />}
      {e.media_type === 'video' && <video controls playsInline preload="metadata" src={mediaSrc(e.id)} className="w-full rounded-xl bg-ink" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {e.media_type === 'image' && <img src={mediaSrc(e.id)} alt={e.author_name} className="max-h-72 rounded-xl" />}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {withApprove && (
          <span className={`w-chip ${e.status === 'approved' ? 'w-chip-sage' : e.status === 'pending' ? 'w-chip-gold' : 'w-chip-ink'}`}>
            {e.status === 'approved' ? t.approved : e.status === 'pending' ? t.pending : t.rejected}
          </span>
        )}
        {withApprove && e.status !== 'approved' && (
          <button type="button" className="w-btn w-btn-dark w-btn-sm" onClick={() => entryAction(e.id, 'PATCH', 'approved')}>
            {t.approve}
          </button>
        )}
        {withApprove && e.status === 'approved' && (
          <button type="button" className="w-btn w-btn-ghost w-btn-sm" onClick={() => entryAction(e.id, 'PATCH', 'rejected')}>
            {t.reject}
          </button>
        )}
        {e.media_type && (
          <a href={mediaSrc(e.id, true)} className="w-btn w-btn-ghost w-btn-sm">
            ⬇ {t.download}
          </a>
        )}
        <button type="button" className="text-xs text-coral hover:underline" onClick={() => entryAction(e.id, 'DELETE')}>
          {t.remove}
        </button>
      </div>
    </article>
  )

  return (
    <>
      <section className="w-card space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">{t.featuresTitle}</h2>
          {info.premium && <span className="w-chip w-chip-gold">{t.premiumBadge}</span>}
        </div>

        <div className="space-y-3 rounded-2xl border border-line bg-cream-2/60 p-4">
          <p className="font-semibold text-ink">{t.capsule}</p>
          <p className="text-xs text-muted">{t.capsuleHint}</p>
          {info.unlockAt && (
            <p className="text-sm font-semibold">
              {t.capsuleOn}: {new Date(info.unlockAt).toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <input type="datetime-local" className="w-input w-auto" value={unlockInput} onChange={(e) => setUnlockInput(e.target.value)} />
            <button
              type="button"
              className="w-btn w-btn-dark w-btn-sm"
              disabled={!unlockInput}
              onClick={() => saveSettings({ unlockAt: new Date(unlockInput).toISOString() })}
            >
              {t.capsuleSet}
            </button>
            {info.unlockAt && (
              <button
                type="button"
                className="w-btn w-btn-ghost w-btn-sm"
                onClick={() => {
                  setUnlockInput('')
                  void saveSettings({ unlockAt: null })
                }}
              >
                {t.capsuleRemove}
              </button>
            )}
          </div>
        </div>

        <Toggle checked={info.lostMode} onChange={(v) => saveSettings({ lostMode: v })} label={t.lost} hint={t.lostHint} />
        <div>
          <Toggle checked={info.notifyScans} onChange={(v) => saveSettings({ notifyScans: v })} label={t.notify} hint={t.notifyHint} />
          <Link href={withLang('/account?tab=notifications', lang)} className="mt-2 inline-block text-xs font-semibold text-coral hover:underline">
            {t.notifySetup}
          </Link>
        </div>
        <Toggle checked={info.repliesEnabled} onChange={(v) => saveSettings({ repliesEnabled: v })} label={t.replies} hint={t.repliesHint} />
        <div className="space-y-3">
          <Toggle checked={Boolean(info.groupToken)} onChange={(v) => saveSettings({ groupEnabled: v })} label={t.group} hint={t.groupHint} />
          {inviteUrl && (
            <div className="space-y-2 rounded-2xl border border-line bg-paper p-4">
              <p className="text-xs font-semibold text-muted">{t.groupLink}</p>
              <p className="break-all font-mono text-xs">{inviteUrl}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="w-btn w-btn-dark w-btn-sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteUrl).catch(() => undefined)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1800)
                  }}
                >
                  {copied ? t.copied : t.copy}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(inviteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-btn w-btn-whatsapp w-btn-sm"
                >
                  WhatsApp
                </a>
                <button type="button" className="w-btn w-btn-ghost w-btn-sm" onClick={() => saveSettings({ regenerateGroupLink: true })}>
                  {t.newLink}
                </button>
              </div>
            </div>
          )}
        </div>

        {notice && <div className={`w-alert ${notice.ok ? 'w-alert-success' : 'w-alert-error'}`}>{notice.text}</div>}
      </section>

      <section className="w-card space-y-3 p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">{t.captionsTitle}</h2>
        <p className="text-sm text-ink-2">{t.captionsHint}</p>
        {!info.premium ? (
          <div className="space-y-2 rounded-2xl bg-gold-soft/60 p-4">
            <p className="text-sm font-semibold">{t.premiumOnly}</p>
            <Link href={withLang('/shop/premium', lang)} className="w-btn w-btn-primary w-btn-sm">
              {t.getPremium}
            </Link>
          </div>
        ) : !info.aiCaptions ? (
          <p className="text-sm text-muted">{t.notActive}</p>
        ) : captionMedia.length === 0 ? (
          <p className="text-sm text-muted">{t.noMedia}</p>
        ) : (
          captionMedia.map((m) => (
            <div key={m.id} className="space-y-2 rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{m.media_type === 'audio' ? t.audio : t.video}</span>
                <button type="button" className="w-btn w-btn-dark w-btn-sm" disabled={captionBusy !== null} onClick={() => makeCaption(m.id)}>
                  {captionBusy === m.id ? t.working : m.transcript ? t.remakeCaption : t.makeCaption}
                </button>
              </div>
              {m.transcript && <p className="whitespace-pre-line text-sm text-ink-2">{m.transcript}</p>}
            </div>
          ))
        )}
        {captionError && <div className="w-alert w-alert-error">{captionError}</div>}
      </section>

      <section className="w-card space-y-3 p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">↩️ {t.repliesTitle}</h2>
        {replies.length === 0 ? <p className="text-sm text-muted">{t.empty}</p> : replies.map((e) => renderEntry(e, false))}
      </section>

      {(info.groupToken || group.length > 0) && (
        <section className="w-card space-y-3 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">👨‍👩‍👧 {t.groupTitle}</h2>
          {group.length === 0 ? <p className="text-sm text-muted">{t.empty}</p> : group.map((e) => renderEntry(e, true))}
        </section>
      )}
    </>
  )
}
