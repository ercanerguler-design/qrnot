'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Fragment, useCallback, useEffect, useState } from 'react'
import type { MsgKey } from '@/lib/dpp/i18n'
import { BATTERY_ITEM_FIELDS, fieldLabelKey, type SectorData } from '@/lib/dpp/sectors'
import { useT } from './i18n'
import { optionLabel, unitLabel } from './SectorEditor'
import { Alert, api, Button, Card, csvCell, downloadText, Field, inputCls } from './ui'

// Tekil ürün pasaportları: seri numarası üretimi, liste, CSV dışa aktarma ve QR etiket baskısı.

interface Item {
  id: string
  public_id: string
  serial: string
  batch: string
  production_date: string | null
  created_at: string
  scans: number
  dynamic: SectorData
  dynamic_updated_at: string | null
}

interface ExportRow {
  serial: string
  batch: string
  productionDate: string
  url: string
  digitalLink: string
}

const PAGE = 200
const LABEL_SIZES = [25, 30, 40, 50] as const
type LabelSize = (typeof LABEL_SIZES)[number]
const MAX_PRINT = 600

export default function ItemsPanel({
  productId,
  productName,
  gtin,
  published,
  readOnly,
  battery = false,
  onChange,
}: {
  productId: string
  productName: string
  gtin: string
  published: boolean
  readOnly: boolean
  /** Batarya: her pilin değişen verileri (Pil Tüzüğü Ek XIII nokta 4) */
  battery?: boolean
  onChange: () => Promise<void>
}) {
  const { t, date, number } = useT()
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({ count: '100', prefix: '', start: '1', batch: '', productionDate: '' })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [labels, setLabels] = useState<ExportRow[] | null>(null)
  const [labelSize, setLabelSize] = useState<LabelSize>(30)
  const [useDigitalLink, setUseDigitalLink] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [dyn, setDyn] = useState<SectorData>({})

  const load = useCallback(
    async (offset = 0) => {
      const res = await api<{ items: Item[]; total: number }>('items.list', { productId, q, limit: PAGE, offset })
      setItems((cur) => (offset ? [...cur, ...res.items] : res.items))
      setTotal(res.total)
    },
    [productId, q]
  )

  useEffect(() => {
    const id = setTimeout(() => void load().catch((err) => setError(err.message)), 250)
    return () => clearTimeout(id)
  }, [load])

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(label)
    setError(null)
    setInfo(null)
    try {
      await task()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_generic'))
    } finally {
      setBusy(null)
    }
  }

  const fetchAll = async () => (await api<{ items: ExportRow[] }>('items.export', { productId })).items
  const startNo = Number(form.start) || 1
  const countNo = Number(form.count) || 0

  return (
    <div className="space-y-5">
      <Alert tone="info">{t('it_info')}</Alert>
      {!published && <Alert tone="warn">{t('it_unpublished')}</Alert>}
      {error && <Alert>{error}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}

      {!readOnly && (
        <Card title={t('it_gen_title')} subtitle={t('it_gen_sub')}>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Field label={t('f_count')}>
              <input className={inputCls} inputMode="numeric" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label={t('f_prefix')} hint={t('hint_prefix')}>
              <input className={`${inputCls} font-mono uppercase`} dir="ltr" maxLength={16} value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })} />
            </Field>
            <Field label={t('f_start')}>
              <input className={inputCls} inputMode="numeric" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label={t('f_batch')}>
              <input className={inputCls} maxLength={40} value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
            </Field>
            <Field label={t('f_prod_date')}>
              <input className={inputCls} type="date" value={form.productionDate} onChange={(e) => setForm({ ...form, productionDate: e.target.value })} />
            </Field>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {t('it_example')}{' '}
            <span className="font-mono" dir="ltr">
              {form.prefix}
              {String(startNo).padStart(Math.max(6, String(startNo + Math.max(1, countNo) - 1).length), '0')} …
            </span>
          </p>
          <Button
            variant="primary"
            className="mt-3"
            disabled={busy !== null || !countNo}
            onClick={() =>
              void run('gen', async () => {
                const res = await api<{ created: number; skipped: number }>('items.generate', { productId, ...form, count: countNo, start: startNo })
                setInfo([t('it_generated', { n: number(res.created) }), res.skipped ? t('it_existing', { n: number(res.skipped) }) : ''].filter(Boolean).join(' '))
                setForm((f) => ({ ...f, start: String((Number(f.start) || 1) + Number(f.count)) }))
                await load()
                await onChange()
              })
            }
          >
            {busy === 'gen' ? t('it_gen_busy') : t('it_gen_btn', { n: number(countNo) })}
          </Button>
        </Card>
      )}

      {battery && !readOnly && (
        <Card title={t('it_dyn_title')} subtitle={t('it_dyn_sub')}>
          <p className="text-xs text-slate-500" dir="ltr">
            {t('it_dyn_import_hint')}
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            📄 {t('it_dyn_import')}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={busy !== null}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file)
                  return
                void run('dynimport', async () => {
                  const rows = parseCsv(await file.text())
                  const res = await api<{ updated: number; errors: string[] }>('items.dynamicImport', { productId, rows })
                  setInfo([t('it_dyn_import_done', { n: number(res.updated) }), ...res.errors].join(' · '))
                  await load()
                })
              }}
            />
          </label>
        </Card>
      )}

      <Card
        title={t('it_list_title', { n: number(total) })}
        actions={
          <>
            <Button
              size="sm"
              disabled={busy !== null || total === 0}
              onClick={() =>
                void run('csv', async () => {
                  const rows = await fetchAll()
                  const header = [t('csv_serial'), t('csv_batch'), t('csv_production_date'), t('csv_url'), 'GS1 Digital Link']
                  downloadText(
                    `dpp-serials-${new Date().toISOString().slice(0, 10)}.csv`,
                    [header.map(csvCell).join(';'), ...rows.map((r) => [r.serial, r.batch, r.productionDate, r.url, r.digitalLink].map(csvCell).join(';'))].join('\n')
                  )
                })
              }
            >
              {t('it_csv')}
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={busy !== null || total === 0}
              onClick={() =>
                void run('labels', async () => {
                  const rows = await fetchAll()
                  const chosen = selected.size ? rows.filter((r) => items.some((i) => selected.has(i.id) && i.serial === r.serial)) : rows
                  setLabels(chosen.slice(0, MAX_PRINT))
                })
              }
            >
              {t('it_labels')} {selected.size ? t('it_selected', { n: selected.size }) : ''}
            </Button>
          </>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input className={`${inputCls} max-w-xs`} placeholder={t('ph_item_search')} value={q} onChange={(e) => setQ(e.target.value)} />
          {!readOnly && selected.size > 0 && (
            <Button
              size="sm"
              variant="danger"
              disabled={busy !== null}
              onClick={() =>
                void run('del', async () => {
                  if (!window.confirm(t('it_confirm_delete', { n: selected.size }))) return
                  const res = await api<{ deleted: number }>('items.delete', { productId, ids: [...selected] })
                  setSelected(new Set())
                  setInfo(t('it_deleted', { n: res.deleted }))
                  await load()
                  await onChange()
                })
              }
            >
              {t('it_delete_selected', { n: selected.size })}
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">{total === 0 ? t('it_none') : t('it_no_match')}</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-10 px-5 py-2 text-start">
                    <input
                      type="checkbox"
                      aria-label={t('select_all')}
                      checked={items.length > 0 && items.every((i) => selected.has(i.id))}
                      onChange={(e) => setSelected(e.target.checked ? new Set(items.map((i) => i.id)) : new Set())}
                    />
                  </th>
                  <th className="px-3 py-2 text-start">{t('th_serials')}</th>
                  <th className="px-3 py-2 text-start">{t('th_batch')}</th>
                  <th className="px-3 py-2 text-start">{t('th_production')}</th>
                  <th className="px-3 py-2 text-end">{t('th_scans')}</th>
                  {battery && <th className="px-3 py-2 text-start">{t('it_dyn_edit')}</th>}
                  <th className="px-5 py-2 text-end">{t('th_passport')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => (
                  <Fragment key={i.id}>
                  <tr>
                    <td className="px-5 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(i.id)}
                        onChange={(e) =>
                          setSelected((cur) => {
                            const next = new Set(cur)
                            if (e.target.checked) next.add(i.id)
                            else next.delete(i.id)
                            return next
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 font-mono" dir="ltr">
                      {i.serial}
                    </td>
                    <td className="px-3 py-2">{i.batch || '—'}</td>
                    <td className="px-3 py-2">{date(i.production_date)}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{number(i.scans)}</td>
                    {battery && (
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-sky-700 hover:underline"
                          onClick={() => {
                            setEditing(editing === i.id ? null : i.id)
                            setDyn(i.dynamic || {})
                          }}
                        >
                          {i.dynamic?.stateOfHealthPct !== undefined ? `SoH ${i.dynamic.stateOfHealthPct}%` : '—'}
                          {i.dynamic?.status ? ` · ${optionLabel(t, String(i.dynamic.status))}` : ''} ✎
                        </button>
                      </td>
                    )}
                    <td className="px-5 py-2 text-end">
                      <a href={`/p/${i.public_id}`} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline" dir="ltr">
                        /p/{i.public_id} ↗
                      </a>
                    </td>
                  </tr>
                  {battery && editing === i.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          {BATTERY_ITEM_FIELDS.map((fd) => (
                            <label key={fd.key} className={`block text-xs font-semibold text-slate-600 ${fd.type === 'longtext' ? 'sm:col-span-3' : ''}`}>
                              {t(fieldLabelKey('item', fd.key) as MsgKey)}
                              {fd.unit ? ` (${unitLabel(t, fd.unit)})` : ''}
                              {fd.type === 'select' ? (
                                <select className={`${inputCls} mt-1`} disabled={readOnly} value={String(dyn[fd.key] ?? '')} onChange={(e) => setDyn({ ...dyn, [fd.key]: e.target.value || null })}>
                                  <option value="">—</option>
                                  {fd.options?.map((o) => (
                                    <option key={o} value={o}>
                                      {optionLabel(t, o)}
                                    </option>
                                  ))}
                                </select>
                              ) : fd.type === 'longtext' ? (
                                <textarea className={`${inputCls} mt-1`} rows={2} disabled={readOnly} value={String(dyn[fd.key] ?? '')} onChange={(e) => setDyn({ ...dyn, [fd.key]: e.target.value })} />
                              ) : (
                                <input
                                  className={`${inputCls} mt-1`}
                                  inputMode="decimal"
                                  disabled={readOnly}
                                  value={dyn[fd.key] === null || dyn[fd.key] === undefined ? '' : String(dyn[fd.key])}
                                  onChange={(e) => setDyn({ ...dyn, [fd.key]: e.target.value })}
                                />
                              )}
                            </label>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {!readOnly && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={busy !== null}
                              onClick={() =>
                                void run('dyn', async () => {
                                  const res = await api<{ dynamic: SectorData; dynamic_updated_at: string }>('items.dynamic', { productId, itemId: i.id, dynamic: dyn })
                                  setItems((cur) => cur.map((x) => (x.id === i.id ? { ...x, dynamic: res.dynamic, dynamic_updated_at: res.dynamic_updated_at } : x)))
                                  setInfo(t('it_dyn_saved'))
                                  setEditing(null)
                                })
                              }
                            >
                              {t('it_dyn_save')}
                            </Button>
                          )}
                          {i.dynamic_updated_at && <span className="text-xs text-slate-500">{t('it_dyn_updated', { d: date(i.dynamic_updated_at, true) })}</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {items.length < total && (
          <Button className="mt-3 w-full" onClick={() => void load(items.length)}>
            {t('more', { n: number(total - items.length) })}
          </Button>
        )}
      </Card>

      {labels && (
        <div className="fixed inset-0 z-50 overflow-auto bg-slate-900/60 p-4 print:static print:bg-white print:p-0">
          <style>{`@media print { body * { visibility: hidden !important; } #dpp-labels, #dpp-labels * { visibility: visible !important; } #dpp-labels { position: absolute; inset: 0; } @page { margin: 8mm; } }`}</style>
          <div className="mx-auto max-w-5xl rounded-2xl bg-white p-5 print:max-w-none print:rounded-none print:p-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h3 className="font-semibold">{t('lb_title', { n: number(labels.length) })}</h3>
                {total > MAX_PRINT && !selected.size && <p className="text-xs text-amber-700">{t('lb_limit', { n: MAX_PRINT })}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select className={`${inputCls} w-auto`} value={labelSize} onChange={(e) => setLabelSize(Number(e.target.value) as LabelSize)}>
                  {LABEL_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {t('lb_size', { s: `${s} mm` })}
                    </option>
                  ))}
                </select>
                {gtin && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={useDigitalLink} onChange={(e) => setUseDigitalLink(e.target.checked)} /> GS1 Digital Link
                  </label>
                )}
                <Button variant="primary" onClick={() => window.print()}>
                  {t('lb_print')}
                </Button>
                <Button onClick={() => setLabels(null)}>{t('close')}</Button>
              </div>
            </div>
            <div id="dpp-labels" className="flex flex-wrap gap-[3mm]" dir="ltr">
              {labels.map((r) => (
                <div key={r.serial} className="flex flex-col items-center border border-dashed border-slate-300 p-[2mm] text-center" style={{ width: `${labelSize + 6}mm`, breakInside: 'avoid' }}>
                  <QRCodeSVG value={useDigitalLink && r.digitalLink ? r.digitalLink : r.url} level="M" marginSize={0} style={{ width: `${labelSize}mm`, height: `${labelSize}mm` }} />
                  <p className="mt-[1mm] w-full truncate font-mono leading-tight" style={{ fontSize: labelSize >= 40 ? '9pt' : '7pt' }}>
                    {r.serial}
                  </p>
                  {labelSize >= 40 && (
                    <p className="w-full truncate leading-tight text-slate-600" style={{ fontSize: '7pt' }}>
                      {productName}
                    </p>
                  )}
                  <p className="leading-tight text-slate-500" style={{ fontSize: '6pt' }}>
                    DPP
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Basit CSV ayrıştırıcı: ; ya da , ayraçlı, ilk satır başlık; tırnaklı hücreleri destekler. */
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ','
  const split = (line: string) => {
    const out: string[] = []
    let cur = ''
    let quoted = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"'
          i++
        } else quoted = !quoted
      } else if (ch === sep && !quoted) {
        out.push(cur)
        cur = ''
      } else cur += ch
    }
    out.push(cur)
    return out.map((c) => c.trim())
  }
  const header = split(lines[0])
  return lines.slice(1, 5001).map((line) => {
    const cells = split(line)
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']))
  })
}
