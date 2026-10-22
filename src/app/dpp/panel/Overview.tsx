'use client'

import { useEffect, useState } from 'react'
import type { Me, View } from './PanelApp'
import { Alert, api, Button, Card } from './ui'

interface OverviewData {
  counts: { published: number; draft: number; archived: number; items: number; scans30: number }
  daily: Array<{ day: string; scans: number }>
  top: Array<{ id: string; name: string; scans: number }>
  countries: Array<{ country: string; scans: number }>
  plan: { plan: string; product_limit: number }
}

const PLAN_LABEL: Record<string, string> = { pilot: 'Pilot', starter: 'Başlangıç', business: 'İşletme', enterprise: 'Kurumsal' }

export default function Overview({ go, me }: { go: (v: View) => void; me: Me }) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<OverviewData>('overview')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-slate-500">Yükleniyor…</p>

  const used = data.counts.published + data.counts.draft
  const max = Math.max(1, ...data.daily.map((d) => d.scans))
  const region = new Intl.DisplayNames(['tr'], { type: 'region' })
  const canEdit = me.role !== 'viewer'
  const steps = [
    { done: used > 0, label: 'İlk ürün pasaportunu oluştur', action: () => go({ page: 'product', id: null }) },
    { done: data.counts.published > 0, label: 'Pasaportu yayınla', action: () => go({ page: 'products' }) },
    { done: data.counts.items > 0, label: 'Seri numarası üret ve QR etiketlerini indir', action: () => go({ page: 'products' }) },
    { done: data.counts.scans30 > 0, label: 'Etiketi ürüne uygula, ilk okutmayı gör', action: undefined },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Genel bakış</h1>
          <p className="text-sm text-slate-500">Son 30 günün pasaport okutmaları ve ürün durumu</p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={() => go({ page: 'product', id: null })}>
            ＋ Yeni ürün pasaportu
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Yayında', data.counts.published, 'text-emerald-700'],
          ['Taslak', data.counts.draft, 'text-slate-800'],
          ['Arşivde', data.counts.archived, 'text-amber-700'],
          ['Seri numaralı ürün', data.counts.items, 'text-sky-800'],
          ['Okutma · 30 gün', data.counts.scans30, 'text-[#0f3d5e]'],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${cls}`}>{Number(value).toLocaleString('tr-TR')}</p>
          </div>
        ))}
      </div>

      {steps.some((s) => !s.done) && (
        <Card title="Başlangıç adımları" subtitle="Pasaportlarını yayına almak için 4 adım">
          <ol className="grid gap-2 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.label} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${s.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${s.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {s.done ? '✓' : i + 1}
                </span>
                <span className={`flex-1 ${s.done ? 'text-emerald-900' : ''}`}>{s.label}</span>
                {!s.done && s.action && canEdit && (
                  <button type="button" className="text-xs font-semibold text-sky-700 hover:underline" onClick={s.action}>
                    Başla →
                  </button>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card title="Günlük okutma" subtitle="Son 30 gün">
          <div className="flex h-40 items-end gap-[3px]">
            {data.daily.map((d) => (
              <div key={d.day} className="group relative flex-1">
                <div className="w-full rounded-t bg-[#2f7fb3]/80 transition group-hover:bg-[#0f3d5e]" style={{ height: `${Math.max(2, (d.scans / max) * 150)}px` }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                  {new Date(d.day).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}: {d.scans}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>{data.daily[0] && new Date(data.daily[0].day).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
            <span>Bugün</span>
          </div>
        </Card>

        <Card title="Paket kullanımı">
          <p className="text-sm text-slate-500">{PLAN_LABEL[data.plan.plan] || data.plan.plan} paketi</p>
          <p className="mt-2 text-3xl font-bold">
            {used} <span className="text-base font-medium text-slate-400">/ {data.plan.product_limit.toLocaleString('tr-TR')} ürün</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#0f3d5e]" style={{ width: `${Math.min(100, (used / data.plan.product_limit) * 100)}%` }} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Arşivdeki ürünler sınıra dahil değildir. Paket yükseltmek için QRNot ile iletişime geç.</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="En çok okutulan ürünler">
          {data.top.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz okutma yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.top.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => go({ page: 'product', id: t.id })} className="flex w-full items-center justify-between py-2 text-left text-sm hover:text-sky-700">
                    <span className="truncate">{t.name}</span>
                    <span className="font-semibold tabular-nums">{t.scans}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Okutulan ülkeler">
          {data.countries.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz okutma yok.</p>
          ) : (
            <ul className="space-y-2">
              {data.countries.map((c) => {
                let name = c.country
                try {
                  name = region.of(c.country) || c.country
                } catch {}
                return (
                  <li key={c.country} className="text-sm">
                    <div className="flex justify-between">
                      <span>{name}</span>
                      <span className="font-semibold tabular-nums">{c.scans}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(c.scans / data.countries[0].scans) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
