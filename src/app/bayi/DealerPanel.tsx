'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ProductArt from '@/components/warm/ProductArt'
import { formatMoney } from '@/lib/commerce/catalog'
import { DEALER_MIN_QTY, DEALER_STATUS_LABEL, DPP_REQUEST_STATUS_LABEL, dealerProducts, priceDealerCart, type DealerStatus, type DppRequestStatus } from '@/lib/dealersShared'
import { whatsappHref } from '@/lib/site'

interface DealerInfo {
  status: DealerStatus
  company: string
  contactName: string
  email: string
  phone: string
  city: string
  district: string
  address: string
  discountPct: number
  dppDiscountPct: number
}
interface OrderRow {
  order_no: string
  access_key: string
  status: string
  provider: string
  total: number
  items: Array<{ quantity: number; name: string; variantLabel: string | null }>
  created_at: string
  paid_at: string | null
  tracking_no: string
}
interface DppPlan {
  id: string
  name: string
  scope: string
  eur: number
  per: 'once' | 'month' | 'from'
  dealerEur: number
}
interface DppRow {
  id: string
  customer_company: string
  plan: string
  dealer_eur: string
  payment_method: string
  status: DppRequestStatus
  paid: boolean
  created_at: string
}
interface State {
  needLogin?: boolean
  email?: string
  dealer?: DealerInfo | null
  providers?: string[]
  dppPlans?: DppPlan[]
  orders?: OrderRow[]
  dppRequests?: DppRow[]
}

