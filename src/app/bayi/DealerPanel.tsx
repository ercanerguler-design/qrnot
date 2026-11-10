'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ProductArt from '@/components/warm/ProductArt'
import { formatMoney } from '@/lib/commerce/catalog'
import { DEALER_MIN_QTY, DEALER_STATUS_LABEL, DPP_REQUEST_STATUS_LABEL, dealerProducts, priceDealerCart, type DealerStatus, type DppRequestStatus } from '@/lib/dealersShared'
import { COMPANY, whatsappHref } from '@/lib/site'

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
  billing: string
  amount_try: number | null
  dpp_company_id: string | null
  period_end: string | null
  renew_count?: number
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
  eurRate?: { rate: number; date: string } | null
  kdv?: number
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
const IBAN = COMPANY.iban
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
      {params.get('dpp') === 'paid' && (
        <p className="w-alert w-alert-success mt-6">Ödemen için teşekkürler. Onaylandığında DPP talebin “Ödendi” görünür; müşterinin paneli açılınca sana e-posta gelir.</p>
      )}

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
          <OrdersTable orders={orders} onChange={load} />
        )}
      </section>

      <DppSection plans={data.dppPlans || []} requests={data.dppRequests || []} discount={d.dppDiscountPct} eurRate={data.eurRate || null} kdv={data.kdv ?? 0.2} onCreated={load} />

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

// Kartla ödemede PayTR penceresi 30 dk açık kalır; bu süre (35 dk güvenlik payıyla) dolmadan sipariş silinmez (sunucu da aynı kuralı uygular)
const CARD_WINDOW_MS = 35 * 60 * 1000
const UNPAID = ['pending', 'awaiting_transfer', 'failed', 'cancelled']

