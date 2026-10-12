'use client'

import { useState } from 'react'
import type { Lang } from '@/lib/i18n'
import { ScanShell } from '@/app/q/[slug]/ScanShared'

const T = {
  tr: {
    title: 'Sahip linkini geri al',
    desc: 'QR\'ı ilk hazırladığında sana verilen 8 karakterlik kurtarma kodunu gir. Sana yeni bir sahip linki oluşturacağız; eski link geçersiz olur.',
    label: 'Kurtarma kodu',
    submit: 'Yeni sahip linki oluştur',
    checking: 'Kontrol ediliyor…',
    ready: 'Yeni sahip linkin hazır',
    copy: 'Kopyala',
    copied: 'Kopyalandı ✓',
    open: 'Yönetim paneline git →',
    error: 'Bir hata oluştu',
    help: 'Kodunu da kaybettiysen WhatsApp\'tan bize QR kodunun fotoğrafıyla yaz.',
  },
  en: {
    title: 'Recover your owner link',
    desc: 'Enter the 8-character recovery code you received when you set up the QR. We\'ll create a new owner link; the old one stops working.',
    label: 'Recovery code',
    submit: 'Create new owner link',
    checking: 'Checking…',
    ready: 'Your new owner link is ready',
    copy: 'Copy',
    copied: 'Copied ✓',
    open: 'Go to owner panel →',
    error: 'Something went wrong',
    help: 'Lost the code too? Message us on WhatsApp with a photo of your QR code.',
  },
}

export default function RecoverClient({ slug, lang }: { slug: string; lang: Lang }) {
  const t = T[lang]
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manageUrl, setManageUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const submit = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/qr/${slug}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryCode: code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      localStorage.setItem(`qrnote_token_${slug}`, data.ownerToken)
      setManageUrl(lang === 'en' ? `${data.manageUrl}&lang=en` : data.manageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScanShell lang={lang}>
      <div className="w-card space-y-5 p-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">🛟 {t.title}</h1>
          <p className="mt-2 text-sm text-ink-2">{t.desc}</p>
        </div>
        {!manageUrl ? (
          <>
            <div>
              <label className="w-label" htmlFor="rc">{t.label}</label>
              <input
                id="rc"
                className="w-input font-mono text-lg uppercase tracking-[0.3em]"
                value={code}
                maxLength={12}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="A1B2C3D4"
                autoComplete="off"
              />
            </div>
            {error && <div className="w-alert w-alert-error">{error}</div>}
            <button type="button" onClick={submit} disabled={loading || !code.trim()} className="w-btn w-btn-primary w-btn-block">
              {loading ? t.checking : t.submit}
            </button>
            <p className="text-xs text-muted">{t.help}</p>
          </>
        ) : (
          <div className="space-y-3">
            <div className="w-alert w-alert-success font-semibold">{t.ready}</div>
            <p className="break-all rounded-xl bg-cream-2 px-3 py-2 text-xs text-ink-2">{manageUrl}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="w-btn w-btn-ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(manageUrl).catch(() => undefined)
                  setCopied(true)
                }}
              >
                {copied ? t.copied : t.copy}
              </button>
              <a href={manageUrl} className="w-btn w-btn-dark">
                {t.open}
              </a>
            </div>
          </div>
        )}
      </div>
    </ScanShell>
  )
}