const ORDER_STATUS: Record<string, [string, string]> = {
  pending: ['Ödeme bekleniyor', 'w-chip-gold'],
  awaiting_transfer: ['Havale bekleniyor', 'w-chip-gold'],
  paid: ['Ödendi · hazırlanıyor', 'w-chip-sage'],
  fulfilled: ['Teslim edildi', 'w-chip-sage'],
  shipped: ['Kargoda', 'w-chip-sage'],
  delivered: ['Teslim edildi', 'w-chip-sage'],
  failed: ['Ödeme başarısız', 'w-chip'],
  cancelled: ['İptal', 'w-chip'],
  refunded: ['İade edildi', 'w-chip'],
}
const PAID = ['paid', 'fulfilled', 'shipped', 'delivered']
const eur = (n: number | string) => `€${Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const date = (s: string) => new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })

export default function DealerPanel() {
  const params = useSearchParams()
  const [data, setData] = useState<State | null>(null)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dealer', { cache: 'no-store' })
      const json = (await res.json().catch(() => ({}))) as State
      setData(res.status === 401 ? { needLogin: true } : json)
    } catch {
      setLoadError(true)
    }
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (loadError) return <Shell><p className="w-alert w-alert-error">Panel yüklenemedi. Sayfayı yenile.</p></Shell>
  if (!data) return <Shell><p className="text-ink-2">Yükleniyor…</p></Shell>

  if (data.needLogin) {
    return (
      <Shell>
        <div className="w-card mx-auto max-w-lg p-8 text-center">
          <p className="font-display text-2xl font-semibold">Bayi paneline giriş</p>
          <p className="mt-3 text-ink-2">Bayilik başvurusunda kullandığın e-postayla açılmış QRNot hesabınla giriş yap.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/account?next=/bayi" className="w-btn w-btn-primary">
              Giriş yap / hesap aç
            </Link>
            <Link href="/bayilik" className="w-btn w-btn-ghost">
              Bayilik hakkında
            </Link>
          </div>
        </div>
      </Shell>
    )
  }

  if (!data.dealer) {
    return (
      <Shell>
        <div className="w-card mx-auto max-w-lg p-8 text-center">
          <p className="font-display text-2xl font-semibold">Bu hesaba bağlı bayilik yok</p>
          <p className="mt-3 text-ink-2">
            <b>{data.email}</b> ile giriş yaptın. Başvuruyu farklı bir e-postayla yaptıysan o adresle giriş yap; henüz başvurmadıysan formu doldur.
          </p>
          <Link href="/bayilik#basvuru" className="w-btn w-btn-primary mt-6">
            Bayilik başvurusu yap
          </Link>
        </div>
      </Shell>
    )
  }

  const d = data.dealer
  if (d.status !== 'approved') {
    const text =
      d.status === 'pending'
        ? 'Başvurun inceleniyor. En geç 2 iş günü içinde e-postayla dönüş yapacağız; onaylanınca panelin burada açılır.'
        : d.status === 'suspended'
          ? 'Bayi hesabın askıya alındı. Ayrıntı için bizimle iletişime geç.'
          : 'Başvurun bu dönem için olumlu sonuçlanmadı. Sorun için bizimle iletişime geçebilirsin.'
    return (
      <Shell>
        <div className="w-card mx-auto max-w-lg p-8 text-center">
          <span className="w-chip w-chip-gold">{DEALER_STATUS_LABEL[d.status]}</span>
          <p className="font-display mt-4 text-2xl font-semibold">{d.company}</p>
          <p className="mt-3 text-ink-2">{text}</p>
          <a href={whatsappHref(`Merhaba QRNot, ${d.company} bayilik başvurum hakkında yazıyorum.`)} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-whatsapp mt-6">
            WhatsApp’tan yaz
          </a>
        </div>
      </Shell>
    )
  }

  const orders = data.orders || []
  const paidTotal = orders.filter((o) => PAID.includes(o.status)).reduce((s, o) => s + Number(o.total), 0)
  const unpaidTotal = orders.filter((o) => ['pending', 'awaiting_transfer'].includes(o.status)).reduce((s, o) => s + Number(o.total), 0)
  const totalQty = orders.filter((o) => !['failed', 'cancelled', 'refunded'].includes(o.status)).reduce((s, o) => s + o.items.reduce((a, l) => a + l.quantity, 0), 0)

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">Bayi paneli</p>
          <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{d.company}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {d.contactName} · {d.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-chip w-chip-sage">Ürünlerde %{d.discountPct} indirim</span>
          <span className="w-chip w-chip-ink">DPP’de %{d.dppDiscountPct} indirim</span>
        </div>
      </div>

      {params.get('payment') === 'error' && <p className="w-alert w-alert-error mt-6">Ödeme tamamlanamadı. Tekrar dene ya da havale seç.</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Sipariş', String(orders.filter((o) => !['failed', 'cancelled'].includes(o.status)).length)],
          ['Toplam adet', String(totalQty)],
          ['Ödenen', formatMoney(paidTotal, 'TRY')],
          ['Ödeme bekleyen', formatMoney(unpaidTotal, 'TRY')],
        ].map(([label, value]) => (
          <div key={label} className="w-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
            <p className="font-display mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <OrderForm dealer={d} providers={data.providers || []} />

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Siparişlerim</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-ink-2">Henüz sipariş yok.</p>
        ) : (
          <div className="w-card mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm tabular-nums">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-semibold">Sipariş</th>
                  <th className="px-4 py-3 font-semibold">Tarih</th>
                  <th className="px-4 py-3 font-semibold">Ürünler</th>
                  <th className="px-4 py-3 text-right font-semibold">Tutar</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const [label, tone] = ORDER_STATUS[o.status] || [o.status, 'w-chip']
                  return (
                    <tr key={o.order_no} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/order/${o.order_no}?key=${o.access_key}`} className="w-link font-mono font-semibold">
                          {o.order_no}
                        </Link>
                        <span className="block text-xs text-muted">{o.provider === 'transfer' ? 'Havale / EFT' : o.provider === 'paytr' ? 'Kredi kartı' : o.provider}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-2">{date(o.created_at)}</td>
                      <td className="px-4 py-3 text-ink-2">{o.items.map((l) => `${l.quantity}× ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ''}`).join(', ')}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMoney(Number(o.total), 'TRY')}</td>
                      <td className="px-4 py-3">
                        <span className={`w-chip ${tone}`}>{label}</span>
                        {o.tracking_no && <span className="block text-xs text-muted">Kargo: {o.tracking_no}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DppSection plans={data.dppPlans || []} requests={data.dppRequests || []} discount={d.dppDiscountPct} onCreated={load} />

      <p className="mt-10 text-center text-sm text-muted">
        Sorun mu var?{' '}
        <a href={whatsappHref(`Merhaba QRNot, ${d.company} bayi paneli hakkında yazıyorum.`)} target="_blank" rel="noopener noreferrer" className="w-link">
          WhatsApp’tan yaz
        </a>{' '}
        · sce@scegrup.com
      </p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pt-14">{children}</div>
}

