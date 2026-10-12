'use client'

import { useState } from 'react'
import Link from 'next/link'
import QrCard from '@/components/warm/QrCard'
import { withLang, type Lang } from '@/lib/i18n'

const T = {
  en: {
    chip: 'For Etsy buyers',
    title: 'Activate your personal QR code',
    desc: 'Thank you for your Etsy purchase! Enter your Etsy order number and email to get your own unique QR code. It takes less than a minute.',
    where: 'Where is my order number? Etsy → You → Purchases and reviews → the number on your receipt (e.g. 3123456789).',
    order: 'Etsy order number',
    email: 'Email address',
    product: 'What did you buy?',
    standard: 'Voice / video message QR',
    standardHint: 'Gift tags, cards, stickers, keepsakes',
    guestbook: 'Audio & video guestbook',
    guestbookHint: 'Weddings, parties, events',
    submit: 'Activate my QR',
    working: 'Activating…',
    doneTitle: 'Your QR code is ready! 🎉',
    doneDesc: 'Download it now and keep this page open — next, add your voice message or set up your guestbook.',
    step1: '1. Download your QR',
    step2: '2. Add your content',
    setupStandard: 'Record my voice message →',
    setupGuestbook: 'Set up my guestbook →',
    step3: '3. Print',
    printStandard: 'Open printable templates',
    printGuestbook: 'Table cards are available after setup in your guestbook panel.',
    another: 'Activate another QR for this order',
    tips: 'Tip: test the QR with your phone camera before printing. Print at least 2 × 2 cm (0.8 in).',
  },
  tr: {
    chip: 'Etsy alıcıları için',
    title: 'Kişisel QR kodunu aktive et',
    desc: 'Etsy siparişin için teşekkürler! Etsy sipariş numaranı ve e-postanı gir, sana özel QR kodun hemen oluşsun.',
    where: 'Sipariş numarası nerede? Etsy → Sen → Satın alımlar → makbuzdaki numara (örn. 3123456789).',
    order: 'Etsy sipariş numarası',
    email: 'E-posta adresi',
    product: 'Ne satın aldın?',
    standard: 'Sesli / videolu mesaj QR',
    standardHint: 'Hediye etiketi, kart, sticker, hatıra',
    guestbook: 'Dijital anı defteri',
    guestbookHint: 'Düğün, parti, etkinlik',
    submit: "QR'ımı aktive et",
    working: 'Aktive ediliyor…',
    doneTitle: 'QR kodun hazır! 🎉',
    doneDesc: 'Hemen indir ve bu sayfayı kapatma — sıradaki adım sesli mesajını eklemek ya da anı defterini kurmak.',
    step1: "1. QR'ını indir",
    step2: '2. İçeriğini ekle',
    setupStandard: 'Sesli mesajımı kaydet →',
    setupGuestbook: 'Anı defterimi kur →',
    step3: '3. Yazdır',
    printStandard: 'Yazdırılabilir şablonları aç',
    printGuestbook: 'Masa kartları, kurulumdan sonra anı defteri panelinde.',
    another: 'Bu sipariş için bir QR daha aktive et',
    tips: "İpucu: Yazdırmadan önce QR'ı telefonunla test et. En az 2 × 2 cm boyutunda bas.",
  },
}

export default function EtsyActivate({ lang }: { lang: Lang }) {
  const t = T[lang]
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [product, setProduct] = useState<'standard' | 'guestbook'>('standard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ slug: string; qrUrl: string; product: 'standard' | 'guestbook' } | null>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/etsy/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email, product }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error')
      setResult(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-14">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t.doneTitle}</h1>
          <p className="mt-2 text-ink-2">{t.doneDesc}</p>
        </div>
        <section className="w-card grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <QrCard url={result.qrUrl} slug={result.slug} lang={lang} size={180} />
          <div className="space-y-5">
            <div>
              <p className="font-semibold">{t.step1}</p>
              <p className="mt-1 break-all font-mono text-xs text-muted">{result.qrUrl}</p>
            </div>
            <div>
              <p className="font-semibold">{t.step2}</p>
              <Link href={withLang(`/q/${result.slug}`, lang)} target="_blank" className="w-btn w-btn-primary mt-2 w-full">
                {result.product === 'guestbook' ? t.setupGuestbook : t.setupStandard}
              </Link>
            </div>
            <div>
              <p className="font-semibold">{t.step3}</p>
              {result.product === 'guestbook' ? (
                <p className="mt-1 text-sm text-ink-2">{t.printGuestbook}</p>
              ) : (
                <Link href={withLang(`/print/${result.slug}`, lang)} target="_blank" className="w-btn w-btn-ghost mt-2 w-full">
                  🖨️ {t.printStandard}
                </Link>
              )}
            </div>
          </div>
        </section>
        <p className="text-center text-sm text-muted">{t.tips}</p>
        <div className="text-center">
          <button type="button" className="w-link text-sm" onClick={() => setResult(null)}>
            {t.another}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <div className="text-center">
        <span className="w-chip w-chip-gold">🧡 {t.chip}</span>
        <h1 className="font-display mt-4 text-4xl font-semibold">{t.title}</h1>
        <p className="mt-3 text-ink-2">{t.desc}</p>
      </div>
      <div className="w-card mt-8 space-y-5 p-6">
        <div>
          <label className="w-label" htmlFor="etsy-order">
            {t.order}
          </label>
          <input
            id="etsy-order"
            className="w-input font-mono tracking-wider"
            inputMode="numeric"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="3123456789"
          />
          <p className="mt-1.5 text-xs text-muted">{t.where}</p>
        </div>
        <div>
          <label className="w-label" htmlFor="etsy-email">
            {t.email}
          </label>
          <input id="etsy-email" className="w-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <p className="w-label">{t.product}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['standard', t.standard, t.standardHint, '🎙️'],
                ['guestbook', t.guestbook, t.guestbookHint, '📖'],
              ] as const
            ).map(([key, label, hint, icon]) => (
              <label
                key={key}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${product === key ? 'border-coral bg-coral-soft/40' : 'border-line'}`}
              >
                <input type="radio" name="product" checked={product === key} onChange={() => setProduct(key)} className="mt-1 accent-[#e8505b]" />
                <span>
                  <span className="block font-semibold">
                    {icon} {label}
                  </span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        {error && <div className="w-alert w-alert-error">{error}</div>}
        <button type="button" className="w-btn w-btn-primary w-btn-block py-4 text-base" onClick={submit} disabled={loading || !orderNumber || !email}>
          {loading ? t.working : t.submit}
        </button>
      </div>
    </div>
  )
}
