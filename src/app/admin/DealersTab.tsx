'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatMoney } from '@/lib/commerce/catalog'
import { DEALER_STATUS_LABEL, DPP_DEALER_PLANS, DPP_REQUEST_STATUSES, DPP_REQUEST_STATUS_LABEL, type DealerStatus } from '@/lib/dealersShared'
import { btn, input, type Caller } from './ShopTabs'

// Admin > Bayiler: başvurular, bayi bazında sipariş / ödeme durumu, DPP talepleri

interface DealerRow {
  id: string
  status: DealerStatus
  company: string
  tax_office: string
  tax_no: string
  contact_name: string
  email: string
  phone: string
  city: string
  district: string
  address: string
  business_type: string
  website: string
  expected_monthly: number
  interests: string[]
  message: string
  discount_pct: string
  dpp_discount_pct: string
  admin_note: string
  user_id: string | null
  created_at: string
  approved_at: string | null
  order_count: number
  total_qty: number
  paid_total: string
  unpaid_total: string
  last_order_at: string | null
  dpp_count: number
  dpp_paid_eur: string
  dpp_unpaid_eur: string
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
}
interface DppRow {
  id: string
  customer_company: string
  customer_contact: string
  customer_email: string
  customer_phone: string
  customer_tax_no: string
  plan: string
  list_eur: string
  dealer_eur: string
  payment_method: string
  billing: string
  eur_rate: string | null
  amount_try: number | null
  order_no: string | null
  dpp_company_id: string | null
  period_end: string | null
  renew_count?: number
  status: string
  paid: boolean
  note: string
  admin_note: string
  created_at: string
}

