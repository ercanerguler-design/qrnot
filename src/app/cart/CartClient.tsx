'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CardLogos } from '@/components/warm/PaymentBadges'
import ProductArt from '@/components/warm/ProductArt'
import { readCart, subscribeCart, writeCart } from '@/lib/commerce/cartClient'
import { currencyForLang, formatMoney, getProduct, priceCart, type CartLine } from '@/lib/commerce/catalog'
import type { PaymentProvider } from '@/lib/commerce/orders'
import { withLang, type Lang } from '@/lib/i18n'

const T = {
  tr: {
    title: 'Sepetin',
    empty: 'Sepetin boş.',
    shop: 'Ürünlere göz at',
    remove: 'Kaldır',
    subtotal: 'Ara toplam',
    shipping: 'Kargo',
    free: 'Ücretsiz',
    shippingCod: 'Alıcı ödemeli',
    shippingCodNote: 'Kargo ücreti teslimatta kargo firmasına ödenir.',
    total: 'Toplam',
    contact: 'İletişim bilgileri',
    fullName: 'Ad soyad',
    email: 'E-posta',
    phone: 'Cep telefonu',
    address: 'Teslimat adresi',
    addressLine: 'Mahalle, sokak, bina ve daire no',
    district: 'İlçe',
    city: 'İl',
    postal: 'Posta kodu',
    country: 'Ülke',
    note: 'Sipariş notu (isteğe bağlı)',
    notePh: 'Örn: Hediye paketi üzerine "İyi ki doğdun" yazılsın',
    payment: 'Ödeme yöntemi',
    paytr: 'Kredi / banka kartı',
    paytrHint: 'PayTR güvencesiyle · taksit seçenekleri',
    transfer: 'Havale / EFT',
    transferHint: 'Sipariş sonrası IBAN bilgileri gösterilir; ödeme onaylanınca hazırlanır.',
    mock: 'Test ödemesi (yerel)',
    mockHint: 'Gerçek para çekilmez — sadece geliştirme ortamında görünür.',
    noProvider: "Şu an online ödeme yöntemi aktif değil. WhatsApp'tan sipariş verebilirsin.",
    consentPre: 'Ön Bilgilendirme Formu',
    consentDistance: 'Mesafeli Satış Sözleşmesi',
    consentRead: "'nu okudum ve onaylıyorum.",
    consentAnd: 've',
    consentTerms: 'Kullanım koşulları ve KVKK aydınlatma metnini okudum.',
    consentMarketing: 'Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum (isteğe bağlı).',
    pay: 'Ödemeye geç',
    placeOrder: 'Siparişi tamamla',
    processing: 'Yönlendiriliyor…',
    loginNeeded: 'Satın aldığın ürünler hesabına tanımlanır. Devam etmek için giriş yap ya da hesap aç.',
    login: 'Giriş yap / hesap aç',
    paymentError: 'Ödeme tamamlanamadı. Lütfen tekrar dene.',
    secure: '🔒 Ödeme bilgilerin QRNot sunucularında saklanmaz.',
    variant: 'Renk',
  },
  en: {
    title: 'Your cart',
    empty: 'Your cart is empty.',
    shop: 'Browse products',
    remove: 'Remove',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    free: 'Free',
    shippingCod: 'Paid on delivery',
    shippingCodNote: 'Shipping is paid to the carrier on delivery.',
    total: 'Total',
    contact: 'Contact details',
    fullName: 'Full name',
    email: 'Email',
    phone: 'Phone (optional)',
    address: 'Shipping address',
    addressLine: 'Street address, apartment',
    district: 'State / region',
    city: 'City',
    postal: 'Postal code',
    country: 'Country',
    note: 'Order note (optional)',
    notePh: 'e.g. Please add a "Happy birthday" note',
    payment: 'Payment',
    paytr: 'Credit / debit card',
    paytrHint: 'Secure checkout by PayTR',
    transfer: 'Bank transfer',
    transferHint: '',
    mock: 'Test payment (local)',
    mockHint: 'No real charge — only visible in development.',
    noProvider: 'Online payment is not available right now. Please contact us on WhatsApp.',
    consentPre: '',
    consentDistance: '',
    consentRead: '',
    consentAnd: '',
    consentTerms: 'I agree to the Terms of Use, Refund Policy and Privacy Policy.',
    consentMarketing: 'Send me news and offers by email (optional).',
    pay: 'Continue to payment',
    placeOrder: 'Place order',
    processing: 'Redirecting…',
    loginNeeded: 'Your purchases are linked to your account. Please sign in or create an account to continue.',
    login: 'Sign in / create an account',
    paymentError: 'Payment could not be completed. Please try again.',
    secure: '🔒 Your card details never touch QRNot servers.',
    variant: 'Finish',
  },
}

