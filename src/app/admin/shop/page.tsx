'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatMoney, type Currency, type PricedLine } from '@/lib/commerce/catalog'
import { describeNfcError, isWebNfcSupported, writeUrlToTag } from '@/lib/webNfc'

// Mağaza siparişleri, Etsy aktivasyonları, toplu üretim ve NFC yazma istasyonu.

type Tab = 'orders' | 'revenue' | 'etsy' | 'production'

interface AdminOrder {
  order_no: string
  access_key: string
  status: string
  provider: string
  currency: Currency
  total: number
  email: string
  full_name: string
  phone: string
  address: { line: string; district: string; city: string; postalCode: string; country: string } | null
  items: PricedLine[]
  customer_note: string
  admin_note: string
  tracking_no: string
  created_at: string
}

interface EtsyRow {
  id: string
  order_number: string
  email: string
  product: string
  status: string
  slug: string
  is_claimed: boolean
  is_active: boolean
  created_at: string
}

interface NfcRow {
  slug: string
  is_claimed: boolean
  qr_mode: string
  source_channel: string | null
  nfc_encoded_at: string | null
  nfc_locked: boolean
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://qrnot.com').replace(/\/$/, '')
const STATUS_LABEL: Record<string, string> = {
  pending: 'Ödeme bekliyor',
  awaiting_transfer: 'Havale bekliyor',
  paid: 'Ödendi',
  fulfilled: 'Tamamlandı',
  shipped: 'Kargoda',
  delivered: 'Teslim edildi',
  failed: 'Başarısız',
  cancelled: 'İptal',
  refunded: 'İade',
}

const input = 'w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400'
const btn = 'rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40'

export default function AdminShopPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('orders')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('qrnote_admin_pw')
    if (saved) {
      const raf = window.requestAnimationFrame(() => {
        setPassword(saved)
        setAuthed(true)
      })
      return () => window.cancelAnimationFrame(raf)
    }
  }, [])

  const call = useCallback(
    async <T,>(action: string, payload: Record<string, unknown> = {}): Promise<T | null> => {
      setError(null)
      const res = await fetch('/api/admin/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action, ...payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setAuthed(false)
        sessionStorage.removeItem('qrnote_admin_pw')
        setError('Şifre hatalı')
        return null
      }
      if (!res.ok) {
        setError(data.error || 'İşlem başarısız')
        return null
      }
      return data as T
    },
    [password]
  )

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-3 rounded-3xl border border-neutral-800 bg-neutral-950/80 p-6">
          <h1 className="text-xl font-bold">Mağaza Yönetimi</h1>
          <input className={input} type="password" placeholder="Admin şifresi" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            className={`${btn} w-full bg-cyan-500 text-neutral-950`}
            disabled={!password}
            onClick={async () => {
              const res = await fetch('/api/admin/shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, action: 'orders.list' }),
              })
              if (res.ok) {
                sessionStorage.setItem('qrnote_admin_pw', password)
                setAuthed(true)
              } else setError('Şifre hatalı')
            }}
          >
            Giriş
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mağaza · Etsy · Üretim</h1>
        <Link href="/admin" className="text-sm text-cyan-300 hover:underline">
          ← Ana admin paneli
        </Link>
      </div>
      <div className="mb-6 flex gap-2">
        {(
          [
            ['orders', '🛒 Siparişler'],
            ['revenue', '💰 Gelir'],
            ['etsy', '🧡 Etsy'],
            ['production', '🏭 Üretim & NFC'],
          ] as const
        ).map(([key, label]) => (
          <button key={key} className={`${btn} ${tab === key ? 'bg-white text-neutral-950' : 'bg-neutral-800 text-neutral-200'}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">{error}</p>}
      {tab === 'orders' && <OrdersTab call={call} />}
      {tab === 'etsy' && <EtsyTab call={call} />}
      {tab === 'production' && <ProductionTab call={call} />}
      {tab === 'revenue' && <RevenueTab call={call} />}
    </div>
  )
}

type Caller = <T>(action: string, payload?: Record<string, unknown>) => Promise<T | null>

const CHANNEL_LABEL: Record<string, string> = {
  site: 'Site (qrnot.com)',
  etsy: 'Etsy',
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
  kurumsal: 'Kurumsal',
  diger: 'Diğer',
}
const CHANNEL_ORDER = ['site', 'etsy', 'trendyol', 'hepsiburada', 'kurumsal', 'diger']

interface RevenueRow {
  channel: string
  currency: Currency
  orders: number
  gross: number
  refunds: number
  net: number
}
interface ManualSale {
  id: string
  sale_date: string
  channel: string
  kind: 'sale' | 'refund'
  amount: number
  currency: Currency
  quantity: number
  note: string
}

function isoDay(d: Date) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function periodRange(period: string, custom: { from: string; to: string }) {
  const now = new Date()
  if (period === 'this-month') return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDay(now) }
  if (period === 'last-month')
    return { from: isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: isoDay(new Date(now.getFullYear(), now.getMonth(), 0)) }
  if (period === 'this-year') return { from: isoDay(new Date(now.getFullYear(), 0, 1)), to: isoDay(now) }
  if (period === 'custom') return { from: custom.from || null, to: custom.to || null }
  return { from: null, to: null }
}

function RevenueTab({ call }: { call: Caller }) {
  const [period, setPeriod] = useState('this-month')
  const [custom, setCustom] = useState({ from: '', to: '' })
  const [summary, setSummary] = useState<{ startDate: string | null; from: string; to: string | null; rows: RevenueRow[] } | null>(null)
  const [startInput, setStartInput] = useState('')
  const [manual, setManual] = useState<ManualSale[]>([])
  const [form, setForm] = useState({ saleDate: isoDay(new Date()), channel: 'etsy', kind: 'sale', amount: '', currency: 'TRY', quantity: '1', note: '' })

  const load = useCallback(async () => {
    const range = periodRange(period, custom)
    const data = await call<{ startDate: string | null; from: string; to: string | null; rows: RevenueRow[] }>('revenue.summary', range)
    if (data) {
      setSummary(data)
      setStartInput((prev) => prev || data.startDate || '')
    }
    const list = await call<{ items: ManualSale[] }>('revenue.manual.list')
    if (list) setManual(list.items)
  }, [call, period, custom])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const rows = (summary?.rows || []).slice().sort((a, b) => CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel) || a.currency.localeCompare(b.currency))
  const totals = (['TRY', 'USD'] as Currency[])
    .map((currency) => {
      const list = rows.filter((r) => r.currency === currency)
      return {
        currency,
        orders: list.reduce((sum, r) => sum + r.orders, 0),
        gross: list.reduce((sum, r) => sum + r.gross, 0),
        refunds: list.reduce((sum, r) => sum + r.refunds, 0),
        net: list.reduce((sum, r) => sum + r.net, 0),
      }
    })
    .filter((t) => t.orders > 0 || t.gross > 0)

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-xs text-neutral-400">Dönem</p>
            <select className={`${input} w-auto`} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="this-month">Bu ay</option>
              <option value="last-month">Geçen ay</option>
              <option value="this-year">Bu yıl</option>
              <option value="all">Sayım başlangıcından beri</option>
              <option value="custom">Özel aralık</option>
            </select>
          </div>
          {period === 'custom' && (
            <>
              <input type="date" className={`${input} w-auto`} value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
              <input type="date" className={`${input} w-auto`} value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
            </>
          )}
          <button className={`${btn} bg-neutral-800`} onClick={() => void load()}>
            ↻ Yenile
          </button>
        </div>
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
          <div>
            <p className="mb-1 text-xs text-amber-300">Sayım başlangıcı — bu tarihten önceki her şey (testler, denemeler) tabloya girmez</p>
            <input type="date" className={`${input} w-auto`} value={startInput} onChange={(e) => setStartInput(e.target.value)} />
          </div>
          <button
            className={`${btn} bg-amber-500 text-neutral-950`}
            disabled={!startInput}
            onClick={async () => {
              if (await call('revenue.setStart', { startDate: startInput })) await load()
            }}
          >
            Kaydet
          </button>
          <p className="text-xs text-neutral-400">
            {summary?.startDate ? `Şu an: ${new Date(summary.startDate).toLocaleDateString('tr-TR')}` : 'Henüz ayarlanmadı — tüm kayıtlar sayılıyor'}
          </p>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-3">Kanal</th>
              <th className="px-4 py-3 text-right">Satış adedi</th>
              <th className="px-4 py-3 text-right">Brüt satış</th>
              <th className="px-4 py-3 text-right">İade / iptal</th>
              <th className="px-4 py-3 text-right">Net satış</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.channel}-${r.currency}`} className="border-t border-neutral-800">
                <td className="px-4 py-3">
                  {CHANNEL_LABEL[r.channel] || r.channel}
                  {r.currency === 'USD' ? <span className="ml-2 text-xs text-neutral-500">USD</span> : null}
                </td>
                <td className="px-4 py-3 text-right">{r.orders}</td>
                <td className="px-4 py-3 text-right">{formatMoney(r.gross, r.currency)}</td>
                <td className="px-4 py-3 text-right text-red-300">{r.refunds ? `-${formatMoney(r.refunds, r.currency)}` : '—'}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatMoney(r.net, r.currency)}</td>
              </tr>
            ))}
            {totals.map((t) => (
              <tr key={`total-${t.currency}`} className="border-t-2 border-neutral-700 bg-neutral-900 font-bold">
                <td className="px-4 py-3">TOPLAM {t.currency === 'USD' ? '(USD)' : '(TL)'}</td>
                <td className="px-4 py-3 text-right">{t.orders}</td>
                <td className="px-4 py-3 text-right">{formatMoney(t.gross, t.currency)}</td>
                <td className="px-4 py-3 text-right text-red-300">{t.refunds ? `-${formatMoney(t.refunds, t.currency)}` : '—'}</td>
                <td className="px-4 py-3 text-right text-emerald-300">{formatMoney(t.net, t.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-neutral-500">Bu dönemde satış yok</p>}
      </div>
      <p className="text-xs text-neutral-500">
        Site satışları ödendiği andaki tutarla, ödeme tarihine göre sayılır; iade edilen ya da ödemeden sonra iptal edilen siparişler &quot;İade / iptal&quot; sütununa düşer.
        Etsy, pazaryeri ve kurumsal satışlar aşağıdan elle girilir.
      </p>

      <section className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5">
        <h2 className="text-lg font-semibold">Elle satış / iade ekle</h2>
        <p className="text-sm text-neutral-400">Etsy, Trendyol, Hepsiburada hakediş raporlarından ya da kurumsal faturadan gir. Tutar, alıcının ödediği toplam (brüt) tutardır.</p>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <input type="date" className={input} value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} />
          <select className={input} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            {CHANNEL_ORDER.filter((c) => c !== 'site').map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABEL[c]}
              </option>
            ))}
          </select>
          <select className={input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="sale">Satış</option>
            <option value="refund">İade</option>
          </select>
          <input className={input} type="number" min="0" step="0.01" placeholder="Tutar" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <select className={input} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option value="TRY">TL</option>
            <option value="USD">USD</option>
          </select>
          <input className={input} type="number" min="1" placeholder="Adet" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <input className={input} placeholder="Not (sipariş no, fatura no…)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <button
          className={`${btn} bg-cyan-500 text-neutral-950`}
          disabled={!form.amount}
          onClick={async () => {
            if (await call('revenue.manual.add', form)) {
              setForm({ ...form, amount: '', quantity: '1', note: '' })
              await load()
            }
          }}
        >
          Ekle
        </button>
        <div className="max-h-80 overflow-auto rounded-2xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-left text-neutral-400">
              <tr>
                <th className="px-3 py-2">Tarih</th>
                <th className="px-3 py-2">Kanal</th>
                <th className="px-3 py-2">Tür</th>
                <th className="px-3 py-2 text-right">Tutar</th>
                <th className="px-3 py-2 text-right">Adet</th>
                <th className="px-3 py-2">Not</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {manual.map((m) => (
                <tr key={m.id} className="border-t border-neutral-800">
                  <td className="px-3 py-2 text-neutral-400">{new Date(m.sale_date).toLocaleDateString('tr-TR')}</td>
                  <td className="px-3 py-2">{CHANNEL_LABEL[m.channel] || m.channel}</td>
                  <td className="px-3 py-2">{m.kind === 'refund' ? <span className="text-red-300">İade</span> : 'Satış'}</td>
                  <td className="px-3 py-2 text-right">{formatMoney(m.amount, m.currency)}</td>
                  <td className="px-3 py-2 text-right">{m.quantity}</td>
                  <td className="px-3 py-2 text-neutral-400">{m.note}</td>
                  <td className="px-3 py-2">
                    <button
                      className="text-red-400 hover:underline"
                      onClick={async () => window.confirm('Kayıt silinsin mi?') && (await call('revenue.manual.delete', { id: m.id })) && load()}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {manual.length === 0 && <p className="p-6 text-center text-neutral-500">Henüz elle girilmiş kayıt yok</p>}
        </div>
      </section>
    </div>
  )
}

function OrdersTab({ call }: { call: Caller }) {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    const data = await call<{ orders: AdminOrder[] }>('orders.list', { status: status || null, q })
    if (data) setOrders(data.orders)
  }, [call, q, status])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const update = async (orderNo: string, payload: Record<string, unknown>) => {
    if (await call('orders.update', { orderNo, ...payload })) await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select className={`${input} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tüm durumlar</option>
          {Object.entries(STATUS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <input className={`${input} max-w-xs`} placeholder="Sipariş no, e-posta, isim" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={`${btn} bg-neutral-800`} onClick={() => void load()}>
          ↻ Yenile
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-800">
        {orders.length === 0 && <p className="p-6 text-center text-neutral-500">Sipariş yok</p>}
        {orders.map((order) => (
          <div key={order.order_no} className="border-b border-neutral-800 last:border-0">
            <button
              className="grid w-full grid-cols-2 gap-2 px-4 py-3 text-left text-sm hover:bg-neutral-900 md:grid-cols-6"
              onClick={() => setOpen(open === order.order_no ? null : order.order_no)}
            >
              <span className="font-mono font-semibold">{order.order_no}</span>
              <span>{STATUS_LABEL[order.status] || order.status}</span>
              <span className="truncate">{order.full_name}</span>
              <span className="truncate text-neutral-400">{order.email}</span>
              <span className="font-semibold">{formatMoney(order.total, order.currency)}</span>
              <span className="text-neutral-400">
                {order.provider} · {new Date(order.created_at).toLocaleString('tr-TR')}
              </span>
            </button>
            {open === order.order_no && (
              <OrderDetail
                order={order}
                onUpdate={(payload) => update(order.order_no, payload)}
                onMarkPaid={async () => {
                  if (window.confirm('Ödeme alındı olarak işaretlensin mi? Dijital ürünler otomatik teslim edilir.')) {
                    if (await call('orders.markPaid', { orderNo: order.order_no })) await load()
                  }
                }}
                onDelete={async () => {
                  const ok = window.confirm(
                    `${order.order_no} KALICI olarak silinsin mi?\n\nSiparişle oluşturulan anı defteri QR'ları (misafir anılarıyla) silinir ve kullanılmamış dijital QR hakları hesaptan geri alınır. Bu işlem geri alınamaz.`
                  )
                  if (!ok) return
                  const result = await call<{ deletedQrs: number; credits: number; creditsRemoved: number; creditsAlreadyUsed: number }>('orders.delete', {
                    orderNo: order.order_no,
                  })
                  if (!result) return
                  const parts = [`Sipariş silindi.`]
                  if (result.deletedQrs) parts.push(`${result.deletedQrs} anı defteri QR'ı silindi.`)
                  if (result.credits) parts.push(`${result.creditsRemoved} / ${result.credits} QR hakkı geri alındı.`)
                  if (result.creditsAlreadyUsed)
                    parts.push(`${result.creditsAlreadyUsed} hak müşteri tarafından zaten kullanılmış; o QR'lar müşterinin hesabında duruyor.`)
                  window.alert(parts.join('\n'))
                  setOpen(null)
                  await load()
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function OrderDetail({
  order,
  onUpdate,
  onMarkPaid,
  onDelete,
}: {
  order: AdminOrder
  onUpdate: (p: Record<string, unknown>) => void
  onMarkPaid: () => void
  onDelete: () => void
}) {
  const deletable = ['cancelled', 'refunded', 'failed', 'pending', 'awaiting_transfer'].includes(order.status)
  const [tracking, setTracking] = useState(order.tracking_no)
  const [note, setNote] = useState(order.admin_note)
  return (
    <div className="grid gap-4 bg-neutral-950/60 px-4 py-4 text-sm md:grid-cols-3">
      <div className="space-y-1">
        <p className="font-semibold text-neutral-300">Ürünler</p>
        {order.items.map((item, index) => (
          <p key={index}>
            {item.quantity}× {item.name}
            {item.variantLabel ? ` (${item.variantLabel})` : ''}
          </p>
        ))}
        {order.customer_note && <p className="mt-2 text-amber-300">Not: {order.customer_note}</p>}
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-neutral-300">Müşteri</p>
        <p>{order.full_name}</p>
        <p>{order.phone}</p>
        <p>{order.email}</p>
        {order.address && (
          <p className="text-neutral-400">
            {order.address.line}, {order.address.district} / {order.address.city} {order.address.postalCode} {order.address.country}
          </p>
        )}
        <a className="text-cyan-300 hover:underline" href={`/order/${order.order_no}?key=${order.access_key}`} target="_blank" rel="noopener noreferrer">
          Müşteri sipariş sayfası ↗
        </a>
      </div>
      <div className="space-y-2">
        {(order.status === 'awaiting_transfer' || order.status === 'pending' || order.status === 'failed') && (
          <button className={`${btn} w-full bg-emerald-500 text-neutral-950`} onClick={onMarkPaid}>
            ✓ Ödeme alındı (havale onayı)
          </button>
        )}
        <div className="flex gap-2">
          <input className={input} placeholder="Kargo takip no" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          <button className={`${btn} bg-cyan-500 text-neutral-950`} onClick={() => onUpdate({ trackingNo: tracking, status: 'shipped' })}>
            Kargola
          </button>
        </div>
        <textarea className={`${input} min-h-16`} placeholder="Admin notu" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button className={`${btn} bg-neutral-800`} onClick={() => onUpdate({ adminNote: note })}>
            Notu kaydet
          </button>
          <button className={`${btn} bg-neutral-800`} onClick={() => onUpdate({ status: 'delivered' })}>
            Teslim edildi
          </button>
          <button className={`${btn} bg-neutral-800`} onClick={() => window.confirm('Sipariş iptal edilsin mi?') && onUpdate({ status: 'cancelled' })}>
            İptal
          </button>
          <button
            className={`${btn} bg-neutral-800`}
            onClick={() =>
              window.confirm('İade edildi olarak işaretlensin mi? (Para iadesini ödeme panelinden yapmalısın)') && onUpdate({ status: 'refunded' })
            }
          >
            İade
          </button>
        </div>
        {deletable ? (
          <button className={`${btn} w-full bg-red-700`} onClick={onDelete}>
            🗑 Siparişi ve QR&apos;larını sil
          </button>
        ) : (
          <p className="text-xs text-neutral-500">Silmek için önce İptal ya da İade olarak işaretle.</p>
        )}
      </div>
    </div>
  )
}

function EtsyTab({ call }: { call: Caller }) {
  const [rows, setRows] = useState<EtsyRow[]>([])
  const load = useCallback(async () => {
    const data = await call<{ activations: EtsyRow[] }>('etsy.list')
    if (data) setRows(data.activations)
  }, [call])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const update = async (id: string, status: string) => {
    if (await call('etsy.update', { id, status })) await load()
  }

  return (
    <div className="space-y-6">
      <EtsyOrdersPanel call={call} />
      <h2 className="text-lg font-semibold">Aktivasyonlar</h2>
      <p className="text-sm text-neutral-400">
        Sadece yukarıdaki listede olan siparişler aktive edilebilir. Şüpheli bir aktivasyonu <b>İptal ve sil</b>: QR tüm içeriğiyle kalıcı olarak silinir.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Etsy sipariş</th>
              <th className="px-3 py-2">E-posta</th>
              <th className="px-3 py-2">Ürün</th>
              <th className="px-3 py-2">QR</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-neutral-800">
                <td className="px-3 py-2 text-neutral-400">{new Date(row.created_at).toLocaleString('tr-TR')}</td>
                <td className="px-3 py-2 font-mono">{row.order_number}</td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">{row.product}</td>
                <td className="px-3 py-2 font-mono">
                  <a className="text-cyan-300 hover:underline" href={`/q/${row.slug}`} target="_blank" rel="noopener noreferrer">
                    {row.slug}
                  </a>
                  {row.is_claimed ? ' ✓' : ''}
                </td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="space-x-2 whitespace-nowrap px-3 py-2">
                  {row.status !== 'verified' && (
                    <button className={`${btn} bg-emerald-600`} onClick={() => update(row.id, 'verified')}>
                      Doğrula
                    </button>
                  )}
                  {row.status !== 'revoked' && (
                    <button
                      className={`${btn} bg-red-700`}
                      onClick={() => window.confirm('Aktivasyon iptal edilip QR tüm içeriğiyle KALICI olarak silinsin mi? Bu işlem geri alınamaz.') && update(row.id, 'revoked')}
                    >
                      İptal ve sil
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-neutral-500">Henüz Etsy aktivasyonu yok</p>}
      </div>
    </div>
  )
}

interface EtsyOrderRow {
  order_number: string
  quantity: number
  buyer_name: string
  sale_date: string
  used: number
}

/** Basit CSV ayrıştırıcı (tırnaklı alanlar ve "" kaçışı desteklenir). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',' || ch === ';' || ch === '\t') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim()))
}

/** Etsy "Sold Orders" CSV'si ya da satır başına "siparişNo[,adet]" listesi. */
function parseEtsyOrders(text: string) {
  const rows = parseCsv(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text)
  if (rows.length === 0) return []
  const header = rows[0].map((cell) => cell.trim().toLowerCase())
  const idCol = header.indexOf('order id')
  if (idCol >= 0) {
    const qtyCol = header.indexOf('number of items')
    const nameCol = header.indexOf('full name')
    const dateCol = header.indexOf('sale date')
    return rows.slice(1).map((r) => ({
      orderNumber: (r[idCol] || '').trim(),
      quantity: qtyCol >= 0 ? Number(r[qtyCol]) || 1 : 1,
      buyerName: nameCol >= 0 ? (r[nameCol] || '').trim() : '',
      saleDate: dateCol >= 0 ? (r[dateCol] || '').trim() : '',
    }))
  }
  return rows.map((r) => ({ orderNumber: (r[0] || '').replace(/[\s#]/g, ''), quantity: Number(r[1]) || 1, buyerName: '', saleDate: '' }))
}

function EtsyOrdersPanel({ call }: { call: Caller }) {
  const [orders, setOrders] = useState<EtsyOrderRow[]>([])
  const [text, setText] = useState('')
  const [info, setInfo] = useState<string | null>(null)

  const load = useCallback(async () => {
    const data = await call<{ orders: EtsyOrderRow[] }>('etsy.orders.list')
    if (data) setOrders(data.orders)
  }, [call])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const importOrders = async (raw: string) => {
    const parsed = parseEtsyOrders(raw)
    if (parsed.length === 0) {
      setInfo('Geçerli sipariş bulunamadı')
      return
    }
    const data = await call<{ imported: number; skipped: number }>('etsy.orders.import', { orders: parsed })
    if (data) {
      setInfo(`${data.imported} sipariş eklendi/güncellendi${data.skipped ? `, ${data.skipped} satır atlandı` : ''}`)
      setText('')
      await load()
    }
  }

  return (
    <section className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5">
      <h2 className="text-lg font-semibold">Etsy siparişleri</h2>
      <p className="text-sm text-neutral-400">
        Alıcılar sadece buradaki siparişleri aktive edebilir; her sipariş, ürün adedi kadar QR alır. Etsy → Shop Manager → Settings → Options → Download Data →
        <b> Orders</b> CSV&apos;sini yükle ya da her satıra bir sipariş numarası yaz (isteğe bağlı: <code>numara,adet</code>).
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        className="block text-sm text-neutral-400"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await importOrders(await file.text())
          e.target.value = ''
        }}
      />
      <textarea className={`${input} h-24 font-mono`} value={text} onChange={(e) => setText(e.target.value)} placeholder={'3123456789\n3123456790,2'} />
      <button className={`${btn} bg-cyan-500 text-neutral-950`} disabled={!text.trim()} onClick={() => importOrders(text)}>
        Listeye ekle
      </button>
      {info && <p className="text-sm text-emerald-400">{info}</p>}
      <div className="max-h-72 overflow-auto rounded-2xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-3 py-2">Sipariş</th>
              <th className="px-3 py-2">Alıcı</th>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Kullanılan</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_number} className="border-t border-neutral-800">
                <td className="px-3 py-2 font-mono">{order.order_number}</td>
                <td className="px-3 py-2">{order.buyer_name}</td>
                <td className="px-3 py-2 text-neutral-400">{order.sale_date}</td>
                <td className="px-3 py-2">
                  {order.used} / {order.quantity}
                </td>
                <td className="px-3 py-2">
                  <button
                    className="text-red-400 hover:underline"
                    onClick={async () =>
                      window.confirm(`${order.order_number} listeden silinsin mi? (Mevcut QR'lar etkilenmez)`) &&
                      (await call('etsy.orders.delete', { orderNumber: order.order_number })) &&
                      load()
                    }
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-neutral-500">Liste boş — hiçbir Etsy siparişi aktive edilemez</p>}
      </div>
    </section>
  )
}

function ProductionTab({ call }: { call: Caller }) {
  const [count, setCount] = useState(20)
  const [mode, setMode] = useState<'standard' | 'guestbook'>('standard')
  const [channel, setChannel] = useState('kolye')
  const [created, setCreated] = useState<Array<{ slug: string; qrUrl: string; nfcUrl: string }>>([])
  const [queue, setQueue] = useState<NfcRow[]>([])
  const [filterChannel, setFilterChannel] = useState('')
  const [lock, setLock] = useState(true)
  const [running, setRunning] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [nfcSupported, setNfcSupported] = useState(false)
  const stopRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setNfcSupported(isWebNfcSupported()))
    return () => window.cancelAnimationFrame(raf)
  }, [])

  const loadQueue = useCallback(async () => {
    const data = await call<{ items: NfcRow[] }>('nfc.list', { onlyPending: true, channel: filterChannel })
    if (data) setQueue(data.items)
  }, [call, filterChannel])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  const createBatch = async () => {
    const data = await call<{ created: Array<{ slug: string; qrUrl: string; nfcUrl: string }> }>('qr.batch', { count, mode, channel })
    if (data) {
      setCreated(data.created)
      await loadQueue()
    }
  }

  const downloadCsv = () => {
    const csv = ['slug,qr_url,nfc_url', ...created.map((row) => `${row.slug},${row.qrUrl},${row.nfcUrl}`)].join('\n')
    const href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = href
    link.download = `qrnot-${channel}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    setTimeout(() => URL.revokeObjectURL(href), 3000)
  }

  const runStation = async () => {
    setRunning(true)
    const pending = [...queue]
    for (const item of pending) {
      const controller = new AbortController()
      stopRef.current = controller
      setCurrent(item.slug)
      try {
        await writeUrlToTag(`${SITE}/n/${item.slug}`, { lock, signal: controller.signal })
        await call('nfc.mark', { slug: item.slug, locked: lock })
        setLog((prev) => [`✓ ${item.slug} yazıldı${lock ? ' + kilitlendi' : ''}`, ...prev])
        setQueue((prev) => prev.filter((row) => row.slug !== item.slug))
        if ('vibrate' in navigator) navigator.vibrate(120)
      } catch (err) {
        if (controller.signal.aborted) break
        setLog((prev) => [`✕ ${item.slug}: ${describeNfcError(err, 'tr')}`, ...prev])
        break
      }
    }
    setCurrent(null)
    setRunning(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5">
        <h2 className="text-lg font-semibold">1 · Toplu boş QR üret</h2>
        <p className="text-sm text-neutral-400">Kolye/anahtarlık üretimi için. Çıkan CSV&apos;yi lazer kazıma / baskı yazılımına ver.</p>
        <div className="grid grid-cols-3 gap-2">
          <input className={input} type="number" min={1} max={500} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} />
          <select className={input} value={mode} onChange={(e) => setMode(e.target.value as 'standard' | 'guestbook')}>
            <option value="standard">Standart</option>
            <option value="guestbook">Anı defteri</option>
          </select>
          <input className={input} value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="kanal (kolye, anahtarlik…)" />
        </div>
        <button className={`${btn} bg-cyan-500 text-neutral-950`} onClick={createBatch}>
          {count} QR üret
        </button>
        {created.length > 0 && (
          <div className="space-y-2">
            <button className={`${btn} bg-neutral-800`} onClick={downloadCsv}>
              ⬇ CSV indir ({created.length})
            </button>
            <div className="max-h-48 overflow-auto rounded-xl bg-neutral-900 p-3 font-mono text-xs text-neutral-300">
              {created.map((row) => (
                <p key={row.slug}>
                  {row.slug} · {row.qrUrl}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5">
        <h2 className="text-lg font-semibold">2 · NFC yazma istasyonu</h2>
        {!nfcSupported ? (
          <p className="rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-200">
            Bu sayfayı Android telefonda Chrome ile aç. Web NFC sadece Android Chrome&apos;da çalışır. Diğer cihazlarda listeyi NFC Tools ile yazıp aşağıdan
            elle işaretleyebilirsin.
          </p>
        ) : (
          <p className="text-sm text-neutral-400">Sıradaki etiketi telefona dokundur; yazılınca otomatik bir sonrakine geçer.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${input} max-w-[12rem]`} placeholder="kanal filtresi" value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} /> Yazınca kilitle
          </label>
          <button className={`${btn} bg-neutral-800`} onClick={() => void loadQueue()}>
            ↻
          </button>
        </div>
        <div className="flex gap-2">
          <button className={`${btn} bg-emerald-500 text-neutral-950`} disabled={!nfcSupported || running || queue.length === 0} onClick={runStation}>
            ▶ Başlat ({queue.length} bekliyor)
          </button>
          {running && (
            <button className={`${btn} bg-red-700`} onClick={() => stopRef.current?.abort()}>
              ■ Durdur
            </button>
          )}
        </div>
        {current && (
          <div className="rounded-2xl border border-emerald-700 bg-emerald-950/40 p-4 text-center">
            <p className="text-sm text-emerald-300">Etiketi dokundur</p>
            <p className="mt-1 font-mono text-3xl font-bold">{current}</p>
          </div>
        )}
        <div className="max-h-56 overflow-auto rounded-xl bg-neutral-900 p-3 text-xs">
          {queue.slice(0, 50).map((row) => (
            <div key={row.slug} className="flex items-center justify-between gap-2 py-1">
              <span className="font-mono">
                {row.slug}{' '}
                <span className="text-neutral-500">
                  {row.source_channel || ''} {row.qr_mode === 'guestbook' ? '📖' : ''}
                </span>
              </span>
              <button className="text-cyan-300 hover:underline" onClick={async () => (await call('nfc.mark', { slug: row.slug, locked: lock })) && loadQueue()}>
                elle işaretle
              </button>
            </div>
          ))}
        </div>
        {log.length > 0 && (
          <div className="max-h-40 overflow-auto rounded-xl bg-neutral-900 p-3 font-mono text-xs text-neutral-300">
            {log.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
