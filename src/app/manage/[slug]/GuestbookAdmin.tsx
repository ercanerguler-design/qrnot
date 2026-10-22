'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GuestbookEntry, PublicGuestbookSettings } from '@/lib/guestbook'
import type { Lang } from '@/lib/i18n'
import { EntryCard } from '@/app/q/[slug]/GuestbookClient'

const T = {
  tr: {
    settings: 'Anı defteri ayarları',
    eventName: 'Etkinlik adı',
    welcome: 'Karşılama notu',
    open: 'Yeni anı kabul et',
    moderation: 'Anılar ben onaylayınca görünsün',
    publicWall: 'Onaylı anılar QR sayfasında herkese görünsün',
    pin: 'Yazma PIN\'i',
    pinKeep: 'Değiştirmek için yeni PIN yaz (boş bırakırsan aynı kalır)',
    pinOn: 'PIN açık',
    pinOff: 'PIN yok',
    removePin: 'PIN\'i kaldır',
    save: 'Ayarları kaydet',
    saved: 'Kaydedildi ✓',
    entries: 'Gelen anılar',
    all: 'Tümü',
    pending: 'Onay bekleyen',
    approved: 'Onaylı',
    rejected: 'Reddedilen',
    approve: 'Onayla',
    reject: 'Reddet',
    remove: 'Sil',
    download: 'İndir',
    confirmDelete: 'Bu anı kalıcı olarak silinsin mi?',
    empty: 'Bu filtrede anı yok.',
    refresh: 'Yenile',
    error: 'İşlem başarısız. Tekrar dene.',
    printCards: 'Masa kartlarını yazdır',
  },
  en: {
    settings: 'Guestbook settings',
    eventName: 'Event name',
    welcome: 'Welcome note',
    open: 'Accept new memories',
    moderation: 'Show memories only after I approve them',
    publicWall: 'Show approved memories publicly on the QR page',
    pin: 'Guest PIN',
    pinKeep: 'Type a new PIN to change it (leave empty to keep)',
    pinOn: 'PIN on',
    pinOff: 'No PIN',
    removePin: 'Remove PIN',
    save: 'Save settings',
    saved: 'Saved ✓',
    entries: 'Memories',
    all: 'All',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    approve: 'Approve',
    reject: 'Reject',
    remove: 'Delete',
    download: 'Download',
    confirmDelete: 'Delete this memory permanently?',
    empty: 'No memories in this filter.',
    refresh: 'Refresh',
    error: 'Action failed. Try again.',
    printCards: 'Print table cards',
  },
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export default function GuestbookAdmin({
  slug,
  token,
  lang,
  initial,
}: {
  slug: string
  token: string
  lang: Lang
  initial: PublicGuestbookSettings
}) {
  const t = T[lang]
  const [settings, setSettings] = useState(initial)
  const [newPin, setNewPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [filter, setFilter] = useState<Filter>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/qr/${slug}/guestbook/entries?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (Array.isArray(data.entries)) setEntries(data.entries)
  }, [slug, token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true)
    setNotice(null)
    try {
      const res = await fetch(`/api/qr/${slug}/guestbook/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...patch }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      setSettings(data.settings)
      setNewPin('')
      setNotice({ tone: 'success', text: t.saved })
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : t.error })
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id)
    const res = await fetch(`/api/qr/${slug}/guestbook/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, status }),
    })
    if (res.ok) setEntries((list) => list.map((item) => (item.id === id ? { ...item, status } : item)))
    setBusyId(null)
  }

  const remove = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return
    setBusyId(id)
    const res = await fetch(`/api/qr/${slug}/guestbook/entries/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (res.ok) setEntries((list) => list.filter((item) => item.id !== id))
    setBusyId(null)
  }

  const counts = {
    all: entries.length,
    pending: entries.filter((e) => e.status === 'pending').length,
    approved: entries.filter((e) => e.status === 'approved').length,
    rejected: entries.filter((e) => e.status === 'rejected').length,
  }
  const visible = filter === 'all' ? entries : entries.filter((entry) => entry.status === filter)

  return (
    <div className="space-y-6">
      <section className="w-card space-y-3 p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">✨ {lang === 'en' ? 'Film & live wall' : 'Anı filmi ve canlı duvar'}</h2>
        <p className="text-sm text-ink-2">
          {lang === 'en'
            ? 'Show approved memories on the venue screen during the event, then watch them back as a film.'
            : 'Etkinlik sırasında onaylı anıları salondaki ekrana yansıt, sonra hepsini bir film gibi izle.'}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={`/q/${slug}/duvar?token=${encodeURIComponent(token)}${lang === 'en' ? '&lang=en' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-btn w-btn-dark"
          >
            📺 {lang === 'en' ? 'Open live wall' : 'Canlı duvarı aç'}
          </a>
          <a
            href={`/q/${slug}/film?token=${encodeURIComponent(token)}${lang === 'en' ? '&lang=en' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-btn w-btn-primary"
          >
            🎬 {lang === 'en' ? 'Watch the memory film' : 'Anı filmini izle'}
          </a>
        </div>
      </section>
      <section className="w-card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">⚙️ {t.settings}</h2>
          <a href={`/guestbook/cards/${slug}${lang === 'en' ? '?lang=en' : ''}`} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-ghost w-btn-sm">
            🖨️ {t.printCards}
          </a>
        </div>
        <div>
          <label className="w-label" htmlFor="ga-name">{t.eventName}</label>
          <input id="ga-name" className="w-input" value={settings.eventName} maxLength={120} onChange={(e) => setSettings({ ...settings, eventName: e.target.value })} />
        </div>
        <div>
          <label className="w-label" htmlFor="ga-welcome">{t.welcome}</label>
          <textarea id="ga-welcome" className="w-input min-h-20" value={settings.welcome} maxLength={400} onChange={(e) => setSettings({ ...settings, welcome: e.target.value })} />
        </div>
        <div className="space-y-2">
          {(
            [
              ['open', t.open],
              ['moderation', t.moderation],
              ['publicWall', t.publicWall],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-cream-2/60 p-3">
              <input type="checkbox" checked={settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })} className="h-5 w-5 accent-[#e8505b]" />
              <span className="text-sm text-ink-2">{label}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="w-label" htmlFor="ga-pin">
            {t.pin} <span className={`w-chip ml-1 ${settings.pinRequired ? 'w-chip-sage' : 'w-chip-ink'}`}>{settings.pinRequired ? t.pinOn : t.pinOff}</span>
          </label>
          <input id="ga-pin" className="w-input tracking-[0.3em]" inputMode="numeric" value={newPin} maxLength={8} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
          <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted">
            <span>{t.pinKeep}</span>
            {settings.pinRequired && (
              <button type="button" className="w-link" onClick={() => save({ pin: '' })}>
                {t.removePin}
              </button>
            )}
          </div>
        </div>
        {notice && <div className={`w-alert ${notice.tone === 'success' ? 'w-alert-success' : 'w-alert-error'}`}>{notice.text}</div>}
        <button
          type="button"
          className="w-btn w-btn-dark w-btn-block"
          disabled={saving}
          onClick={() =>
            save({
              eventName: settings.eventName,
              welcome: settings.welcome,
              open: settings.open,
              moderation: settings.moderation,
              publicWall: settings.publicWall,
              ...(newPin ? { pin: newPin } : {}),
            })
          }
        >
          {t.save}
        </button>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">💌 {t.entries}</h2>
          <button type="button" onClick={() => void load()} className="w-btn w-btn-ghost w-btn-sm">
            ↻ {t.refresh}
          </button>
        </div>
        <div className="w-seg grid-cols-2 sm:grid-cols-4" role="group">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((key) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {t[key]} ({counts[key]})
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="py-6 text-center text-muted">{t.empty}</p>
        ) : (
          <div className="space-y-3">
            {visible.map((entry) => (
              <div key={entry.id} className="space-y-2">
                <EntryCard entry={entry} slug={slug} lang={lang} token={token} />
                <div className="flex flex-wrap gap-2">
                  {entry.status !== 'approved' && (
                    <button type="button" disabled={busyId === entry.id} onClick={() => setStatus(entry.id, 'approved')} className="w-btn w-btn-primary w-btn-sm">
                      ✓ {t.approve}
                    </button>
                  )}
                  {entry.status !== 'rejected' && (
                    <button type="button" disabled={busyId === entry.id} onClick={() => setStatus(entry.id, 'rejected')} className="w-btn w-btn-ghost w-btn-sm">
                      {t.reject}
                    </button>
                  )}
                  {entry.media_type && (
                    <a href={`/api/qr/${slug}/guestbook/entries/${entry.id}/media?token=${encodeURIComponent(token)}&download=1`} className="w-btn w-btn-ghost w-btn-sm">
                      ⬇ {t.download}
                    </a>
                  )}
                  <button type="button" disabled={busyId === entry.id} onClick={() => remove(entry.id)} className="w-btn w-btn-ghost w-btn-sm text-[#8f2a24]">
                    {t.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