let cachedRaw = ''
let cachedLines: CartLine[] = []
function snapshot() {
  const lines = readCart()
  const raw = JSON.stringify(lines)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedLines = lines
  }
  return cachedLines
}

export default function CartClient({
  lang,
  providers,
  hasSession,
  paymentError,
}: {
  lang: Lang
  providers: PaymentProvider[]
  hasSession: boolean
  paymentError: boolean
}) {
  const t = T[lang]
  const en = lang === 'en'
  const currency = currencyForLang(lang)
  const [lines, setLines] = useState<CartLine[]>([])
  const [mounted, setMounted] = useState(false)
  const [provider, setProvider] = useState<PaymentProvider | null>(providers[0] || null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [note, setNote] = useState('')
  const [consentPre, setConsentPre] = useState(false)
  const [consentDistance, setConsentDistance] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentMarketing, setConsentMarketing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(paymentError ? t.paymentError : null)
  const [needLogin, setNeedLogin] = useState(false)

  useEffect(() => {
    const sync = () => setLines(snapshot())
    const raf = window.requestAnimationFrame(() => {
      sync()
      setMounted(true)
    })
    const unsubscribe = subscribeCart(sync)
    return () => {
      window.cancelAnimationFrame(raf)
      unsubscribe()
    }
  }, [])

  const cart = useMemo(() => priceCart(lines, currency, lang), [lines, currency, lang])

  const updateQty = (index: number, quantity: number) => {
    const next = [...lines]
    const product = getProduct(next[index].productId)
    next[index] = { ...next[index], quantity: Math.min(Math.max(1, quantity), product?.maxQuantity || 10) }
    writeCart(next)
  }

  const removeLine = (index: number) => writeCart(lines.filter((_, i) => i !== index))

  const loginHref = withLang(`/account?next=${encodeURIComponent(withLang('/cart', lang))}`, lang)
  const showAddress = cart.hasPhysical

  const submit = async () => {
    if (!provider) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          provider,
          lines: cart.lines.map((line) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantity })),
          customer: { fullName, email, phone },
          address: { line: addressLine, district, city, postalCode, country: en ? country : 'Türkiye' },
          note,
          consents: { preInfo: consentPre, distanceSales: consentDistance, terms: consentTerms, marketing: consentMarketing },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.needLogin) setNeedLogin(true)
        throw new Error(data.error || t.paymentError)
      }
      window.location.href = data.redirectUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : t.paymentError)
      setSubmitting(false)
    }
  }

  if (!mounted) return <div className="mx-auto max-w-6xl px-4 py-24" />

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mb-4 text-5xl">🛍️</div>
        <h1 className="font-display text-3xl font-semibold">{t.empty}</h1>
        <Link href={withLang('/shop', lang)} className="w-btn w-btn-primary mt-6">
          {t.shop}
        </Link>
      </div>
    )
  }

  const consentsOk = consentTerms && (en || (consentPre && consentDistance))
  const providerLabel = (p: PaymentProvider) =>
    ({ paytr: [t.paytr, t.paytrHint], transfer: [t.transfer, t.transferHint], mock: [t.mock, t.mockHint] })[p]

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold">{t.title}</h1>

        {needLogin || (cart.requiresAccount && !hasSession) ? (
          <div className="w-alert w-alert-warn space-y-3">
            <p>{t.loginNeeded}</p>
            <Link href={loginHref} className="w-btn w-btn-dark w-btn-sm">
              {t.login}
            </Link>
          </div>
        ) : null}

        <section className="w-card space-y-4 p-5">
          <h2 className="font-semibold">{t.contact}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-input sm:col-span-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t.fullName}
              autoComplete="name"
            />
            <input className="w-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} autoComplete="email" />
            <input className="w-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phone} autoComplete="tel" />
          </div>
        </section>

        {showAddress && (
          <section className="w-card space-y-4 p-5">
            <h2 className="font-semibold">{t.address}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <textarea
                className="w-input min-h-20 sm:col-span-3"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder={t.addressLine}
                autoComplete="street-address"
              />
              <input className="w-input" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder={t.district} />
              <input className="w-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.city} autoComplete="address-level1" />
              <input className="w-input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={t.postal} autoComplete="postal-code" />
              {en && (
                <input
                  className="w-input sm:col-span-3"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder={t.country}
                  autoComplete="country-name"
                />
              )}
            </div>
          </section>
        )}

        <section className="w-card space-y-3 p-5">
          <h2 className="font-semibold">{t.note}</h2>
          <textarea className="w-input min-h-16" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={t.notePh} />
        </section>

        <section className="w-card space-y-3 p-5">
          <h2 className="font-semibold">{t.payment}</h2>
          {providers.length === 0 && <p className="text-sm text-ink-2">{t.noProvider}</p>}
          {providers.map((p) => {
            const [label, hint] = providerLabel(p)
            return (
              <label
                key={p}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${provider === p ? 'border-coral bg-coral-soft/40' : 'border-line'}`}
              >
                <input type="radio" name="provider" checked={provider === p} onChange={() => setProvider(p)} className="mt-1 accent-[#e8505b]" />
                <span>
                  <span className="block font-semibold text-ink">{label}</span>
                  {hint && <span className="block text-xs text-muted">{hint}</span>}
                  {p === 'paytr' && (
                    <span className="mt-2 block">
                      <CardLogos />
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="w-card space-y-4 p-5">
          {cart.lines.map((line, index) => {
            const product = getProduct(line.productId)
            return (
              <div key={`${line.productId}-${line.variantId}`} className="flex gap-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                  {product && <ProductArt kind={product.kind} nfc={product.nfc} variant={line.variantId || undefined} className="h-full w-full" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{line.name}</p>
                  {line.variantLabel && (
                    <p className="text-xs text-muted">
                      {t.variant}: {line.variantLabel}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="inline-flex items-center rounded-lg border border-line-2">
                      <button type="button" className="px-2.5 py-1 text-ink-2" onClick={() => updateQty(index, line.quantity - 1)} aria-label="-">
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{line.quantity}</span>
                      <button type="button" className="px-2.5 py-1 text-ink-2" onClick={() => updateQty(index, line.quantity + 1)} aria-label="+">
                        +
                      </button>
                    </div>
                    <button type="button" onClick={() => removeLine(index)} className="text-xs text-muted hover:text-ink">
                      {t.remove}
                    </button>
                  </div>
                </div>
                <p className="font-semibold">{formatMoney(line.lineTotal, currency)}</p>
              </div>
            )
          })}
          <div className="w-divider" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-2">{t.subtotal}</dt>
              <dd>{formatMoney(cart.subtotal, currency)}</dd>
            </div>
            {cart.hasPhysical && (
              <div className="flex justify-between">
                <dt className="text-ink-2">{t.shipping}</dt>
                <dd>{cart.shipping > 0 ? formatMoney(cart.shipping, currency) : t.shippingCod}</dd>
              </div>
            )}
            {cart.hasPhysical && cart.shipping === 0 && <p className="text-xs text-muted">{t.shippingCodNote}</p>}
            <div className="flex justify-between text-lg font-bold">
              <dt>{t.total}</dt>
              <dd>{formatMoney(cart.total, currency)}</dd>
            </div>
          </dl>
        </section>

        <section className="w-card space-y-3 p-5 text-sm">
          {!en && (
            <>
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={consentPre} onChange={(e) => setConsentPre(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#e8505b]" />
                <span className="text-ink-2">
                  <Link href="/legal/on-bilgilendirme" target="_blank" className="w-link">
                    {t.consentPre}
                  </Link>
                  {t.consentRead}
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consentDistance}
                  onChange={(e) => setConsentDistance(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#e8505b]"
                />
                <span className="text-ink-2">
                  <Link href="/legal/mesafeli-satis" target="_blank" className="w-link">
                    {t.consentDistance}
                  </Link>
                  {t.consentRead}
                </span>
              </label>
            </>
          )}
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={consentTerms} onChange={(e) => setConsentTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#e8505b]" />
            <span className="text-ink-2">
              {t.consentTerms}{' '}
              <Link href={en ? '/legal/terms?lang=en' : '/legal/kullanim'} target="_blank" className="w-link">
                ↗
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#e8505b]"
            />
            <span className="text-ink-2">{t.consentMarketing}</span>
          </label>

          {error && <div className="w-alert w-alert-error">{error}</div>}

          <button
            type="button"
            onClick={submit}
            disabled={submitting || !provider || !consentsOk || (cart.requiresAccount && !hasSession)}
            className="w-btn w-btn-primary w-btn-block py-4 text-base"
          >
            {submitting ? t.processing : provider === 'transfer' ? t.placeOrder : `${t.pay} · ${formatMoney(cart.total, currency)}`}
          </button>
          <p className="text-xs text-muted">{t.secure}</p>
        </section>
      </aside>
    </div>
  )
}
