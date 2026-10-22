'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'
import { Alert, api, Button, Card, csvCell, downloadText, Field, fmtDate, inputCls } from './ui'

// Tekil ürün pasaportları: seri numarası üretimi, liste, CSV dışa aktarma ve QR etiket baskısı.

interface Item {
  id: string
  public_id: string
  serial: string
  batch: string
  production_date: string | null
  created_at: string
  scans: number
}

interface ExportRow {
  serial: string
  batch: string
  productionDate: string
  url: string
  digitalLink: string
}

const PAGE = 200
const LABEL_SIZES = { 25: '25 mm', 30: '30 mm', 40: '40 mm', 50: '50 mm' } as const
const MAX_PRINT = 600

export default function ItemsPanel({
  productId,
  productName,
  gtin,
  published,
  readOnly,
  onChange,
}: {
  productId: string
  productName: string
  gtin: string
  published: boolean
  readOnly: boolean
  onChange: () => Promise<void>
}) {
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({ count: '100', prefix: '', start: '1', batch: '', productionDate: '' })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [labels, setLabels] = useState<ExportRow[] | null>(null)
  const [labelSize, setLabelSize] = useState<keyof typeof LABEL_SIZES>(30)
  const [useDigitalLink, setUseDigitalLink] = useState(false)

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
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setBusy(null)
    }
  }

  const fetchAll = async () => (await api<{ items: ExportRow[] }>('items.export', { productId })).items

  return (
    <div className="space-y-5">
      <Alert tone="info">
        Her seri numarası kendi pasaport adresini alır: ürünü okutan kişi model bilgilerinin yanında <b>seri no, parti ve üretim tarihini</b> de görür. Model düzeyinde tek QR yeterliyse “Genel” sekmesindeki QR’ı kullan.
      </Alert>
      {!published && <Alert tone="warn">Pasaport henüz yayınlanmadı. Etiketleri basabilirsin ama okutulduğunda sayfa yayınlandıktan sonra açılır.</Alert>}
      {error && <Alert>{error}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}

      {!readOnly && (
        <Card title="Seri numarası üret" subtitle="Tek seferde en fazla 2.000 adet. Var olan seri numaraları atlanır.">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Field label="Adet">
              <input className={inputCls} inputMode="numeric" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="Ön ek" hint="Ör. TS24-">
              <input className={`${inputCls} font-mono uppercase`} maxLength={16} value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Başlangıç no">
              <input className={inputCls} inputMode="numeric" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="Parti / lot">
              <input className={inputCls} maxLength={40} value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
            </Field>
            <Field label="Üretim tarihi">
              <input className={inputCls} type="date" value={form.productionDate} onChange={(e) => setForm({ ...form, productionDate: e.target.value })} />
            </Field>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Örnek: {form.prefix}
            {String(Number(form.start) || 1).padStart(Math.max(6, String((Number(form.start) || 1) + (Number(form.count) || 1) - 1).length), '0')} …
          </p>
          <Button
            variant="primary"
            className="mt-3"
            disabled={busy !== null || !Number(form.count)}
            onClick={() =>
              void run('gen', async () => {
                const res = await api<{ created: number; skipped: number }>('items.generate', { productId, ...form, count: Number(form.count), start: Number(form.start) || 1 })
                setInfo(`${res.created.toLocaleString('tr-TR')} seri numarası oluşturuldu${res.skipped ? `, ${res.skipped} tanesi zaten vardı` : ''}.`)
                setForm((f) => ({ ...f, start: String((Number(f.start) || 1) + Number(f.count)) }))
                await load()
                await onChange()
              })
            }
          >
            {busy === 'gen' ? 'Üretiliyor…' : `${Number(form.count || 0).toLocaleString('tr-TR')} seri numarası üret`}
          </Button>
        </Card>
      )}

      <Card
        title={`Seri numaraları (${total.toLocaleString('tr-TR')})`}
        actions={
          <>
            <Button
              size="sm"
              disabled={busy !== null || total === 0}
              onClick={() =>
                void run('csv', async () => {
                  const rows = await fetchAll()
                  const header = ['Seri no', 'Parti', 'Üretim tarihi', 'Pasaport adresi', 'GS1 Digital Link']
                  downloadText(
                    `dpp-seri-${new Date().toISOString().slice(0, 10)}.csv`,
                    [header.join(';'), ...rows.map((r) => [r.serial, r.batch, r.productionDate, r.url, r.digitalLink].map(csvCell).join(';'))].join('\n')
                  )
                })
              }
            >
              ⬇ CSV (lazer / etiket yazılımı için)
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
              🖨 QR etiketleri {selected.size ? `(${selected.size} seçili)` : ''}
            </Button>
          </>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input className={`${inputCls} max-w-xs`} placeholder="Seri no ya da parti ara…" value={q} onChange={(e) => setQ(e.target.value)} />
          {!readOnly && selected.size > 0 && (
            <Button
              size="sm"
              variant="danger"
              disabled={busy !== null}
              onClick={() =>
                void run('del', async () => {
                  if (!window.confirm(`${selected.size} seri numarası silinsin mi? Bu ürünlerin etiketleri artık açılmaz.`)) return
                  const res = await api<{ deleted: number }>('items.delete', { productId, ids: [...selected] })
                  setSelected(new Set())
                  setInfo(`${res.deleted} seri numarası silindi.`)
                  await load()
                  await onChange()
                })
              }
            >
              Seçilenleri sil ({selected.size})
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">{total === 0 ? 'Henüz seri numarası yok.' : 'Aramaya uyan kayıt yok.'}</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-10 px-5 py-2">
                    <input
                      type="checkbox"
                      aria-label="Tümünü seç"
                      checked={items.length > 0 && items.every((i) => selected.has(i.id))}
                      onChange={(e) => setSelected(e.target.checked ? new Set(items.map((i) => i.id)) : new Set())}
                    />
                  </th>
                  <th className="px-3 py-2">Seri no</th>
                  <th className="px-3 py-2">Parti</th>
                  <th className="px-3 py-2">Üretim</th>
                  <th className="px-3 py-2 text-right">Okutma</th>
                  <th className="px-5 py-2 text-right">Pasaport</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => (
                  <tr key={i.id}>
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
                    <td className="px-3 py-2 font-mono">{i.serial}</td>
                    <td className="px-3 py-2">{i.batch || '—'}</td>
                    <td className="px-3 py-2">{fmtDate(i.production_date)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{i.scans}</td>
                    <td className="px-5 py-2 text-right">
                      <a href={`/p/${i.public_id}`} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                        /p/{i.public_id} ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {items.length < total && (
          <Button className="mt-3 w-full" onClick={() => void load(items.length)}>
            Daha fazla göster ({(total - items.length).toLocaleString('tr-TR')})
          </Button>
        )}
      </Card>

      {labels && (
        <div className="fixed inset-0 z-50 overflow-auto bg-slate-900/60 p-4 print:static print:bg-white print:p-0">
          <style>{`@media print { body * { visibility: hidden !important; } #dpp-labels, #dpp-labels * { visibility: visible !important; } #dpp-labels { position: absolute; inset: 0; } @page { margin: 8mm; } }`}</style>
          <div className="mx-auto max-w-5xl rounded-2xl bg-white p-5 print:max-w-none print:rounded-none print:p-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h3 className="font-semibold">QR etiketleri · {labels.length.toLocaleString('tr-TR')} adet</h3>
                {total > MAX_PRINT && !selected.size && <p className="text-xs text-amber-700">Bir seferde en fazla {MAX_PRINT} etiket basılır. Daha fazlası için CSV’yi etiket yazılımında kullan.</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select className={`${inputCls} w-auto`} value={labelSize} onChange={(e) => setLabelSize(Number(e.target.value) as keyof typeof LABEL_SIZES)}>
                  {Object.entries(LABEL_SIZES).map(([k, v]) => (
                    <option key={k} value={k}>
                      QR boyutu {v}
                    </option>
                  ))}
                </select>
                {gtin && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={useDigitalLink} onChange={(e) => setUseDigitalLink(e.target.checked)} /> GS1 Digital Link
                  </label>
                )}
                <Button variant="primary" onClick={() => window.print()}>
                  🖨 Yazdır
                </Button>
                <Button onClick={() => setLabels(null)}>Kapat</Button>
              </div>
            </div>
            <div id="dpp-labels" className="flex flex-wrap gap-[3mm]">
              {labels.map((r) => (
                <div key={r.serial} className="flex flex-col items-center border border-dashed border-slate-300 p-[2mm] text-center" style={{ width: `${labelSize + 6}mm`, breakInside: 'avoid' }}>
                  <QRCodeSVG value={useDigitalLink && r.digitalLink ? r.digitalLink : r.url} level="M" marginSize={0} style={{ width: `${labelSize}mm`, height: `${labelSize}mm` }} />
                  <p className="mt-[1mm] w-full truncate font-mono leading-tight" style={{ fontSize: labelSize >= 40 ? '9pt' : '7pt' }}>
                    {r.serial}
                  </p>
                  {labelSize >= 40 && <p className="w-full truncate leading-tight text-slate-600" style={{ fontSize: '7pt' }}>{productName}</p>}
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
