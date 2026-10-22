'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DPP_CATEGORIES, readTextsMap, type DppCategory, type DppLang } from '@/lib/dpp/types'
import { useT } from './i18n'
import type { Me, View } from './PanelApp'
import { Alert, api, Button, Card, csvCell, downloadText, Empty, inputCls, StatusBadge } from './ui'

interface Row {
  id: string
  public_id: string
  status: string
  default_lang: DppLang
  texts: unknown
  data: { brand?: string; model?: string; gtin?: string; category?: DppCategory }
  has_image: boolean
  version: number
  published_at: string | null
  updated_at: string
  items: number
  documents: number
  scans30: number
  has_draft_changes: boolean
}

const IMPORT_HEADERS = ['name', 'brand', 'model', 'gtin', 'category', 'country', 'manufacturer', 'manufacturer_address', 'materials', 'description', 'care']

/** Basit CSV ayrıştırıcı: tırnaklı alanlar, virgül / noktalı virgül ayraç. */
function parseCsv(text: string) {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const firstLine = clean.split(/\r?\n/)[0] || ''
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === sep) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
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
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim()))
  const header = (nonEmpty[0] || []).map((h) => h.trim().toLowerCase())
  return nonEmpty.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])))
}

export default function Products({ go, me }: { go: (v: View) => void; me: Me }) {
  const { t, labels, date, number } = useT()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('active')
  const [category, setCategory] = useState('')
  const [importing, setImporting] = useState(false)
  const canEdit = me.role !== 'viewer'

  const load = useCallback(async () => {
    try {
      const data = await api<{ products: Row[] }>('products.list')
      setRows(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const nameOf = useCallback((r: Row) => readTextsMap(r.texts)[r.default_lang]?.name || t('pr_unnamed'), [t])

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (rows || []).filter((r) => {
      if (status === 'active' && r.status === 'archived') return false
      if (status && status !== 'active' && r.status !== status) return false
      if (category && r.data.category !== category) return false
      if (!needle) return true
      return [nameOf(r), r.data.brand, r.data.model, r.data.gtin, r.public_id].some((v) => String(v || '').toLowerCase().includes(needle))
    })
  }, [rows, q, status, category, nameOf])

  const statusLabel = (s: string) => (s === 'published' ? t('st_published') : s === 'archived' ? t('st_archived') : t('st_draft'))

  const exportCsv = () => {
    const header = [t('csv_product'), t('csv_brand'), t('csv_model'), 'GTIN', t('csv_category'), t('csv_status'), t('csv_version'), t('csv_serial_count'), t('csv_documents'), t('csv_scans30'), t('csv_url'), t('csv_updated')]
    const lines = list.map((r) =>
      [nameOf(r), r.data.brand, r.data.model, r.data.gtin, labels.categories[r.data.category || 'other'], statusLabel(r.status), r.version, r.items, r.documents, r.scans30, `${window.location.origin}/p/${r.public_id}`, date(r.updated_at)]
        .map(csvCell)
        .join(';')
    )
    downloadText(`dpp-products-${new Date().toISOString().slice(0, 10)}.csv`, [header.map(csvCell).join(';'), ...lines].join('\n'))
  }

  const importCsv = async (file: File) => {
    setImporting(true)
    setError(null)
    setInfo(null)
    try {
      const parsed = parseCsv(await file.text())
      if (!parsed.length) throw new Error(t('pr_err_norows'))
      if (!('name' in parsed[0])) throw new Error(t('pr_err_noname'))
      const res = await api<{ created: number; errors: string[] }>('products.import', { rows: parsed })
      setInfo([t('pr_imported', { n: res.created }), res.errors.length ? t('pr_skipped', { n: res.errors.length, list: res.errors.slice(0, 5).join(' · ') }) : ''].filter(Boolean).join(' '))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_generic'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav_products')}</h1>
          <p className="text-sm text-slate-500">{t('pr_sub')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <details className="relative">
                <summary className="inline-flex cursor-pointer list-none items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">{t('pr_import')}</summary>
                <div className="absolute end-0 z-20 mt-2 w-80 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-lg">
                  <p className="text-slate-600">{t('pr_import_help')}</p>
                  <Button
                    size="sm"
                    onClick={() =>
                      downloadText(
                        'dpp-template.csv',
                        [
                          IMPORT_HEADERS.join(';'),
                          [t('tpl_name'), t('tpl_brand'), 'TS-001', '', 'textile', 'TR', t('tpl_manufacturer'), t('tpl_address'), t('tpl_materials'), t('tpl_description'), t('tpl_care')].map(csvCell).join(';'),
                        ].join('\n')
                      )
                    }
                  >
                    {t('pr_template')}
                  </Button>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">{t('pr_choose_csv')}</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      disabled={importing}
                      className="block w-full text-xs file:me-3 file:rounded-lg file:border-0 file:bg-[#0f3d5e] file:px-3 file:py-1.5 file:font-semibold file:text-white"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void importCsv(f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <p className="text-xs text-slate-500" dir="ltr">
                    {t('pr_cat_codes')} {Object.keys(DPP_CATEGORIES).join(', ')}
                  </p>
                </div>
              </details>
              <Button variant="primary" onClick={() => go({ page: 'product', id: null })}>
                {t('pr_new')}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}
      {importing && <Alert tone="info">{t('pr_importing')}</Alert>}

      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          <input className={`${inputCls} max-w-xs`} placeholder={t('pr_search')} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">{t('pr_f_active')}</option>
            <option value="published">{t('st_published')}</option>
            <option value="draft">{t('st_draft')}</option>
            <option value="archived">{t('st_archived')}</option>
            <option value="">{t('pr_f_all')}</option>
          </select>
          <select className={`${inputCls} w-auto`} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t('pr_f_allcats')}</option>
            {Object.keys(DPP_CATEGORIES).map((k) => (
              <option key={k} value={k}>
                {labels.categories[k as DppCategory]}
              </option>
            ))}
          </select>
          <Button className="ms-auto" onClick={exportCsv} disabled={!list.length}>
            {t('pr_export')}
          </Button>
        </div>

        {rows === null ? (
          <p className="py-8 text-center text-slate-500">{t('loading')}</p>
        ) : rows.length === 0 ? (
          <Empty icon="📦" title={t('pr_empty_title')}>
            {canEdit ? t('pr_empty_edit') : t('pr_empty_view')}
          </Empty>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-slate-500">{t('pr_no_match')}</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 text-start">{t('th_product')}</th>
                  <th className="px-3 py-2.5 text-start">GTIN</th>
                  <th className="px-3 py-2.5 text-start">{t('th_status')}</th>
                  <th className="px-3 py-2.5 text-end">{t('th_serials')}</th>
                  <th className="px-3 py-2.5 text-end">{t('th_scans')}</th>
                  <th className="px-5 py-2.5 text-end">{t('th_updated')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-sky-50/50" onClick={() => go({ page: 'product', id: r.id })}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {r.has_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/dpp/image?id=${r.id}`} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover" loading="lazy" />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100">📦</span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{nameOf(r)}</p>
                          <p className="truncate text-xs text-slate-500">{[r.data.brand, r.data.model, labels.categories[r.data.category || 'other']].filter(Boolean).join(' · ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs" dir="ltr">
                      {r.data.gtin || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} changes={r.has_draft_changes} />
                      {r.version > 0 && <span className="ms-1 text-xs text-slate-400">v{r.version}</span>}
                    </td>
                    <td className="px-3 py-3 text-end tabular-nums">{number(r.items)}</td>
                    <td className="px-3 py-3 text-end tabular-nums">{number(r.scans30)}</td>
                    <td className="px-5 py-3 text-end text-xs text-slate-500">{date(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
