'use client'

import Link from 'next/link'
import { useState } from 'react'
import { pixelTrack } from '@/lib/metaPixel'
import { BUSINESS_TYPES } from '@/lib/dealersShared'
import { whatsappHref } from '@/lib/site'

const EMPTY = {
  company: '',
  contactName: '',
  email: '',
  phone: '',
  taxOffice: '',
  taxNo: '',
  city: '',
  district: '',
  address: '',
  businessType: '',
  website: '',
  expectedMonthly: '',
  message: '',
  website2: '',
}

export default function DealerApplyForm() {
  const [form, setForm] = useState(EMPTY)
  const [interests, setInterests] = useState<string[]>(['products'])
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const field = (key: keyof typeof form) => ({
    id: `dealer-${key}`,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((cur) => ({ ...cur, [key]: e.target.value })),
  })
  const toggle = (key: string) => setInterests((cur) => (cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key]))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/dealer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, interests, consent }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Gönderilemedi. Lütfen tekrar dene.')
      setState('done')
      pixelTrack('Lead', { content_category: 'dealer' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gönderilemedi. Lütfen tekrar dene.')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="w-card p-8 text-center">
        <p className="font-display text-2xl font-semibold">Başvurun bize ulaştı 🎉</p>
        <p className="mx-auto mt-3 max-w-lg text-ink-2">
          En geç 2 iş günü içinde inceleyip <b>{form.email}</b> adresine dönüş yapacağız. Onaylandığında bayi paneline bu e-postayla açılmış QRNot hesabınla girersin.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/account?next=/bayi" className="w-btn w-btn-primary">
            Şimdiden hesap aç
          </Link>
          <a href={whatsappHref(`Merhaba QRNot, ${form.company} adına bayilik başvurusu yaptım.`)} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-whatsapp">
            WhatsApp’tan yaz
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="w-card p-5 sm:p-6">
          <h3 className="font-display text-xl font-semibold">1. Firma bilgileri</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="w-label">Firma unvanı</span>
              <input className="w-input" required maxLength={200} autoComplete="organization" {...field('company')} />
            </label>
            <label className="block">
              <span className="w-label">Vergi dairesi</span>
              <input className="w-input" required maxLength={120} {...field('taxOffice')} />
            </label>
            <label className="block">
              <span className="w-label">Vergi no / TC kimlik no</span>
              <input className="w-input" required inputMode="numeric" maxLength={11} {...field('taxNo')} />
            </label>
            <label className="block">
              <span className="w-label">İşletme türü</span>
              <select className="w-input" required {...field('businessType')}>
                <option value="">Seç</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="w-label">Web sitesi / Instagram (isteğe bağlı)</span>
              <input className="w-input" maxLength={255} placeholder="www… ya da @…" {...field('website')} />
            </label>
            <label className="block">
              <span className="w-label">Şehir</span>
              <input className="w-input" required maxLength={80} autoComplete="address-level1" {...field('city')} />
            </label>
            <label className="block">
              <span className="w-label">İlçe</span>
              <input className="w-input" maxLength={80} autoComplete="address-level2" {...field('district')} />
            </label>
            <label className="block sm:col-span-2">
              <span className="w-label">Adres (teslimat ve fatura için)</span>
              <textarea className="w-input min-h-20" maxLength={600} autoComplete="street-address" {...field('address')} />
            </label>
          </div>
        </div>

        <div className="w-card p-5 sm:p-6">
          <h3 className="font-display text-xl font-semibold">2. Yetkili kişi</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="w-label">Ad soyad</span>
              <input className="w-input" required maxLength={120} autoComplete="name" {...field('contactName')} />
            </label>
            <label className="block">
              <span className="w-label">E-posta (bayi paneline bu adresle girersin)</span>
              <input className="w-input" type="email" required maxLength={255} autoComplete="email" {...field('email')} />
            </label>
            <label className="block">
              <span className="w-label">Telefon</span>
              <input className="w-input" type="tel" required maxLength={40} autoComplete="tel" {...field('phone')} />
            </label>
          </div>
        </div>

        <div className="w-card p-5 sm:p-6">
          <h3 className="font-display text-xl font-semibold">3. Bayilik tercihi</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['products', 'Ürün bayiliği', 'Kolye, anahtarlık, anı defteri, dijital QR · %30 indirim'],
              ['dpp', 'QRNot DPP bayiliği', 'İhracatçılara dijital ürün pasaportu · %35 indirim'],
            ].map(([key, title, desc]) => (
              <label key={key} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${interests.includes(key) ? 'border-coral bg-coral-soft' : 'border-line'}`}>
                <input id={`dealer-int-${key}`} type="checkbox" className="mt-1 h-4 w-4 accent-coral" checked={interests.includes(key)} onChange={() => toggle(key)} />
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-ink-2">{desc}</span>
                </span>
              </label>
            ))}
            <label className="block">
              <span className="w-label">Tahmini aylık ürün adedi (isteğe bağlı)</span>
              <input className="w-input" type="number" min={0} max={1000000} inputMode="numeric" {...field('expectedMonthly')} />
            </label>
            <label className="block sm:col-span-2">
              <span className="w-label">Notun (isteğe bağlı)</span>
              <textarea className="w-input min-h-20" maxLength={2000} placeholder="Örn. iki şubemiz var, yılbaşı için vitrin düşünüyoruz." {...field('message')} />
            </label>
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" {...field('website2')} />
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="w-card-soft p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">Özet</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            <li>✓ Ürünlerde %30, DPP’de %35 bayi indirimi</li>
            <li>✓ En az 30 adet ürün siparişi</li>
            <li>✓ Kredi kartı ya da havale / EFT</li>
            <li>✓ 2 iş gününde dönüş</li>
          </ul>
          <label className="mt-5 flex items-start gap-3">
            <input id="dealer-consent" type="checkbox" required className="mt-0.5 h-4 w-4 accent-coral" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span className="text-sm text-ink-2">
              <a href="#sartlar" className="w-link">
                Bayilik satış şartlarını
              </a>{' '}
              ve başvurum için bilgilerimin işlenmesine ilişkin{' '}
              <a href="/legal/kvkk" target="_blank" className="w-link">
                aydınlatma metnini
              </a>{' '}
              okudum, kabul ediyorum.
            </span>
          </label>
          {error && <p className="w-alert w-alert-error mt-4 text-sm">{error}</p>}
          <button type="submit" className="w-btn w-btn-primary w-btn-block mt-4" disabled={state === 'sending' || interests.length === 0}>
            {state === 'sending' ? 'Gönderiliyor…' : 'Başvuruyu gönder'}
          </button>
        </div>
      </aside>
    </form>
  )
}
