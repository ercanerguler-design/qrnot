'use client'

import { useState } from 'react'
import { withLang, type Lang } from '@/lib/i18n'
import { LEAD_TOPICS, type LeadField, type LeadTopic, type LeadTopicKey } from '@/lib/leadTopics'
import { whatsappHref } from '@/lib/site'
import { pixelTrack } from '@/lib/metaPixel'

const T = {
  tr: {
    details: '1. İhtiyacınız',
    contact: '2. İletişim bilgileri',
    choose: 'Seçin',
    company: 'Firma / kurum adı',
    name: 'Adın soyadın',
    email: 'E-posta',
    phone: 'Telefon',
    message: 'Eklemek istediğin bir not (isteğe bağlı)',
    consentA: 'Teklif hazırlanması için bilgilerimin işlenmesine ilişkin',
    consentLink: 'aydınlatma metnini',
    consentB: 'okudum.',
    send: 'Teklif iste',
    sending: 'Gönderiliyor…',
    doneTitle: 'Talebin bize ulaştı 🎉',
    doneText: 'En geç 1 iş günü içinde sana dönüş yapacağız. Acele ediyorsan WhatsApp’tan da yazabilirsin.',
    whatsapp: 'WhatsApp’tan yaz',
    waMsg: 'Merhaba QRNot, sitenizdeki teklif formunu doldurdum.',
    error: 'Gönderilemedi. Lütfen tekrar dene ya da WhatsApp’tan yaz.',
  },
  en: {
    details: '1. What you need',
    contact: '2. Contact details',
    choose: 'Choose',
    company: 'Company / organisation',
    name: 'Your name',
    email: 'Email',
    phone: 'Phone',
    message: 'Anything else? (optional)',
    consentA: 'I have read the',
    consentLink: 'privacy notice',
    consentB: 'for preparing this quote.',
    send: 'Request a quote',
    sending: 'Sending…',
    doneTitle: 'We received your request 🎉',
    doneText: 'We will get back to you within 1 business day. In a hurry? Message us on WhatsApp.',
    whatsapp: 'Message on WhatsApp',
    waMsg: 'Hello QRNot, I filled in the quote form on your website.',
    error: 'Could not send. Please try again or message us on WhatsApp.',
  },
}

export default function LeadForm({ lang, topic, preset }: { lang: Lang; topic: LeadTopicKey; preset: Record<string, string> }) {
  const t = T[lang]
  const config = LEAD_TOPICS[topic] as LeadTopic
  const [details, setDetails] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.fields.filter((f) => preset[f.key]).map((f) => [f.key, preset[f.key]]))
  )
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', message: '' })
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((cur) => ({ ...cur, [key]: e.target.value })),
  })
  const setDetail = (key: string, value: string) => setDetails((cur) => ({ ...cur, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, topic, details, consent, lang }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || t.error)
      setState('done')
      pixelTrack('Lead', { content_category: topic })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.error)
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="w-card p-8 text-center">
        <p className="font-display text-2xl font-semibold">{t.doneTitle}</p>
        <p className="mx-auto mt-3 max-w-md text-ink-2">{t.doneText}</p>
        <a href={whatsappHref(t.waMsg)} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-whatsapp mt-6">
          {t.whatsapp}
        </a>
      </div>
    )
  }

  const renderField = (f: LeadField) => {
    const id = `lead-${f.key}`
    if (f.type === 'select') {
      return (
        <select id={id} className="w-input" value={details[f.key] || ''} onChange={(e) => setDetail(f.key, e.target.value)}>
          <option value="">{t.choose}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label[lang]}
            </option>
          ))}
        </select>
      )
    }
    return (
      <input
        id={id}
        className="w-input"
        type={f.type === 'number' ? 'number' : 'text'}
        inputMode={f.type === 'number' ? 'numeric' : undefined}
        min={f.type === 'number' ? 1 : undefined}
        max={f.type === 'number' ? f.max : undefined}
        maxLength={f.type === 'text' ? f.max : undefined}
        value={details[f.key] || ''}
        onChange={(e) => setDetail(f.key, e.target.value)}
      />
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="w-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">{t.details}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {config.fields.map((f) => (
            <label key={f.key} htmlFor={`lead-${f.key}`} className={`block ${f.type === 'text' ? 'sm:col-span-2' : ''}`}>
              <span className="w-label">{f.label[lang]}</span>
              {renderField(f)}
            </label>
          ))}
        </div>
      </div>

      <div className="w-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">{t.contact}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="w-label">{t.company}</span>
            <input className="w-input" required maxLength={200} autoComplete="organization" {...field('company')} />
          </label>
          <label className="block">
            <span className="w-label">{t.name}</span>
            <input className="w-input" required maxLength={120} autoComplete="name" {...field('name')} />
          </label>
          <label className="block">
            <span className="w-label">{t.email}</span>
            <input className="w-input" type="email" required maxLength={255} autoComplete="email" {...field('email')} />
          </label>
          <label className="block">
            <span className="w-label">{t.phone}</span>
            <input className="w-input" type="tel" required maxLength={40} autoComplete="tel" {...field('phone')} />
          </label>
          <label className="block sm:col-span-2">
            <span className="w-label">{t.message}</span>
            <textarea className="w-input min-h-24" maxLength={2000} {...field('message')} />
          </label>
          <label className="flex items-start gap-3 sm:col-span-2">
            <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-coral" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span className="text-sm text-ink-2">
              {t.consentA}{' '}
              <a href={withLang(lang === 'en' ? '/legal/privacy' : '/legal/kvkk', lang)} target="_blank" className="w-link">
                {t.consentLink}
              </a>{' '}
              {t.consentB}
            </span>
          </label>
        </div>
      </div>

      {error && <p className="w-alert w-alert-error text-sm">{error}</p>}
      <button type="submit" className="w-btn w-btn-primary px-8 py-3.5" disabled={state === 'sending'}>
        {state === 'sending' ? t.sending : t.send}
      </button>
    </form>
  )
}
