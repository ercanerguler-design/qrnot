'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatMoney, type Currency } from '@/lib/commerce/catalog'
import { btn, PROVIDER_LABEL, STATUS_LABEL, type Caller } from './ShopTabs'

// Genel bakış: admin açılınca ilk görülen ekran. Bekleyen işler, bu ayın geliri, temel sayılar, son hareketler.

interface Dashboard {
  todo: Record<string, number>
  counts: { users: number; premium: number; claimed: number; blank: number; plays: number; scans7: number; entries7: number; etsy7: number }
  month: { from: string; to: string; netTRY: number; netUSD: number; orders: number }
  recentOrders: Array<{ order_no: string; status: string; provider: string; currency: Currency; total: number; full_name: string; created_at: string }>
  recentEvents: Array<{ kind: string; created_at: string; slug: string; title: string }>
}

export type Go = (tab: string, opts?: { status?: string }) => void

const EVENT_LABEL: Record<string, string> = {
  found: '📍 Kayıp eşya bulundu bildirimi',
  reply: '↩️ Hediyeye cevap bırakıldı',
  group: '👨‍👩‍👧 Grup hediyesine mesaj eklendi',
}

const number = new Intl.NumberFormat('tr-TR')

export function HomeTab({ call, go }: { call: Caller; go: Go }) {
  const [data, setData] = useState<Dashboard | null>(null)

  const load = useCallback(async () => {
    const res = await call<Dashboard>('dashboard')
    if (res) setData(res)
  }, [call])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (!data) return <p className="text-neutral-500">Yükleniyor…</p>

  const toShip = data.todo.paid || 0
  const toConfirm = data.todo.awaiting_transfer || 0
  const monthName = new Date(`${data.month.to}T12:00:00`).toLocaleDateString('tr-TR', { month: 'long' })

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5">
          <h2 className="font-semibold">Yapılacaklar</h2>
          <div className="mt-3 space-y-2">
            {toShip > 0 && (
              <button
                className="flex w-full items-center justify-between rounded-2xl border border-cyan-700 bg-cyan-500/10 px-4 py-3 text-left hover:bg-cyan-500/20"
                onClick={() => go('orders', { status: 'paid' })}
              >
                <span>
                  📦 <b>{toShip}</b> sipariş kargolanmayı bekliyor
                </span>
                <span className="text-cyan-300">Aç →</span>
              </button>
            )}
            {toConfirm > 0 && (
              <button
                className="flex w-full items-center justify-between rounded-2xl border border-amber-700 bg-amber-500/10 px-4 py-3 text-left hover:bg-amber-500/20"
                onClick={() => go('orders', { status: 'awaiting_transfer' })}
              >
                <span>
                  🏦 <b>{toConfirm}</b> havale onayı bekliyor
                </span>
                <span className="text-amber-300">Aç →</span>
              </button>
            )}
            {toShip === 0 && toConfirm === 0 && <p className="rounded-2xl border border-emerald-800 bg-emerald-500/10 px-4 py-3 text-emerald-300">✓ Bekleyen iş yok</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={`${btn} bg-neutral-800`} onClick={() => go('production')}>
              🏭 Ürün QR&apos;ı üret
            </button>
            <button className={`${btn} bg-neutral-800`} onClick={() => go('etsy')}>
              🧡 Etsy siparişi yükle
            </button>
            <button className={`${btn} bg-neutral-800`} onClick={() => go('revenue')}>
              ✍️ Pazaryeri satışı gir
            </button>
          </div>
        </div>

        <button className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 p-5 text-left hover:border-emerald-700" onClick={() => go('revenue')}>
          <p className="text-sm text-neutral-400">Net satış · {monthName}</p>
          <p className="mt-2 text-4xl font-bold text-emerald-300">{formatMoney(data.month.netTRY, 'TRY')}</p>
          {data.month.netUSD > 0 && <p className="mt-1 text-xl font-semibold text-emerald-200">+ {formatMoney(data.month.netUSD, 'USD')}</p>}
          <p className="mt-3 text-sm text-neutral-400">{data.month.orders} satış · iadeler düşülmüş · tüm kanallar</p>
          <p className="mt-3 text-sm text-emerald-300">Gelir tablosu →</p>
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ['Kullanıcı', data.counts.users, 'users'],
            ['⭐ Premium üye', data.counts.premium, 'users'],
            ['Aktif QR', data.counts.claimed, 'qrs'],
            ['Boş QR stoğu', data.counts.blank, 'qrs'],
            ['Toplam dinlenme', data.counts.plays, 'qrs'],
            ['Okutma · son 7 gün', data.counts.scans7, 'qrs'],
            ['Anı defteri · son 7 gün', data.counts.entries7, 'qrs'],
            ['Etsy aktivasyonu · 7 gün', data.counts.etsy7, 'etsy'],
          ] as const
        ).map(([label, value, tab]) => (
          <button key={label} className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 text-left hover:border-neutral-600" onClick={() => go(tab)}>
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{number.format(value)}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Son siparişler</h2>
            <button className="text-sm text-cyan-300 hover:underline" onClick={() => go('orders')}>
              Tümü →
            </button>
          </div>
          {data.recentOrders.length === 0 && <p className="text-sm text-neutral-500">Henüz sipariş yok</p>}
          <div className="divide-y divide-neutral-800 text-sm">
            {data.recentOrders.map((o) => (
              <div key={o.order_no} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">
                  <span className="font-mono">{o.order_no}</span> <span className="text-neutral-400">· {o.full_name}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="font-semibold">{formatMoney(o.total, o.currency)}</span>
                  <span className="block text-xs text-neutral-500">
                    {PROVIDER_LABEL[o.provider] || o.provider} · {STATUS_LABEL[o.status] || o.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5">
          <h2 className="mb-3 font-semibold">Müşteri hareketleri</h2>
          {data.recentEvents.length === 0 && <p className="text-sm text-neutral-500">Henüz cevap, grup mesajı ya da kayıp bildirimi yok</p>}
          <div className="divide-y divide-neutral-800 text-sm">
            {data.recentEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">
                  {EVENT_LABEL[e.kind] || e.kind}{' '}
                  <a className="font-mono text-cyan-300 hover:underline" href={`/q/${e.slug}`} target="_blank" rel="noopener noreferrer">
                    {e.slug}
                  </a>
                </span>
                <span className="shrink-0 text-xs text-neutral-500">{new Date(e.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
