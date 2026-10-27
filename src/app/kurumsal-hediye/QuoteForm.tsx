'use client'

import { useMemo, useState } from 'react'
import ProductArt from '@/components/warm/ProductArt'
import { formatMoney, PRODUCTS } from '@/lib/commerce/catalog'
import { estimateQuote, QUOTE_MIN_QTY, QUOTE_PRODUCT_IDS, QUOTE_TIERS, type QuoteItems, type QuoteProductId } from '@/lib/corporateQuoteShared'
import { withLang, type Lang } from '@/lib/i18n'
import { whatsappHref } from '@/lib/site'

const T = {
  tr: {
    step1: '1. Ürün ve adet',
    step2: '2. İletişim bilgileri',
    perPiece: 'adet başı',
    qty: 'Adet',
    company: 'Firma adı',
    name: 'Adın soyadın',
    email: 'E-posta',
    phone: 'Telefon',
    neededBy: 'İstenen teslim tarihi (isteğe bağlı)',
    logoBox: 'Firma logolu hediye kutusu istiyoruz',
    message: 'Notun (isteğe bağlı)',
    messagePh: 'Örn. genel müdürümüzün sesli teşekkür mesajını tüm hediyelere eklemek istiyoruz.',
    consentA: 'Teklif hazırlanması için bilgilerimin işlenmesine ilişkin',
    consentLink: 'aydınlatma metnini',
    consentB: 'okudum.',
    summary: 'Tahmini tutar',
    pieces: 'adet',
    list: 'Liste fiyatı',
    discount: 'Adet indirimi',
    total: 'Toplam (KDV dahil)',
    deposit: 'Sipariş onayında %50 peşinat',
    min: `Kurumsal sipariş en az ${QUOTE_MIN_QTY} adettir. Daha az adet için mağazayı kullanabilirsin.`,
    nextTier: (more: number, pct: number) => `${more} adet daha eklersen indirim %${pct} olur.`,
    note: 'Kesin fiyat, kargo ve logolu kutu ücreti teklifte netleşir.',
    send: 'Teklif iste',
    sending: 'Gönderiliyor…',
    doneTitle: 'Talebin bize ulaştı 🎉',
    doneText: 'En geç 1 iş günü içinde sana yazılı teklif göndereceğiz. Acele ediyorsan WhatsApp’tan da yazabilirsin.',
    whatsapp: 'WhatsApp’tan yaz',
    waMsg: 'Merhaba QRNot, kurumsal hediye teklif formunu doldurdum.',
    error: 'Gönderilemedi. Lütfen tekrar dene ya da WhatsApp’tan yaz.',
  },
  en: {
    step1: '1. Products and quantity',
    step2: '2. Contact details',
    perPiece: 'per piece',
    qty: 'Qty',
    company: 'Company',
    name: 'Your name',
    email: 'Email',
    phone: 'Phone',
    neededBy: 'Needed by (optional)',
    logoBox: 'We would like gift boxes with our logo',
    message: 'Notes (optional)',
    messagePh: 'E.g. we would like to add our CEO’s thank-you voice message to every gift.',
    consentA: 'I have read the',
    consentLink: 'privacy notice',
    consentB: 'for preparing this quote.',
    summary: 'Estimated total',
    pieces: 'pcs',
    list: 'List price',
    discount: 'Volume discount',
    total: 'Total (incl. VAT)',
    deposit: '50% deposit on order confirmation',
    min: `Business orders start at ${QUOTE_MIN_QTY} pieces. For fewer, please use the shop.`,
    nextTier: (more: number, pct: number) => `Add ${more} more for a ${pct}% discount.`,
    note: 'Final price, shipping and logo box costs are confirmed in the quote.',
    send: 'Request a quote',
    sending: 'Sending…',
    doneTitle: 'We received your request 🎉',
    doneText: 'We will send you a written quote within 1 business day. In a hurry? Message us on WhatsApp.',
    whatsapp: 'Message on WhatsApp',
    waMsg: 'Hello QRNot, I filled in the business gift quote form.',
    error: 'Could not send. Please try again or message us on WhatsApp.',
  },
}

