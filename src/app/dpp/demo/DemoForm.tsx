'use client'

import { useState } from 'react'
import { pixelTrack } from '@/lib/metaPixel'
import type { Lang } from '@/lib/i18n'

// Demo talep formu: başarılı olunca giriş bilgileri bir kez gösterilir (e-postayla gönderilmez).

const T = {
  tr: {
    company: 'Firma adı *',
    name: 'Adınız soyadınız *',
    email: 'İş e-postanız *',
    phone: 'Telefon (WhatsApp)',
    country: 'Ülke',
    sector: 'Sektör',
    products: 'Yaklaşık ürün modeli sayısı',
    message: 'Not (isteğe bağlı)',
    consent: 'Bilgilerimin demo hesabı açmak ve benimle iletişime geçmek için işlenmesini kabul ediyorum.',
    consentLink: 'KVKK aydınlatma metni',
    submit: 'Demo hesabımı aç',
    sending: 'Hesap açılıyor…',
    doneTitle: 'Demo hesabınız hazır 🎉',
    doneLead: 'Aşağıdaki bilgilerle giriş yapın. İlk girişte kendi şifrenizi belirleyeceksiniz.',
    warn: 'Bu geçici şifre bir daha gösterilmeyecek; şimdi kopyalayın.',
    email2: 'E-posta',
    password: 'Geçici şifre',
    until: 'Demo bitiş',
    copy: 'Bilgileri kopyala',
    copied: 'Kopyalandı',
    open: 'Panele giriş yap →',
    error: 'Bir şey ters gitti, tekrar deneyin.',
    sectors: { textile: 'Tekstil / hazır giyim', home_textile: 'Ev tekstili', furniture: 'Mobilya', footwear: 'Ayakkabı / deri', battery: 'Pil / batarya', electronics: 'Elektronik', toys: 'Oyuncak', construction: 'Yapı malzemesi', other: 'Diğer' },
  },
  en: {
    company: 'Company name *',
    name: 'Your full name *',
    email: 'Work email *',
    phone: 'Phone (WhatsApp)',
    country: 'Country',
    sector: 'Sector',
    products: 'Approximate number of product models',
    message: 'Note (optional)',
    consent: 'I agree that my details are processed to open a demo account and to contact me.',
    consentLink: 'Privacy notice',
    submit: 'Open my demo account',
    sending: 'Opening account…',
    doneTitle: 'Your demo account is ready 🎉',
    doneLead: 'Sign in with the details below. You will set your own password at first login.',
    warn: 'This temporary password will not be shown again; copy it now.',
    email2: 'Email',
    password: 'Temporary password',
    until: 'Demo ends',
    copy: 'Copy details',
    copied: 'Copied',
    open: 'Sign in to the panel →',
    error: 'Something went wrong, please try again.',
    sectors: { textile: 'Textiles / apparel', home_textile: 'Home textiles', furniture: 'Furniture', footwear: 'Footwear / leather', battery: 'Batteries', electronics: 'Electronics', toys: 'Toys', construction: 'Construction products', other: 'Other' },
  },
} as const

const COUNTRIES = ['TR', 'DE', 'NL', 'FR', 'IT', 'ES', 'BE', 'AT', 'PL', 'GB', 'US', 'AE', 'SA', 'EG', 'MA', 'PT', 'GR', 'BG', 'RO', 'SE', 'DK']

export default function DemoForm({ lang }: { lang: Lang }) {
  const t = T[lang]
  const region = new Intl.DisplayNames([lang], { type: 'region' })
  const [f, setF] = useState({ company: '', name: '', email: '', phone: '', country: 'TR', sector: 'textile', products: '1-10', message: '', website: '' })
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ email: string; password: string; expiresAt: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  if (done) {
    const text = `QRNot DPP demo\n${window.location.origin}/dpp/panel\n${t.email2}: ${done.email}\n${t.password}: ${done.password}`
    return (
      <div className="w-card self-start p-7">
        <h2 className="font-display text-3xl font-semibold">{t.doneTitle}</h2>
        <p className="mt-2 text-ink-2">{t.doneLead}</p>
        <div className="w-alert w-alert-warn mt-4 text-sm">{t.warn}</div>
        <dl className="mt-5 grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
          <dt className="font-semibold">{t.email2}</dt>
          <dd className="font-mono" dir="ltr">{done.email}</dd>
          <dt className="font-semibold">{t.password}</dt>
          <dd className="font-mono text-lg font-bold" dir="ltr">{done.password}</dd>
          <dt className="font-semibold">{t.until}</dt>
          <dd>{new Date(done.expiresAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB')}</dd>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="w-btn w-btn-ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(text).then(() => setCopied(true))
            }}
          >
            {copied ? t.copied : t.copy}
          </button>
          <a href="/dpp/panel" className="w-btn w-btn-primary">
            {t.open}
          </a>
        </div>
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/dpp/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-dpp-lang': lang },
        body: JSON.stringify({ ...f, consent }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      setDone(data)
      pixelTrack('Lead', { content_category: 'dpp_demo' })
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="w-card grid gap-4 self-start p-7 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="w-label">{t.company}</span>
        <input className="w-input" required maxLength={200} value={f.company} onChange={set('company')} autoComplete="organization" />
      </label>
      <label>
        <span className="w-label">{t.name}</span>
        <input className="w-input" required maxLength={120} value={f.name} onChange={set('name')} autoComplete="name" />
      </label>
      <label>
        <span className="w-label">{t.email}</span>
        <input className="w-input" required type="email" maxLength={254} value={f.email} onChange={set('email')} autoComplete="email" dir="ltr" />
      </label>
      <label>
        <span className="w-label">{t.phone}</span>
        <input className="w-input" type="tel" maxLength={40} value={f.phone} onChange={set('phone')} autoComplete="tel" dir="ltr" />
      </label>
      <label>
        <span className="w-label">{t.country}</span>
        <select className="w-input" value={f.country} onChange={set('country')}>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {region.of(c)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="w-label">{t.sector}</span>
        <select className="w-input" value={f.sector} onChange={set('sector')}>
          {Object.entries(t.sectors).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="w-label">{t.products}</span>
        <select className="w-input" value={f.products} onChange={set('products')}>
          {['1-10', '11-50', '51-200', '201-500', '500+'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="w-label">{t.message}</span>
        <textarea className="w-input" rows={3} maxLength={1000} value={f.message} onChange={set('message')} />
      </label>
      {/* Bot tuzağı: insanlar görmez */}
      <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} name="website" />
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        <span>
          {t.consent}{' '}
          <a className="w-link" href={lang === 'tr' ? '/legal/kvkk' : '/legal/privacy'} target="_blank" rel="noopener noreferrer">
            {t.consentLink}
          </a>
        </span>
      </label>
      {error && <div className="w-alert w-alert-error text-sm sm:col-span-2">{error}</div>}
      <button type="submit" className="w-btn w-btn-primary sm:col-span-2" disabled={busy || !consent}>
        {busy ? t.sending : t.submit}
      </button>
    </form>
  )
}