function OrderForm({ dealer, providers }: { dealer: DealerInfo; providers: string[] }) {
  const products = useMemo(() => dealerProducts(), [])
  // anahtar: ürün id + renk id
  const [qty, setQty] = useState<Record<string, number>>({})
  const [provider, setProvider] = useState(providers.includes('paytr') ? 'paytr' : providers[0] || '')
  const [address, setAddress] = useState({ line: dealer.address, district: dealer.district, city: dealer.city, postalCode: '' })
  const [phone, setPhone] = useState(dealer.phone)
  const [note, setNote] = useState('')
  const [terms, setTerms] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lines = Object.entries(qty)
    .filter(([, q]) => q > 0)
    .map(([key, quantity]) => {
      const [productId, variantId] = key.split('|')
      return { productId, variantId: variantId || null, quantity }
    })
  const cart = priceDealerCart(lines, dealer.discountPct / 100)
  const set = (key: string, value: string) => setQty((cur) => ({ ...cur, [key]: Math.max(0, Math.min(5000, Math.floor(Number(value) || 0))) }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/dealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'order', lines, provider, address, phone, note, terms }),
      })
      const json = (await res.json().catch(() => ({}))) as { redirectUrl?: string; error?: string }
      if (!res.ok || !json.redirectUrl) throw new Error(json.error || 'Sipariş oluşturulamadı.')
      window.location.assign(json.redirectUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sipariş oluşturulamadı.')
      setSending(false)
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">Yeni sipariş</h2>
      <p className="mt-1 text-ink-2">En az {DEALER_MIN_QTY} adet; ürün ve renkler birlikte sayılır. Fiyatlar bayi fiyatıdır (KDV dahil).</p>
      <form onSubmit={submit} className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {products.map((p) => {
            const unit = cart.lines.find((l) => l.productId === p.id)?.unitPrice ?? Math.floor((p.price.TRY * (1 - dealer.discountPct / 100)) / 100) * 100
            return (
              <div key={p.id} className="w-card p-5">
                <div className="flex items-center gap-4">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-2">
                    <ProductArt kind={p.kind} nfc={p.nfc} className="h-full w-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.name.tr}</span>
                    <span className="block text-sm">
                      <b className="text-coral-2">{formatMoney(unit, 'TRY')}</b> <span className="text-muted line-through">{formatMoney(p.price.TRY, 'TRY')}</span>
                    </span>
                  </span>
                  {!p.variants && (
                    <span className="w-24 shrink-0">
                      <input
                        id={`q-${p.id}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        aria-label={`${p.name.tr} adet`}
                        className="w-input text-right"
                        placeholder="0"
                        value={qty[`${p.id}|`] || ''}
                        onChange={(e) => set(`${p.id}|`, e.target.value)}
                      />
                    </span>
                  )}
                </div>
                {p.variants && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {p.variants.map((v) => (
                      <label key={v.id} className="block">
                        <span className="mb-1 flex items-center gap-2 text-xs font-semibold text-ink-2">
                          <span className="h-3 w-3 rounded-full border border-line" style={{ background: v.swatch }} />
                          {v.label.tr}
                        </span>
                        <input
                          id={`q-${p.id}-${v.id}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          className="w-input text-right"
                          placeholder="0"
                          value={qty[`${p.id}|${v.id}`] || ''}
                          onChange={(e) => set(`${p.id}|${v.id}`, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {cart.hasPhysical && (
            <div className="w-card p-5">
              <h3 className="font-semibold">Teslimat adresi</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="w-label">Adres</span>
                  <textarea id="d-addr" className="w-input min-h-20" maxLength={300} value={address.line} onChange={(e) => setAddress({ ...address, line: e.target.value })} required />
                </label>
                <label className="block">
                  <span className="w-label">İlçe</span>
                  <input id="d-dist" className="w-input" maxLength={80} value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
                </label>
                <label className="block">
                  <span className="w-label">Şehir</span>
                  <input id="d-city" className="w-input" maxLength={80} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
                </label>
                <label className="block">
                  <span className="w-label">Posta kodu</span>
                  <input id="d-zip" className="w-input" maxLength={16} value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
                </label>
                <label className="block">
                  <span className="w-label">Telefon</span>
                  <input id="d-phone" className="w-input" type="tel" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>
              </div>
            </div>
          )}
          <label className="block">
            <span className="w-label">Sipariş notu (isteğe bağlı)</span>
            <textarea id="d-note" className="w-input min-h-16" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="w-card-soft p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">Sipariş özeti</p>
            <p className="font-display mt-2 text-3xl font-semibold tabular-nums">{formatMoney(cart.subtotal, 'TRY')}</p>
            <dl className="mt-4 space-y-2 text-sm tabular-nums">
              <div className="flex justify-between">
                <dt className="text-ink-2">Toplam adet</dt>
                <dd className="font-semibold">{cart.totalQty}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Site fiyatıyla</dt>
                <dd>{formatMoney(cart.listTotal, 'TRY')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Bayi indirimi (%{dealer.discountPct})</dt>
                <dd className="text-sage">−{formatMoney(cart.saving, 'TRY')}</dd>
              </div>
            </dl>
            {cart.totalQty < DEALER_MIN_QTY && (
              <p className="w-alert w-alert-warn mt-4 text-sm">
                En az {DEALER_MIN_QTY} adet gerekli. {DEALER_MIN_QTY - cart.totalQty} adet daha ekle.
              </p>
            )}
            <fieldset className="mt-5 space-y-2">
              <legend className="w-label">Ödeme</legend>
              {providers.includes('paytr') && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper p-3">
                  <input id="pay-card" type="radio" name="pay" className="accent-coral" checked={provider === 'paytr'} onChange={() => setProvider('paytr')} />
                  <span className="text-sm font-semibold">💳 Kredi kartı</span>
                </label>
              )}
              {providers.includes('transfer') && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper p-3">
                  <input id="pay-transfer" type="radio" name="pay" className="accent-coral" checked={provider === 'transfer'} onChange={() => setProvider('transfer')} />
                  <span className="text-sm font-semibold">🏦 Havale / EFT</span>
                </label>
              )}
              {providers.includes('mock') && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper p-3">
                  <input id="pay-mock" type="radio" name="pay" checked={provider === 'mock'} onChange={() => setProvider('mock')} />
                  <span className="text-sm">Test ödemesi</span>
                </label>
              )}
            </fieldset>
            <label className="mt-4 flex items-start gap-3">
              <input id="d-terms" type="checkbox" required className="mt-0.5 h-4 w-4 accent-coral" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span className="text-sm text-ink-2">
                <a href="/bayilik#sartlar" target="_blank" className="w-link">
                  Bayilik satış şartlarını
                </a>{' '}
                kabul ediyorum.
              </span>
            </label>
            {error && <p className="w-alert w-alert-error mt-4 text-sm">{error}</p>}
            <button type="submit" className="w-btn w-btn-primary w-btn-block mt-4" disabled={sending || cart.totalQty < DEALER_MIN_QTY || !provider}>
              {sending ? 'Hazırlanıyor…' : provider === 'transfer' ? 'Siparişi oluştur (havale)' : 'Ödemeye geç'}
            </button>
            <p className="mt-3 text-xs text-muted">Kargo ücreti alıcıya aittir. Havalede sipariş, ödeme hesabımıza geçince hazırlanır.</p>
          </div>
        </aside>
      </form>
    </section>
  )
}

function DppSection({ plans, requests, discount, onCreated }: { plans: DppPlan[]; requests: DppRow[]; discount: number; onCreated: () => void }) {
  const [form, setForm] = useState({ customerCompany: '', customerContact: '', customerEmail: '', customerPhone: '', plan: 'pilot', paymentMethod: 'transfer', note: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const f = (key: keyof typeof form) => ({
    id: `dpp-${key}`,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((cur) => ({ ...cur, [key]: e.target.value })),
  })
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/dealer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'dpp', ...form }) })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Talep gönderilemedi.')
      setState('done')
      setForm((cur) => ({ ...cur, customerCompany: '', customerContact: '', customerEmail: '', customerPhone: '', note: '' }))
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Talep gönderilemedi.')
      setState('idle')
    }
  }
  const per = (p: DppPlan) => (p.per === 'once' ? 'tek sefer' : p.per === 'month' ? '/ ay' : '/ ay’dan')

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold">QRNot DPP talepleri</h2>
      <p className="mt-1 text-ink-2">İhracatçı müşterin için paket talebi oluştur. Liste fiyatından %{discount} indirimle sana faturalanır (euro, KDV hariç). Alt sınır yok.</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} className="w-card p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="w-label">Müşteri firma</span>
              <input className="w-input" required maxLength={200} {...f('customerCompany')} />
            </label>
            <label className="block">
              <span className="w-label">Yetkili</span>
              <input className="w-input" maxLength={120} {...f('customerContact')} />
            </label>
            <label className="block">
              <span className="w-label">Telefon</span>
              <input className="w-input" type="tel" maxLength={40} {...f('customerPhone')} />
            </label>
            <label className="block sm:col-span-2">
              <span className="w-label">E-posta (panel bu adrese açılır)</span>
              <input className="w-input" type="email" maxLength={255} {...f('customerEmail')} />
            </label>
            <label className="block">
              <span className="w-label">Paket</span>
              <select className="w-input" {...f('plan')}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {eur(p.dealerEur)} {per(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="w-label">Ödeme</span>
              <select className="w-input" {...f('paymentMethod')}>
                <option value="transfer">Havale / EFT</option>
                <option value="card">Kredi kartı (ödeme linki gönderilir)</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="w-label">Not (isteğe bağlı)</span>
              <textarea className="w-input min-h-16" maxLength={1000} placeholder="Ürün grubu, model sayısı, AB’de sattığı ülkeler…" {...f('note')} />
            </label>
          </div>
          {error && <p className="w-alert w-alert-error mt-4 text-sm">{error}</p>}
          {state === 'done' && <p className="w-alert w-alert-success mt-4 text-sm">Talebin alındı. Fatura ve ödeme bilgisi için seninle iletişime geçeceğiz.</p>}
          <button type="submit" className="w-btn w-btn-primary mt-4" disabled={state === 'sending'}>
            {state === 'sending' ? 'Gönderiliyor…' : 'DPP talebi gönder'}
          </button>
        </form>

        <div className="w-card-soft p-5 sm:p-6">
          <h3 className="font-semibold">Taleplerin</h3>
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">Henüz DPP talebi yok.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {requests.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                  <span>
                    <span className="block font-semibold">{r.customer_company}</span>
                    <span className="block text-xs text-muted">
                      {plans.find((p) => p.id === r.plan)?.name || r.plan} · {date(r.created_at)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold tabular-nums">{eur(r.dealer_eur)}</span>
                    <span className={`w-chip mt-1 ${r.paid ? 'w-chip-sage' : 'w-chip-gold'}`}>{r.paid ? 'Ödendi' : 'Ödeme bekleniyor'}</span>
                    <span className="block text-xs text-muted">{DPP_REQUEST_STATUS_LABEL[r.status] || r.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