const STATUS_TONE: Record<DealerStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  rejected: 'bg-neutral-700 text-neutral-300',
  suspended: 'bg-rose-500/20 text-rose-300',
}
const ORDER_LABEL: Record<string, string> = {
  pending: 'Ödeme bekleniyor',
  awaiting_transfer: 'Havale bekleniyor',
  paid: 'Ödendi',
  fulfilled: 'Teslim edildi',
  shipped: 'Kargoda',
  delivered: 'Teslim edildi',
  failed: 'Başarısız',
  cancelled: 'İptal',
  refunded: 'İade',
}
const TL = (k: number | string) => formatMoney(Number(k), 'TRY')
const EUR = (n: number | string) => `€${Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString('tr-TR') : '—')

async function post<T>(password: string, action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('/api/admin/dealers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, action, ...payload }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'İşlem başarısız')
  return data as T
}

export function DealersTab({ password, call }: { password: string; call: Caller }) {
  const [status, setStatus] = useState('')
  const [rows, setRows] = useState<DealerRow[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [totals, setTotals] = useState<{ paid: string; unpaid: string; orders: number } | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await post<{ dealers: DealerRow[]; counts: Array<{ status: string; count: number }>; totals: { paid: string; unpaid: string; orders: number } }>(password, 'list', {
        status: status || null,
      })
      setRows(data.dealers)
      setCounts(Object.fromEntries(data.counts.map((c) => [c.status, c.count])))
      setTotals(data.totals)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }, [password, status])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Onaylı bayi', String(counts.approved || 0)],
          ['Bekleyen başvuru', String(counts.pending || 0)],
          ['Bayi cirosu (ödenen)', totals ? TL(totals.paid) : '—'],
          ['Ödeme bekleyen', totals ? TL(totals.unpaid) : '—'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs uppercase tracking-wider text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className={`${input.replace('w-full ', '')} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tüm bayiler</option>
          {Object.entries(DEALER_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v} ({counts[k] || 0})
            </option>
          ))}
        </select>
        <button className={`${btn} bg-neutral-800`} onClick={() => void load()}>
          ↻ Yenile
        </button>
        <a href="/bayilik" target="_blank" className={`${btn} bg-neutral-800`}>
          Bayilik sayfası ↗
        </a>
      </div>
      {error && <p className="rounded-xl bg-rose-500/15 p-3 text-sm text-rose-200">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-neutral-800">
        {rows.length === 0 && <p className="p-6 text-center text-neutral-500">Kayıt yok</p>}
        {rows.map((d) => (
          <div key={d.id} className="border-b border-neutral-800 last:border-0">
            <button className="grid w-full grid-cols-2 gap-2 px-4 py-3 text-left text-sm hover:bg-neutral-900 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]" onClick={() => setOpen(open === d.id ? null : d.id)}>
              <span>
                <span className="font-semibold">{d.company}</span>
                <span className="block text-xs text-neutral-500">
                  {d.business_type} · {d.city} · {d.interests.map((i) => (i === 'dpp' ? 'DPP' : 'Ürün')).join(' + ')}
                </span>
              </span>
              <span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[d.status]}`}>{DEALER_STATUS_LABEL[d.status]}</span>
              </span>
              <span className="tabular-nums">
                {d.order_count} sipariş
                <span className="block text-xs text-neutral-500">{d.total_qty} adet</span>
              </span>
              <span className="tabular-nums text-emerald-300">
                {TL(d.paid_total)}
                <span className="block text-xs text-neutral-500">ödenen</span>
              </span>
              <span className={`tabular-nums ${Number(d.unpaid_total) > 0 ? 'text-amber-300' : 'text-neutral-500'}`}>
                {TL(d.unpaid_total)}
                <span className="block text-xs text-neutral-500">bekleyen</span>
              </span>
              <span className="text-neutral-400">
                {d.dpp_count ? `${d.dpp_count} DPP · ${EUR(d.dpp_paid_eur)}` : '—'}
                <span className="block text-xs text-neutral-500">son sipariş {day(d.last_order_at)}</span>
              </span>
            </button>
            {open === d.id && <DealerDetail dealer={d} password={password} call={call} onChange={load} />}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Bitişe kalan gün (bugün biten 0, geçmiş eksi) */
const daysUntil = (end: string) => Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)

function PeriodChip({ end, renewals }: { end: string | null; renewals: number }) {
  if (!end) return <span className="rounded-xl bg-emerald-900/40 px-3 py-2 text-xs text-emerald-200">Panel açık · tek sefer</span>
  const left = daysUntil(end)
  const tone = left <= 0 ? 'bg-rose-900/50 text-rose-200' : left <= 7 ? 'bg-amber-900/50 text-amber-200' : 'bg-emerald-900/40 text-emerald-200'
  const text = left <= 0 ? `Süresi doldu · ${day(end)}` : `${day(end)}'e kadar · ${left} gün`
  return (
    <span className={`rounded-xl px-3 py-2 text-xs ${tone}`}>
      {text}
      {renewals ? ` · ${renewals} yenileme` : ''}
    </span>
  )
}

function DealerDetail({ dealer, password, call, onChange }: { dealer: DealerRow; password: string; call: Caller; onChange: () => Promise<void> }) {
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [dpp, setDpp] = useState<DppRow[]>([])
  const [discount, setDiscount] = useState(String(Number(dealer.discount_pct)))
  const [dppDiscount, setDppDiscount] = useState(String(Number(dealer.dpp_discount_pct)))
  const [note, setNote] = useState(dealer.admin_note)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [secret, setSecret] = useState<{ company: string; panelUrl: string; email: string; password: string; mail: string } | null>(null)

  const loadDetail = useCallback(async () => {
    const data = await post<{ orders: OrderRow[]; dpp: DppRow[] }>(password, 'detail', { id: dealer.id }).catch(() => null)
    if (data) {
      setOrders(data.orders)
      setDpp(data.dpp)
    }
  }, [password, dealer.id])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail()
  }, [loadDetail])

  const update = async (payload: Record<string, unknown>, done: string) => {
    setBusy(true)
    setMsg(null)
    try {
      const res = await post<{ mail: string }>(password, 'update', { id: dealer.id, ...payload })
      setMsg(res.mail === 'sent' ? `${done} Bayiye onay e-postası gönderildi.` : done)
      await onChange()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Kaydedilemedi')
    } finally {
      setBusy(false)
    }
  }
  const markPaid = async (orderNo: string) => {
    if (!window.confirm(`${orderNo} için ödeme hesaba geçti mi? Sipariş "ödendi" olarak işaretlenecek ve dijital ürünler bayinin hesabına tanımlanacak.`)) return
    if (await call('orders.markPaid', { orderNo })) {
      await loadDetail()
      await onChange()
    }
  }
  const activate = async (r: DppRow) => {
    if (!window.confirm(`${r.customer_company} için DPP paneli açılacak ve giriş bilgisi ${r.customer_email} adresine gönderilecek. Devam edilsin mi?`)) return
    setMsg(null)
    try {
      const res = await post<{ panelUrl: string; email: string; password: string; mail: string }>(password, 'dpp.activate', { id: r.id })
      setSecret({ company: r.customer_company, ...res })
      await loadDetail()
      await onChange()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Panel açılamadı')
    }
  }
  const renewManual = async (r: DppRow) => {
    const days = r.billing === 'year' ? 365 : 30
    if (!window.confirm(`${r.customer_company} için yenileme ödemesi (havale) alındı mı? Bitiş tarihi ${days} gün uzatılacak (önceki bitişten).`)) return
    await post(password, 'dpp.renew', { id: r.id }).catch((e) => setMsg(e instanceof Error ? e.message : 'Yenilenemedi'))
    await loadDetail()
    await onChange()
  }
  const setEnd = async (r: DppRow, value: string) => {
    if (!value) return
    if (!window.confirm(`${r.customer_company} bitiş tarihi ${new Date(value).toLocaleDateString('tr-TR')} olarak değiştirilsin mi?`)) return
    // Gün sonu (Türkiye saati) olarak kaydedilir
    await post(password, 'dpp.setEnd', { id: r.id, periodEnd: `${value}T23:59:00+03:00` }).catch((e) => setMsg(e instanceof Error ? e.message : 'Kaydedilemedi'))
    await loadDetail()
  }
  const dppDelete = async (r: DppRow) => {
    const warn = r.dpp_company_id
      ? ' Paneli açılmış: talep silinir ama DPP firması kalır (DPP sekmesinden kapatılır).'
      : r.paid
        ? ' Ödemesi alınmış: ödeme kaydı siparişlerde kalır.'
        : ''
    if (!window.confirm(`${r.customer_company} DPP talebi silinsin mi?${warn}`)) return
    await post(password, 'dpp.delete', { id: r.id }).catch((e) => setMsg(e instanceof Error ? e.message : 'Silinemedi'))
    await loadDetail()
    await onChange()
  }
  const dppUpdate = async (id: string, payload: Record<string, unknown>) => {
    await post(password, 'dpp.update', { id, ...payload }).catch((e) => setMsg(e instanceof Error ? e.message : 'Kaydedilemedi'))
    await loadDetail()
    await onChange()
  }

  return (
    <div className="space-y-5 bg-neutral-950 px-4 pb-5 pt-2 text-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 p-3">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Yetkili</p>
          <p className="mt-1 font-semibold">{dealer.contact_name}</p>
          <p className="text-neutral-300">{dealer.phone}</p>
          <p className="text-neutral-300">{dealer.email}</p>
          <p className="mt-1 text-xs text-neutral-500">{dealer.user_id ? 'QRNot hesabı bağlı ✓' : 'Henüz bu e-postayla giriş yapmadı'}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 p-3">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Fatura</p>
          <p className="mt-1">
            {dealer.tax_office} · <span className="font-mono">{dealer.tax_no}</span>
          </p>
          <p className="text-neutral-300">{[dealer.address, dealer.district, dealer.city].filter(Boolean).join(', ')}</p>
          {dealer.website && <p className="text-neutral-400">{dealer.website}</p>}
        </div>
        <div className="rounded-xl border border-neutral-800 p-3">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Başvuru</p>
          <p className="mt-1">
            {day(dealer.created_at)} · aylık ~{dealer.expected_monthly || '?'} adet
          </p>
          {dealer.message && <p className="mt-1 text-neutral-300">“{dealer.message}”</p>}
          {dealer.approved_at && <p className="mt-1 text-xs text-neutral-500">Onay: {day(dealer.approved_at)}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs text-neutral-500">Ürün indirimi %</span>
          <input className={`${input} w-24`} value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs text-neutral-500">DPP indirimi %</span>
          <input className={`${input} w-24`} value={dppDiscount} onChange={(e) => setDppDiscount(e.target.value)} />
        </label>
        <label className="block min-w-64 flex-1">
          <span className="text-xs text-neutral-500">Yönetici notu (bayi görmez)</span>
          <input className={input} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button disabled={busy} className={`${btn} bg-neutral-700`} onClick={() => void update({ discountPct: discount, dppDiscountPct: dppDiscount, adminNote: note }, 'Kaydedildi.')}>
          Kaydet
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {dealer.status !== 'approved' && (
          <button disabled={busy} className={`${btn} bg-emerald-600 text-white`} onClick={() => void update({ status: 'approved', discountPct: discount, dppDiscountPct: dppDiscount, adminNote: note }, 'Bayi onaylandı.')}>
            ✓ Onayla
          </button>
        )}
        {dealer.status === 'pending' && (
          <button disabled={busy} className={`${btn} bg-neutral-700`} onClick={() => void update({ status: 'rejected' }, 'Başvuru reddedildi.')}>
            Reddet
          </button>
        )}
        {dealer.status === 'approved' && (
          <button disabled={busy} className={`${btn} bg-rose-700 text-white`} onClick={() => void update({ status: 'suspended' }, 'Bayi askıya alındı.')}>
            Askıya al
          </button>
        )}
        <a href={`https://wa.me/${dealer.phone.replace(/\D/g, '').replace(/^0/, '90')}`} target="_blank" rel="noopener noreferrer" className={`${btn} bg-neutral-800`}>
          WhatsApp ↗
        </a>
      </div>
      {msg && <p className="rounded-xl bg-neutral-800 p-3 text-neutral-200">{msg}</p>}

      <div>
        <p className="mb-2 font-semibold">Siparişler</p>
        {!orders ? (
          <p className="text-neutral-500">Yükleniyor…</p>
        ) : orders.length === 0 ? (
          <p className="text-neutral-500">Henüz sipariş yok.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full min-w-[620px] tabular-nums">
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_no} className="border-b border-neutral-800 last:border-0">
                    <td className="px-3 py-2 font-mono">{o.order_no}</td>
                    <td className="px-3 py-2 text-neutral-400">{day(o.created_at)}</td>
                    <td className="px-3 py-2 text-neutral-300">{o.items.map((l) => `${l.quantity}× ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ''}`).join(', ')}</td>
                    <td className="px-3 py-2 text-right font-semibold">{TL(o.total)}</td>
                    <td className="px-3 py-2">
                      {ORDER_LABEL[o.status] || o.status}
                      <span className="block text-xs text-neutral-500">{o.provider === 'transfer' ? 'Havale' : o.provider === 'paytr' ? 'Kart' : o.provider}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {o.status === 'awaiting_transfer' && (
                        <button className={`${btn} bg-emerald-600 text-white`} onClick={() => void markPaid(o.order_no)}>
                          Havale geldi
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 font-semibold">DPP talepleri</p>
        {secret && (
          <div className="mb-3 rounded-xl border border-emerald-700 bg-emerald-950/40 p-3">
            <p className="font-semibold text-emerald-200">✓ {secret.company} için DPP paneli açıldı</p>
            <p className="mt-1 text-xs text-emerald-100/80">
              {secret.mail === 'sent' ? 'Giriş bilgisi müşteriye e-postayla gönderildi.' : 'E-posta gönderilemedi; bilgiyi müşteriye kendin ilet.'} Şifre bir daha gösterilmez.
            </p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-emerald-100">{`Panel: ${secret.panelUrl}\nE-posta: ${secret.email}\nGeçici şifre: ${secret.password}`}</pre>
          </div>
        )}
        {dpp.length === 0 ? (
          <p className="text-neutral-500">Talep yok.</p>
        ) : (
          <div className="space-y-2">
            {dpp.map((r) => (
              <div key={r.id} className="grid gap-2 rounded-xl border border-neutral-800 p-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center">
                <span>
                  <span className="font-semibold">{r.customer_company}</span>
                  <span className="block text-xs text-neutral-400">
                    {[r.customer_tax_no ? `VKN ${r.customer_tax_no}` : '', r.customer_contact, r.customer_phone, r.customer_email].filter(Boolean).join(' · ')}
                  </span>
                  {r.note && <span className="block text-xs text-neutral-500">“{r.note}”</span>}
                </span>
                <span className="tabular-nums">
                  {DPP_DEALER_PLANS.find((p) => p.id === r.plan)?.name || r.plan} · {r.billing === 'year' ? '12 ay' : r.billing === 'month' ? '1 ay' : 'tek sefer'} · <b>{EUR(r.dealer_eur)}</b>
                  <span className="block text-xs text-neutral-500">
                    liste {EUR(r.list_eur)} · {r.payment_method === 'card' ? 'kart' : 'havale'} · {day(r.created_at)}
                  </span>
                  {r.amount_try ? (
                    <span className="block text-xs text-neutral-400">
                      {TL(r.amount_try)} KDV dahil · kur {Number(r.eur_rate).toLocaleString('tr-TR', { maximumFractionDigits: 4 })}
                      {r.order_no ? ` · ${r.order_no}` : ''}
                    </span>
                  ) : null}
                </span>
                <select className={`${input} w-auto`} value={r.status} onChange={(e) => void dppUpdate(r.id, { status: e.target.value })}>
                  {DPP_REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {DPP_REQUEST_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <span className="flex flex-wrap justify-end gap-2">
                  <button className={`${btn} ${r.paid ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'}`} disabled={Boolean(r.dpp_company_id)} onClick={() => void dppUpdate(r.id, { paid: !r.paid })}>
                    {r.paid ? '✓ Ödendi' : 'Ödendi işaretle'}
                  </button>
                  {r.dpp_company_id ? (
                    <>
                      <PeriodChip end={r.period_end} renewals={r.renew_count || 0} />
                      {r.period_end && (r.billing === 'month' || r.billing === 'year') && (
                        <>
                          <button className={`${btn} bg-emerald-700 text-white`} onClick={() => void renewManual(r)}>
                            Havale geldi · +{r.billing === 'year' ? '365' : '30'} gün
                          </button>
                          <label className="flex items-center gap-1 text-xs text-neutral-400">
                            Bitiş
                            <input
                              type="date"
                              className={`${input} w-36 py-1`}
                              defaultValue={r.period_end.slice(0, 10)}
                              onBlur={(e) => e.target.value !== r.period_end?.slice(0, 10) && void setEnd(r, e.target.value)}
                            />
                          </label>
                        </>
                      )}
                    </>
                  ) : (
                    <button className={`${btn} bg-cyan-600 text-white`} disabled={!r.paid} title={r.paid ? '' : 'Önce ödeme alınmalı'} onClick={() => void activate(r)}>
                      DPP panelini aç
                    </button>
                  )}
                  <button className={`${btn} bg-neutral-800 text-rose-300`} onClick={() => void dppDelete(r)}>
                    Sil
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