function OrdersTable({ orders, onChange }: { orders: OrderRow[]; onChange: () => Promise<void> }) {
  const [confirming, setConfirming] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [now] = useState(() => Date.now())

  const remove = async (orderNo: string) => {
    setBusy(orderNo)
    setMsg(null)
    try {
      const res = await fetch('/api/dealer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'order.delete', orderNo }) })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Sipariş silinemedi.')
      setMsg({ tone: 'success', text: `${orderNo} silindi.` })
      setConfirming(null)
      await onChange()
    } catch (err) {
      setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'Sipariş silinemedi.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {msg && <p className={`w-alert mt-4 text-sm ${msg.tone === 'error' ? 'w-alert-error' : 'w-alert-success'}`}>{msg.text}</p>}
      <div className="w-card mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm tabular-nums">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Sipariş</th>
              <th className="px-4 py-3 font-semibold">Tarih</th>
              <th className="px-4 py-3 font-semibold">Ürünler</th>
              <th className="px-4 py-3 text-right font-semibold">Tutar</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3 text-right font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const [label, tone] = ORDER_STATUS[o.status] || [o.status, 'w-chip']
              const unpaid = UNPAID.includes(o.status)
              const cardOpen = o.status === 'pending' && o.provider === 'paytr' && now - new Date(o.created_at).getTime() < CARD_WINDOW_MS
              return (
                <tr key={o.order_no} className="border-b border-line align-top last:border-0">
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
                  <td className="px-4 py-3 text-right">
                    {!unpaid ? (
                      <span className="text-xs text-muted">—</span>
                    ) : confirming === o.order_no ? (
                      <span className="inline-flex flex-col items-end gap-2">
                        <span className="max-w-56 text-xs text-ink-2">
                          {o.provider === 'transfer' ? 'Havaleyi gönderdiysen silme; ödemen eşleşmez. Silinsin mi?' : 'Sipariş kalıcı olarak silinecek. Emin misin?'}
                        </span>
                        <span className="flex gap-2">
                          <button type="button" className="w-btn w-btn-ghost w-btn-sm" onClick={() => setConfirming(null)} disabled={busy === o.order_no}>
                            Vazgeç
                          </button>
                          <button type="button" className="w-btn w-btn-primary w-btn-sm" onClick={() => void remove(o.order_no)} disabled={busy === o.order_no}>
                            {busy === o.order_no ? 'Siliniyor…' : 'Evet, sil'}
                          </button>
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex flex-wrap justify-end gap-2">
                        {cardOpen && (
                          <a href={`/checkout/paytr?order=${o.order_no}&key=${o.access_key}`} className="w-btn w-btn-primary w-btn-sm">
                            Ödemeye dön
                          </a>
                        )}
                        {o.status === 'awaiting_transfer' && (
                          <Link href={`/order/${o.order_no}?key=${o.access_key}`} className="w-btn w-btn-ghost w-btn-sm">
                            IBAN bilgisi
                          </Link>
                        )}
                        {cardOpen ? (
                          <span className="w-full text-xs text-muted">Ödeme penceresi kapanınca silinebilir</span>
                        ) : (
                          <button type="button" className="w-btn w-btn-ghost w-btn-sm" onClick={() => setConfirming(o.order_no)}>
                            Sil
                          </button>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Ödemesi alınmamış siparişleri silebilirsin; silinen sipariş bizim tarafımızdan da kalkar. Ödenmiş siparişte değişiklik için bize yaz.</p>
    </>
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

/** Bitişe kalan gün (bugün biten 0, geçmiş eksi) */
function daysLeft(end: string | null) {
  if (!end) return Infinity
  return Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)
}

function PeriodStatus({ r }: { r: DppRow }) {
  if (!r.dpp_company_id) {
    return <span className="text-xs text-ink-2">{r.paid ? 'Ödeme alındı · panel kurulumu hazırlanıyor' : DPP_REQUEST_STATUS_LABEL[r.status] || r.status}</span>
  }
  if (!r.period_end) return <span className="text-xs text-sage">✓ Panel açık · tek seferlik paket</span>
  const left = daysLeft(r.period_end)
  if (left <= 0) {
    return (
      <span className="text-xs font-semibold text-coral-2">
        ⛔ Dönem {date(r.period_end)} tarihinde sona erdi. Panel açık; müşteriye yenileme uyarısı gösteriliyor.
      </span>
    )
  }
  if (left <= 7) return <span className="text-xs font-semibold text-gold">⏳ {date(r.period_end)} tarihinde bitiyor · {left} gün kaldı</span>
  return (
    <span className="text-xs text-sage">
      ✓ Panel açık · {date(r.period_end)} tarihine kadar ({left} gün){r.renew_count ? ` · ${r.renew_count}. yenileme` : ''}
    </span>
  )
}

function DppSection({
  plans,
  requests,
  discount,
  eurRate,
  kdv,
  onCreated,
}: {
  plans: DppPlan[]
  requests: DppRow[]
  discount: number
  eurRate: { rate: number; date: string } | null
  kdv: number
  onCreated: () => Promise<void>
}) {
  const [form, setForm] = useState({ customerCompany: '', customerTaxNo: '', customerContact: '', customerEmail: '', customerPhone: '', plan: 'pilot', billing: 'year', paymentMethod: 'card', note: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const removeRequest = async (id: string) => {
    setPayError(null)
    setPaying(id)
    try {
      const res = await fetch('/api/dealer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'dpp.delete', id }) })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Talep silinemedi.')
      setConfirmDel(null)
      await onCreated()
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Talep silinemedi.')
    } finally {
      setPaying(null)
    }
  }
  const f = (key: keyof typeof form) => ({
    id: `dpp-${key}`,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((cur) => ({ ...cur, [key]: e.target.value })),
  })
  const plan = plans.find((p) => p.id === form.plan)
  const billing = plan?.per === 'once' ? 'once' : form.billing
  const periodEur = plan ? (billing === 'year' ? plan.dealerEur * 12 : plan.dealerEur) : 0
  const tryKurus = (eurValue: number) => (eurRate ? Math.round(eurValue * eurRate.rate * (1 + kdv) * 100) : null)
  const previewTry = tryKurus(periodEur)
  const cardAllowed = form.plan !== 'kurumsal'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/dealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dpp', ...form, billing, paymentMethod: cardAllowed ? form.paymentMethod : 'transfer' }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; request?: { id: string } }
      if (!res.ok || !json.request) throw new Error(json.error || 'Talep gönderilemedi.')
      // Kart seçildiyse doğrudan ödeme sayfasına geç
      if (cardAllowed && form.paymentMethod === 'card') {
        await pay(json.request.id)
        return
      }
      setState('done')
      setForm((cur) => ({ ...cur, customerCompany: '', customerTaxNo: '', customerContact: '', customerEmail: '', customerPhone: '', note: '' }))
      await onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Talep gönderilemedi.')
      setState('idle')
    }
  }

  const pay = async (id: string, action: 'dpp.pay' | 'dpp.renew' = 'dpp.pay') => {
    setPayError(null)
    setPaying(id)
    try {
      const res = await fetch('/api/dealer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, id }) })
      const json = (await res.json().catch(() => ({}))) as { error?: string; redirectUrl?: string }
      if (!res.ok || !json.redirectUrl) throw new Error(json.error || 'Ödeme sayfası açılamadı.')
      window.location.assign(json.redirectUrl)
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Ödeme sayfası açılamadı.')
      setPaying(null)
      setState('idle')
      await onCreated()
    }
  }

  const per = (p: DppPlan) => (p.per === 'once' ? 'tek sefer' : p.per === 'month' ? '/ ay' : '/ ay’dan')
  const billingLabel = (b: string) => (b === 'year' ? '12 aylık' : b === 'month' ? '1 aylık' : 'tek sefer')

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold">QRNot DPP talepleri</h2>
      <p className="mt-1 text-ink-2">
        İhracatçı müşterin için paket talebi oluştur. Liste fiyatından %{discount} indirimli; euro fiyatlar KDV hariç. Kartla ödemede tutar TCMB euro satış kuruyla TL’ye çevrilir ve %{Math.round(kdv * 100)} KDV eklenir.
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} className="w-card p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="w-label">Müşteri firma</span>
              <input className="w-input" required maxLength={200} {...f('customerCompany')} />
            </label>
            <label className="block">
              <span className="w-label">Müşteri vergi no</span>
              <input className="w-input" required inputMode="numeric" maxLength={11} placeholder="10 hane" {...f('customerTaxNo')} />
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
              <span className="w-label">Müşteri e-postası (DPP paneli bu adrese açılır)</span>
              <input className="w-input" type="email" required maxLength={255} {...f('customerEmail')} />
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
            {plan?.per !== 'once' && (
              <label className="block">
                <span className="w-label">Dönem</span>
                <select className="w-input" {...f('billing')}>
                  <option value="year">12 aylık (yıllık peşin)</option>
                  <option value="month">1 aylık</option>
                </select>
              </label>
            )}
            <label className={`block ${plan?.per === 'once' ? '' : 'sm:col-span-2'}`}>
              <span className="w-label">Ödeme</span>
              <select className="w-input" {...f('paymentMethod')} disabled={!cardAllowed}>
                {cardAllowed && <option value="card">Kredi kartı (hemen öde)</option>}
                <option value="transfer">Havale / EFT</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="w-label">Not (isteğe bağlı)</span>
              <textarea className="w-input min-h-16" maxLength={1000} placeholder="Ürün grubu, model sayısı, AB’de sattığı ülkeler…" {...f('note')} />
            </label>
          </div>
          <div className="mt-4 rounded-2xl bg-cream-2 p-4 text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-ink-2">Bayi fiyatı ({billingLabel(billing)}, KDV hariç)</span>
              <b>{plan?.per === 'from' ? `${eur(periodEur)}’dan` : eur(periodEur)}</b>
            </div>
            {cardAllowed ? (
              previewTry !== null && (
                <div className="mt-1 flex justify-between">
                  <span className="text-ink-2">Kartla ödenecek (KDV dahil)</span>
                  <b className="text-coral-2">{formatMoney(previewTry, 'TRY')}</b>
                </div>
              )
            ) : (
              <p className="mt-1 text-ink-2">Kurumsal pakette fiyat teklifle netleşir; ödeme bilgisi sana iletilir.</p>
            )}
            {eurRate && cardAllowed && (
              <p className="mt-1 text-xs text-muted">
                TCMB euro satış kuru {eurRate.rate.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} ₺ ({eurRate.date}). Kesin tutar ödeme anındaki kurla hesaplanır.
              </p>
            )}
          </div>
          {error && <p className="w-alert w-alert-error mt-4 text-sm">{error}</p>}
          {state === 'done' && <p className="w-alert w-alert-success mt-4 text-sm">Talebin alındı. Havale bilgisi aşağıda; ödemen hesabımıza geçince müşterinin paneli açılır.</p>}
          <button type="submit" className="w-btn w-btn-primary mt-4" disabled={state === 'sending'}>
            {state === 'sending' ? 'Hazırlanıyor…' : cardAllowed && form.paymentMethod === 'card' ? 'Talebi oluştur ve kartla öde' : 'DPP talebi gönder'}
          </button>
        </form>

        <div className="w-card-soft p-5 sm:p-6">
          <h3 className="font-semibold">Taleplerin</h3>
          {payError && <p className="w-alert w-alert-error mt-3 text-sm">{payError}</p>}
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">Henüz DPP talebi yok.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {requests.map((r) => {
                const est = tryKurus(Number(r.dealer_eur))
                // Yenileme o günkü site fiyatıyla (bayi indirimi uygulanmış) hesaplanır
                const cur = plans.find((p) => p.id === r.plan)
                const renewEst = cur ? tryKurus(r.billing === 'year' ? cur.dealerEur * 12 : cur.dealerEur) : est
                return (
                  <li key={r.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block font-semibold">{r.customer_company}</span>
                        <span className="block text-xs text-muted">
                          {plans.find((p) => p.id === r.plan)?.name || r.plan} · {billingLabel(r.billing)} · {date(r.created_at)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold tabular-nums">{eur(r.dealer_eur)}</span>
                        {r.amount_try ? <span className="block text-xs text-muted tabular-nums">{formatMoney(r.amount_try, 'TRY')} KDV dahil</span> : null}
                        <span className={`w-chip mt-1 ${r.paid ? 'w-chip-sage' : 'w-chip-gold'}`}>{r.paid ? 'Ödendi' : 'Ödeme bekleniyor'}</span>
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <PeriodStatus r={r} />
                      <span className="flex flex-wrap justify-end gap-2">
                        {!r.paid && r.status !== 'cancelled' && r.plan !== 'kurumsal' && confirmDel !== r.id && (
                          <button type="button" className="w-btn w-btn-primary w-btn-sm" disabled={paying === r.id} onClick={() => void pay(r.id)}>
                            {paying === r.id ? 'Bekle…' : `Kartla öde${est ? ` · ${formatMoney(est, 'TRY')}` : ''}`}
                          </button>
                        )}
                        {r.dpp_company_id && (r.billing === 'month' || r.billing === 'year') && r.plan !== 'kurumsal' && confirmDel !== r.id && (
                          <button
                            type="button"
                            className={`w-btn w-btn-sm ${daysLeft(r.period_end) <= 7 ? 'w-btn-primary' : 'w-btn-ghost'}`}
                            disabled={paying === r.id}
                            onClick={() => void pay(r.id, 'dpp.renew')}
                          >
                            {paying === r.id ? 'Bekle…' : `Dönemi yenile${renewEst ? ` · ${formatMoney(renewEst, 'TRY')}` : ''}`}
                          </button>
                        )}
                        {!r.paid && !r.dpp_company_id &&
                          (confirmDel === r.id ? (
                            <>
                              <button type="button" className="w-btn w-btn-ghost w-btn-sm" onClick={() => setConfirmDel(null)}>
                                Vazgeç
                              </button>
                              <button type="button" className="w-btn w-btn-primary w-btn-sm" disabled={paying === r.id} onClick={() => void removeRequest(r.id)}>
                                {paying === r.id ? 'Siliniyor…' : 'Evet, sil'}
                              </button>
                            </>
                          ) : (
                            <button type="button" className="w-btn w-btn-ghost w-btn-sm" onClick={() => setConfirmDel(r.id)}>
                              Sil
                            </button>
                          ))}
                      </span>
                    </div>
                    {!r.paid && r.status !== 'cancelled' && r.payment_method === 'transfer' && (
                      <p className="mt-2 rounded-xl bg-paper p-3 text-xs text-ink-2">
                        Havale / EFT: <b className="font-mono">{IBAN}</b> · SCE INNOVATION LTD. ŞTİ. · Açıklama: <b className="font-mono">DPP {r.id.slice(0, 8).toUpperCase()}</b>. {r.plan !== 'kurumsal' && est ? <>Tutar: <b>{formatMoney(est, 'TRY')}</b> (bugünkü kurla, KDV dahil). </> : null}Kesin tutar faturayla iletilir.
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
