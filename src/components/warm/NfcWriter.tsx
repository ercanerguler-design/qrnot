'use client'

import { useEffect, useRef, useState } from 'react'
import type { Lang } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'
import { describeNfcError, isWebNfcSupported, nfcUrlFor, readNextTag, writeUrlToTag } from '@/lib/webNfc'

const T = {
  tr: {
    title: 'NFC etiketine yaz',
    desc: 'NFC\'li kolye, anahtarlık ya da sticker\'ını bu QR\'a bağla. Telefonu dokundurmak içeriği açar.',
    write: 'Etikete yaz',
    waiting: 'Telefonun arkasını etikete yaklaştır…',
    lock: 'Yazdıktan sonra etiketi kilitle (kalıcı, geri alınamaz)',
    lockHint: 'Kilitlenen etiketin içeriği başkası tarafından değiştirilemez. QR içeriğini yine istediğin zaman güncelleyebilirsin.',
    success: 'Etiket yazıldı ✓ Telefonu tekrar dokundurarak test et.',
    verify: 'Etiketi test et',
    verifyOk: 'Bu etiket doğru QR\'a bağlı ✓',
    verifyOther: 'Bu etiket başka bir adrese yönlendiriyor:',
    verifyEmpty: 'Etikette adres bulunamadı.',
    cancel: 'İptal',
    unsupportedTitle: 'Bu cihazdan doğrudan yazılamıyor',
    unsupportedDesc: 'NFC yazma Android telefonda Chrome ile çalışır. iPhone kullanıyorsan ücretsiz "NFC Tools" uygulamasıyla yazabilirsin:',
    steps: ['NFC Tools uygulamasını aç → "Yaz" sekmesi', '"Kayıt ekle" → "URL / URI"', 'Aşağıdaki adresi yapıştır', '"Yaz" de ve telefonu etikete dokundur'],
    copy: 'Adresi kopyala',
    copied: 'Kopyalandı ✓',
    stats: 'NFC ile açılma',
    encoded: 'Son yazma',
    locked: 'Kilitli',
    devNote: 'Not: Etikete her zaman canlı site adresi yazılır.',
  },
  en: {
    title: 'Write to an NFC tag',
    desc: 'Link your NFC necklace, keychain or sticker to this QR. Tapping a phone opens the content.',
    write: 'Write tag',
    waiting: 'Hold the back of your phone near the tag…',
    lock: 'Lock the tag after writing (permanent, cannot be undone)',
    lockHint: 'A locked tag cannot be rewritten by anyone. You can still change your QR content any time.',
    success: 'Tag written ✓ Tap it again to test.',
    verify: 'Test tag',
    verifyOk: 'This tag points to the right QR ✓',
    verifyOther: 'This tag points somewhere else:',
    verifyEmpty: 'No address found on the tag.',
    cancel: 'Cancel',
    unsupportedTitle: 'This device can\'t write directly',
    unsupportedDesc: 'NFC writing works on Android with Chrome. On iPhone, use the free "NFC Tools" app:',
    steps: ['Open NFC Tools → "Write" tab', '"Add a record" → "URL / URI"', 'Paste the address below', 'Tap "Write" and hold the phone to the tag'],
    copy: 'Copy address',
    copied: 'Copied ✓',
    stats: 'NFC opens',
    encoded: 'Last written',
    locked: 'Locked',
    devNote: 'Note: the live site address is always written to the tag.',
  },
}

export default function NfcWriter({
  slug,
  token,
  lang,
  scanCount,
  encodedAt,
  locked,
  onWritten,
}: {
  slug: string
  token: string
  lang: Lang
  scanCount: number
  encodedAt: string | null
  locked: boolean
  onWritten?: () => void
}) {
  const t = T[lang]
  const url = nfcUrlFor(SITE_URL, slug)
  const [supported, setSupported] = useState(false)
  const [busy, setBusy] = useState<'write' | 'verify' | null>(null)
  const [lock, setLock] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setSupported(isWebNfcSupported()))
    return () => {
      window.cancelAnimationFrame(raf)
      abortRef.current?.abort()
    }
  }, [])

  const write = async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy('write')
    setMessage({ tone: 'info', text: t.waiting })
    try {
      await writeUrlToTag(url, { lock, signal: controller.signal })
      await fetch(`/api/qr/${slug}/nfc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, locked: lock }),
      }).catch(() => undefined)
      setMessage({ tone: 'success', text: t.success })
      onWritten?.()
    } catch (error) {
      setMessage({ tone: 'error', text: describeNfcError(error, lang) })
    } finally {
      setBusy(null)
    }
  }

  const verify = async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy('verify')
    setMessage({ tone: 'info', text: t.waiting })
    try {
      const result = await readNextTag(controller.signal)
      controller.abort()
      if (!result.url) setMessage({ tone: 'error', text: t.verifyEmpty })
      else if (result.url.replace(/\/$/, '').endsWith(`/n/${slug}`) || result.url.includes(`/q/${slug}`)) setMessage({ tone: 'success', text: t.verifyOk })
      else setMessage({ tone: 'error', text: `${t.verifyOther} ${result.url}` })
    } catch (error) {
      setMessage({ tone: 'error', text: describeNfcError(error, lang) })
    } finally {
      setBusy(null)
    }
  }

  const cancel = () => {
    abortRef.current?.abort()
    setBusy(null)
    setMessage(null)
  }

  return (
    <section className="w-card space-y-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">📶 {t.title}</h2>
          <p className="mt-1 text-sm text-ink-2">{t.desc}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold text-ink">{scanCount}</p>
          <p className="text-[11px] text-muted">{t.stats}</p>
        </div>
      </div>

      {(encodedAt || locked) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {encodedAt && <span className="w-chip w-chip-sage">{t.encoded}: {new Date(encodedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}</span>}
          {locked && <span className="w-chip w-chip-ink">🔒 {t.locked}</span>}
        </div>
      )}

      {supported ? (
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-cream-2/60 p-3">
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#e8505b]" />
            <span className="text-sm text-ink-2">
              {t.lock}
              <span className="mt-1 block text-xs text-muted">{t.lockHint}</span>
            </span>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="w-btn w-btn-primary" onClick={write} disabled={busy !== null}>
              {t.write}
            </button>
            <button type="button" className="w-btn w-btn-ghost" onClick={verify} disabled={busy !== null}>
              {t.verify}
            </button>
          </div>
          {busy && (
            <button type="button" className="w-link text-sm" onClick={cancel}>
              {t.cancel}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl bg-cream-2 p-4">
          <p className="text-sm font-semibold text-ink">{t.unsupportedTitle}</p>
          <p className="text-sm text-ink-2">{t.unsupportedDesc}</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
            {t.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl bg-cream-2 px-3 py-2 text-xs text-ink-2">{url}</code>
        <button
          type="button"
          className="w-btn w-btn-ghost w-btn-sm shrink-0"
          onClick={async () => {
            await navigator.clipboard.writeText(url).catch(() => undefined)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          }}
        >
          {copied ? t.copied : t.copy}
        </button>
      </div>

      {message && (
        <div className={`w-alert ${message.tone === 'success' ? 'w-alert-success' : message.tone === 'error' ? 'w-alert-error' : 'w-alert-info'}`}>
          {message.text}
        </div>
      )}
    </section>
  )
}
