'use client'

import type { MsgKey } from '@/lib/dpp/i18n'
import { fieldLabelKey, groupLabelKey, optionLabelKey, SECTOR_FIELDS, SECTOR_GROUPS, type Sector, type SectorData, type SectorField, type SectorValue } from '@/lib/dpp/sectors'
import { useT } from './i18n'
import { Card, inputCls } from './ui'

// Sektöre özel pasaport alanları (batarya / tekstil / mobilya). Alanlar sectors.ts'teki tanımdan üretilir.

export function unitLabel(t: (k: MsgKey) => string, unit?: string) {
  if (!unit) return ''
  return unit === 'cycles' || unit === 'years' ? t(`su_${unit}` as MsgKey) : unit
}

export function optionLabel(t: (k: MsgKey) => string, option: string) {
  return option.length === 1 ? option : t(optionLabelKey(option) as MsgKey)
}

const TIER_STYLE = { interest: 'bg-violet-100 text-violet-800', authority: 'bg-amber-100 text-amber-900' } as const

export default function SectorEditor({ sector, value, onChange }: { sector: Sector; value: SectorData; onChange: (v: SectorData) => void }) {
  const { t, lang } = useT()
  const region = new Intl.DisplayNames([lang], { type: 'region' })
  const set = (key: string, v: SectorValue) => {
    const next = { ...value }
    if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) delete next[key]
    else next[key] = v
    onChange(next)
  }
  const batteryCategory = String(value.batteryCategory || '')

  const input = (f: SectorField) => {
    const v = value[f.key]
    const id = `sf-${f.key}`
    switch (f.type) {
      case 'longtext':
        return <textarea id={id} className={inputCls} rows={3} value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />
      case 'number':
        return (
          <div className="flex items-center gap-2">
            <input
              id={id}
              className={inputCls}
              inputMode="decimal"
              value={v === null || v === undefined ? '' : String(v)}
              onChange={(e) => set(f.key, e.target.value.trim() === '' ? null : Number(e.target.value.replace(',', '.')))}
            />
            {f.unit && <span className="shrink-0 text-sm text-slate-500">{unitLabel(t, f.unit)}</span>}
          </div>
        )
      case 'select':
        return (
          <select id={id} className={inputCls} value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value || null)}>
            <option value="">—</option>
            {f.options?.map((o) => (
              <option key={o} value={o}>
                {optionLabel(t, o)}
              </option>
            ))}
          </select>
        )
      case 'multi': {
        const list = Array.isArray(v) ? v : []
        return (
          <div className="flex flex-wrap gap-2">
            {f.options?.map((o) => (
              <label key={o} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm">
                <input type="checkbox" checked={list.includes(o)} onChange={(e) => set(f.key, e.target.checked ? [...list, o] : list.filter((x) => x !== o))} />
                {optionLabel(t, o)}
              </label>
            ))}
          </div>
        )
      }
      case 'country': {
        const code = String(v ?? '')
        return (
          <div className="flex items-center gap-2">
            <input
              id={id}
              className={`${inputCls} w-20 font-mono uppercase`}
              dir="ltr"
              maxLength={2}
              value={code}
              title={t('iso_hint')}
              onChange={(e) => set(f.key, e.target.value.toUpperCase().replace(/[^A-Z]/g, '') || null)}
            />
            {code.length === 2 && <span className="text-sm text-slate-600">{region.of(code)}</span>}
          </div>
        )
      }
      case 'url':
        return <input id={id} className={inputCls} type="url" dir="ltr" placeholder="https://" value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />
      default:
        return <input id={id} className={inputCls} value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />
    }
  }

  return (
    <div className="space-y-5">
      <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-950">{t(`sec_intro_${sector}` as MsgKey)}</p>
      {SECTOR_GROUPS[sector].map((group) => {
        const fields = SECTOR_FIELDS[sector].filter((f) => f.group === group)
        return (
          <Card key={group} title={t(groupLabelKey(sector, group) as MsgKey)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const dimmed = f.onlyFor && batteryCategory && !f.onlyFor.includes(batteryCategory)
                return (
                  <div key={f.key} className={`${f.type === 'longtext' || f.type === 'multi' ? 'sm:col-span-2' : ''} ${dimmed ? 'opacity-50' : ''}`}>
                    <label htmlFor={`sf-${f.key}`} className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-600">
                      <span>
                        {t(fieldLabelKey(sector, f.key) as MsgKey)}
                        {f.required && <span className="text-red-600" title={t('sec_required')}> *</span>}
                      </span>
                      {f.tier !== 'public' && <span className={`rounded-full px-2 py-0.5 text-[10px] ${TIER_STYLE[f.tier]}`}>{t(`tier_${f.tier}` as MsgKey)}</span>}
                      {f.ref && (
                        <span className="font-mono text-[10px] font-normal text-slate-400" dir="ltr">
                          {f.ref}
                        </span>
                      )}
                    </label>
                    {input(f)}
                    {f.deferred && <p className="mt-1 text-xs text-amber-700">{t('sec_deferred')}</p>}
                    {f.onlyFor?.includes('ev') && <p className="mt-1 text-xs text-slate-500">{t('sec_only_ev')}</p>}
                  </div>
                )
              })}
            </div>
            {sector === 'battery' && group === 'interest' && <p className="mt-4 text-xs text-slate-500">{t('sec_test_reports')}</p>}
          </Card>
        )
      })}
    </div>
  )
}