export default function QuoteForm({ lang }: { lang: Lang }) {
  const t = T[lang]
  const [items, setItems] = useState<QuoteItems>({ 'anahtarlik-qr': 50 })
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', neededBy: '', message: '' })
  const [logoBox, setLogoBox] = useState(false)
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const estimate = useMemo(() => estimateQuote(items), [items])
  const nextTier = QUOTE_TIERS.find((tier) => tier.min > estimate.totalQty)
  const money = (kurus: number) => formatMoney(kurus, 'TRY')
  const setQty = (id: QuoteProductId, value: string) => {
    const qty = Math.max(0, Math.min(100000, Math.floor(Number(value) || 0)))
    setItems((cur) => ({ ...cur, [id]: qty }))
  }
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((cur) => ({ ...cur, [key]: e.target.value })),
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/corporate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items, logoBox, consent, lang }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || t.error)
      setState('done')
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

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="w-card p-5 sm:p-6">
          <h3 className="font-display text-xl font-semibold">{t.step1}</h3>
          <div className="mt-4 divide-y divide-line">
            {QUOTE_PRODUCT_IDS.map((id) => {
              const product = PRODUCTS.find((p) => p.id === id)!
              return (
                <label key={id} className="flex items-center gap-4 py-3">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-2">
                    <ProductArt kind={product.kind} nfc={product.nfc} className="h-full w-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{product.name[lang]}</span>
                    <span className="block text-xs text-muted">
                      {money(product.price.TRY)} {t.perPiece}
                    </span>
                  </span>
                  {/* w-input genişliği %100 yapar; sabit genişlikli kap içinde tutulur */}
                  <span className="w-24 shrink-0">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100000}
                      aria-label={`${product.name[lang]} — ${t.qty}`}
                      className="w-input text-right"
                      value={items[id] || ''}
                      placeholder="0"
                      onChange={(e) => setQty(id, e.target.value)}
                    />
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="w-card p-5 sm:p-6">
          <h3 className="font-display text-xl font-semibold">{t.step2}</h3>
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
              <span className="w-label">{t.neededBy}</span>
              <input className="w-input" type="date" {...field('neededBy')} />
            </label>
            <label className="flex items-center gap-3 sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-coral" checked={logoBox} onChange={(e) => setLogoBox(e.target.checked)} />
              <span className="text-sm">{t.logoBox}</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="w-label">{t.message}</span>
              <textarea className="w-input min-h-24" maxLength={2000} placeholder={t.messagePh} {...field('message')} />
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
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="w-card-soft p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">{t.summary}</p>
          <p className="font-display mt-2 text-3xl font-semibold">{money(estimate.total)}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-2">
                {t.list} · {estimate.totalQty} {t.pieces}
              </dt>
              <dd>{money(estimate.listTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">
                {t.discount} (%{Math.round(estimate.rate * 100)})
              </dt>
              <dd className="text-sage">−{money(estimate.discount)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 font-semibold">
              <dt>{t.total}</dt>
              <dd>{money(estimate.total)}</dd>
            </div>
            <div className="flex justify-between text-ink-2">
              <dt>{t.deposit}</dt>
              <dd>{money(estimate.deposit)}</dd>
            </div>
          </dl>
          {estimate.totalQty < QUOTE_MIN_QTY ? (
            <p className="w-alert w-alert-warn mt-4 text-sm">{t.min}</p>
          ) : (
            nextTier && <p className="w-alert w-alert-info mt-4 text-sm">{t.nextTier(nextTier.min - estimate.totalQty, Math.round(nextTier.rate * 100))}</p>
          )}
          <p className="mt-4 text-xs text-muted">{t.note}</p>
          {error && <p className="w-alert w-alert-error mt-4 text-sm">{error}</p>}
          <button type="submit" className="w-btn w-btn-primary w-btn-block mt-4" disabled={state === 'sending' || estimate.totalQty < QUOTE_MIN_QTY}>
            {state === 'sending' ? t.sending : t.send}
          </button>
        </div>
      </aside>
    </form>
  )
}
