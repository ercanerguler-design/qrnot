'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DPP_CATEGORIES, readTextsMap, type DppCategory, type DppLang } from '@/lib/dpp/types'
import type { Me, View } from './PanelApp'
import { Alert, api, Button, Card, csvCell, downloadText, Empty, fmtDate, inputCls, StatusBadge } from './ui'

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
      setError(err instanceof Error ? err.message : 'Liste alınamadı')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (rows || []).filter((r) => {
      if (status === 'active' && r.status === 'archived') return false
      if (status && status !== 'active' && r.status !== status) return false
      if (category && r.data.category !== category) return false
      if (!needle) return true
      const texts = readTextsMap(r.texts)
      const name = texts[r.default_lang]?.name || ''
      return [name, r.data.brand, r.data.model, r.data.gtin, r.public_id].some((v) => String(v || '').toLowerCase().includes(needle))
    })
  }, [rows, q, status, category])

  const nameOf = (r: Row) => readTextsMap(r.texts)[r.default_lang]?.name || 'İsimsiz ürün'

  const exportCsv = () => {
    const header = ['Ürün', 'Marka', 'Model', 'GTIN', 'Kategori', 'Durum', 'Sürüm', 'Seri no adedi', 'Belge', 'Okutma (30 gün)', 'Pasaport adresi', 'Son güncelleme']
    const lines = list.map((r) =>
      [
        nameOf(r),
        r.data.brand,
        r.data.model,
        r.data.gtin,
        DPP_CATEGORIES[r.data.category || 'other'],
        r.status,
        r.version,
        r.items,
        r.documents,
        r.scans30,
        `${window.location.origin}/p/${r.public_id}`,
        fmtDate(r.updated_at),
      ]
        .map(csvCell)
        .join(';')
    )
    downloadText(`dpp-urunler-${new Date().toISOString().slice(0, 10)}.csv`, [header.join(';'), ...lines].join('\n'))
  }

  const importCsv = async (file: File) => {
    setImporting(true)
    setError(null)
    setInfo(null)
    try {
      const parsed = parseCsv(await file.text())
      if (!parsed.length) throw new Error('Dosyada satır bulunamadı')
      if (!('name' in parsed[0])) throw new Error('İlk satırda "name" sütunu olmalı. Şablonu indirip kullan.')
      const res = await api<{ created: number; errors: string[] }>('products.import', { rows: parsed })
      setInfo(`${res.created} taslak ürün oluşturuldu.${res.errors.length ? ` ${res.errors.length} satır atlandı: ${res.errors.slice(0, 5).join(' · ')}` : ''}`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İçe aktarma başarısız')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ürün pasaportları</h1>
          <p className="text-sm text-slate-500">Her ürün modeli için bir pasaport; tekil ürünler için seri numarası üretebilirsin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <details className="relative">
                <summary className="inline-flex cursor-pointer list-none items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                  ⬆ Toplu içe aktar
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-80 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-lg">
                  <p className="text-slate-600">CSV ile çok sayıda ürünü taslak olarak ekle. Malzemeleri “Pamuk 95; Elastan 5” biçiminde yaz.</p>
                  <Button
                    size="sm"
                    onClick={() =>
                      downloadText(
                        'dpp-urun-sablonu.csv',
                        [
                          IMPORT_HEADERS.join(';'),
                          ['Organik Pamuk Tişört', 'Örnek Marka', 'TS-001', '8690000000000', 'textile', 'TR', 'Örnek Tekstil A.Ş.', 'İstanbul, Türkiye', 'Organik pamuk 95; Elastan 5', 'Unisex basic tişört', '30°C’de yıkayın'].map(csvCell).join(';'),
                        ].join('\n')
                      )
                    }
                  >
                    ⬇ Şablonu indir
                  </Button>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-600">CSV dosyası seç</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      disabled={importing}
                      className="block w-full text-xs"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void importCsv(f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <p className="text-xs text-slate-500">Kategori kodları: {Object.keys(DPP_CATEGORIES).join(', ')}</p>
                </div>
              </details>
              <Button variant="primary" onClick={() => go({ page: 'product', id: null })}>
                ＋ Yeni ürün
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}
      {importing && <Alert tone="info">İçe aktarılıyor…</Alert>}

      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          <input className={`${inputCls} max-w-xs`} placeholder="Ürün adı, marka, model, GTIN…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Aktif (taslak + yayında)</option>
            <option value="published">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="archived">Arşivde</option>
            <option value="">Tümü</option>
          </select>
          <select className={`${inputCls} w-auto`} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Tüm kategoriler</option>
            {Object.entries(DPP_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Button className="ml-auto" onClick={exportCsv} disabled={!list.length}>
            ⬇ Listeyi indir (CSV)
          </Button>
        </div>

        {rows === null ? (
          <p className="py-8 text-center text-slate-500">Yükleniyor…</p>
        ) : rows.length === 0 ? (
          <Empty icon="📦" title="Henüz ürün pasaportu yok">
            {canEdit ? 'Sağ üstteki “Yeni ürün” ile ilk pasaportunu oluştur ya da CSV ile toplu ekle.' : 'Firmanızda henüz ürün yok.'}
          </Empty>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Filtreye uyan ürün yok</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5">Ürün</th>
                  <th className="px-3 py-2.5">GTIN</th>
                  <th className="px-3 py-2.5">Durum</th>
                  <th className="px-3 py-2.5 text-right">Seri no</th>
                  <th className="px-3 py-2.5 text-right">Okutma</th>
                  <th className="px-5 py-2.5 text-right">Güncelleme</th>
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
                          <p className="truncate text-xs text-slate-500">
                            {[r.data.brand, r.data.model, DPP_CATEGORIES[r.data.category || 'other']].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{r.data.gtin || '—'}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} changes={r.has_draft_changes} />
                      {r.version > 0 && <span className="ml-1 text-xs text-slate-400">v{r.version}</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{r.items.toLocaleString('tr-TR')}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{r.scans30.toLocaleString('tr-TR')}</td>
                    <td className="px-5 py-3 text-right text-xs text-slate-500">{fmtDate(r.updated_at)}</td>
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
