'use client'

import { useEffect, useState } from 'react'
import type { MsgKey } from '@/lib/dpp/i18n'
import { useT } from './i18n'
import type { Me, View } from './PanelApp'
import { Alert, api, Button, Card } from './ui'

interface OverviewData {
  counts: { published: number; draft: number; archived: number; items: number; scans30: number }
  daily: Array<{ day: string; scans: number }>
  top: Array<{ id: string; name: string; scans: number }>
  countries: Array<{ country: string; scans: number }>
  plan: { plan: string; product_limit: number }
}

export default function Overview({ go, me }: { go: (v: View) => void; me: Me }) {
  const { t, lang, locale, number } = useT()
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<OverviewData>('overview')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-slate-500">{t('loading')}</p>

  const used = data.counts.published + data.counts.draft
  const max = Math.max(1, ...data.daily.map((d) => d.scans))
  const region = new Intl.DisplayNames([lang], { type: 'region' })
  const canEdit = me.role !== 'viewer'
  const shortDay = (d: string) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  const planKey = `plan_${data.plan.plan}` as MsgKey
  const steps: Array<{ done: boolean; label: MsgKey; action?: () => void }> = [
    { done: used > 0, label: 'ov_step1', action: () => go({ page: 'product', id: null }) },
    { done: data.counts.published > 0, label: 'ov_step2', action: () => go({ page: 'products' }) },
    { done: data.counts.items > 0, label: 'ov_step3', action: () => go({ page: 'products' }) },
    { done: data.counts.scans30 > 0, label: 'ov_step4' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav_overview')}</h1>
          <p className="text-sm text-slate-500">{t('ov_sub')}</p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={() => go({ page: 'product', id: null })}>
            {t('ov_new')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(
          [
            [t('st_published'), data.counts.published, 'text-emerald-700'],
            [t('st_draft'), data.counts.draft, 'text-slate-800'],
            [t('st_archived'), data.counts.archived, 'text-amber-700'],
            [t('ov_items'), data.counts.items, 'text-sky-800'],
            [t('ov_scans30'), data.counts.scans30, 'text-[#0f3d5e]'],
          ] as const
        ).map(([label, value, cls]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${cls}`}>{number(Number(value))}</p>
          </div>
        ))}
      </div>

      {steps.some((s) => !s.done) && (
        <Card title={t('ov_steps_title')} subtitle={t('ov_steps_sub')}>
          <ol className="grid gap-2 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.label} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${s.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${s.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {s.done ? '✓' : i + 1}
                </span>
                <span className={`flex-1 ${s.done ? 'text-emerald-900' : ''}`}>{t(s.label)}</span>
                {!s.done && s.action && canEdit && (
                  <button type="button" className="text-xs font-semibold text-sky-700 hover:underline" onClick={s.action}>
                    {t('ov_start')}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card title={t('ov_daily')} subtitle={t('ov_last30')}>
          <div className="flex h-40 items-end gap-[3px]" dir="ltr">
            {data.daily.map((d) => (
              <div key={d.day} className="group relative flex-1">
                <div className="w-full rounded-t bg-[#2f7fb3]/80 transition group-hover:bg-[#0f3d5e]" style={{ height: `${Math.max(2, (d.scans / max) * 150)}px` }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                  {shortDay(d.day)}: {d.scans}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400" dir="ltr">
            <span>{data.daily[0] && shortDay(data.daily[0].day)}</span>
            <span>{t('today')}</span>
          </div>
        </Card>

        <Card title={t('ov_plan_usage')}>
          <p className="text-sm text-slate-500">{t('ov_plan_name', { plan: t(planKey) })}</p>
          <p className="mt-2 text-3xl font-bold">
            {number(used)} <span className="text-base font-medium text-slate-400">{t('ov_plan_of', { n: number(data.plan.product_limit) })}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#0f3d5e]" style={{ width: `${Math.min(100, (used / data.plan.product_limit) * 100)}%` }} />
          </div>
          <p className="mt-3 text-xs text-slate-500">{t('ov_plan_note')}</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={t('ov_top')}>
          {data.top.length === 0 ? (
            <p className="text-sm text-slate-500">{t('ov_no_scans')}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.top.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => go({ page: 'product', id: p.id })} className="flex w-full items-center justify-between gap-3 py-2 text-start text-sm hover:text-sky-700">
                    <span className="truncate">{p.name}</span>
                    <span className="font-semibold tabular-nums">{number(p.scans)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={t('ov_countries')}>
          {data.countries.length === 0 ? (
            <p className="text-sm text-slate-500">{t('ov_no_scans')}</p>
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
                      <span className="font-semibold tabular-nums">{number(c.scans)}</span>
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
