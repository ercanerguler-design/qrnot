'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MsgKey } from '@/lib/dpp/i18n'
import { DPP_LANG_NAMES, DPP_LANGS, type DppLang, type DppMaterial } from '@/lib/dpp/types'
import { useT } from './i18n'
import { Alert, api, Button, Card, Field, inputCls } from './ui'

// Ürün editörü › Tedarikçiler: tedarikçiye bilgi talebi linki gönderme, yanıtı inceleme ve ürüne aktarma.

const FIELDS = ['materials', 'certificates', 'facility', 'substances', 'carbon'] as const
type Field = (typeof FIELDS)[number]
const SECTIONS = ['materials', 'certificates', 'facility', 'substances', 'carbon', 'files', 'notes'] as const
type Section = (typeof SECTIONS)[number]
type Status = 'open' | 'submitted' | 'applied' | 'rejected' | 'expired'

interface SupplierRequest {
  id: string
  supplierName: string
  contact: string
  message: string
  fields: Field[]
  lang: DppLang
  status: Status
  expiresAt: string
  submittedAt: string | null
  createdAt: string
  url: string
  response: {
    company: string
    contactName: string
    contactEmail: string
    materials: DppMaterial[]
    certificates: Array<{ name: string; reference: string; validUntil: string }>
    facility: string
    substances: string
    carbonPerKg: number | null
    carbonMethod: string
    notes: string
    files: Array<{ title: string; contentType: string; size: number; applied: boolean; href: string }>
  } | null
}

const STATUS_STYLE: Record<Status, string> = {
  open: 'bg-sky-100 text-sky-800',
  submitted: 'bg-amber-100 text-amber-900',
  applied: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-slate-200 text-slate-600',
  expired: 'bg-slate-100 text-slate-500',
}

export default function SuppliersPanel({
  productId,
  productName,
  companyName,
  readOnly,
  dirty,
  onApplied,
}: {
  productId: string
  productName: string
  companyName: string
  readOnly: boolean
  dirty: boolean
  onApplied: () => Promise<void>
}) {
  const { t, lang, date } = useT()
  const [requests, setRequests] = useState<SupplierRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)
  const [form, setForm] = useState({ supplierName: '', contact: '', message: '', days: 30, lang: lang as DppLang, fields: ['materials', 'certificates'] as Field[] })

  const load = useCallback(async () => {
    const res = await api<{ requests: SupplierRequest[] }>('suppliers.list', { productId })
    setRequests(res.requests)
  }, [productId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((err) => setError(err.message))
  }, [load])

  const run = async (task: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await task()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_generic'))
    } finally {
      setBusy(false)
    }
  }

  const create = () =>
    run(async () => {
      const res = await api<{ id: string; url: string }>('suppliers.create', { productId, ...form })
      setCreated(res.url)
      setForm((f) => ({ ...f, supplierName: '', contact: '', message: '' }))
      await load()
    })

  const shareText = (url: string) => t('sr_share_text', { company: companyName, product: productName, url })

  return (
    <div className="space-y-5">
      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      {!readOnly && (
        <Card title={t('sr_title')} subtitle={t('sr_sub')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('sr_supplier')}>
              <input className={inputCls} value={form.supplierName} maxLength={200} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
            </Field>
            <Field label={t('sr_contact')}>
              <input className={inputCls} value={form.contact} maxLength={200} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </Field>
            <Field label={t('sr_message')} className="sm:col-span-2">
              <textarea className={inputCls} rows={2} maxLength={2000} placeholder={t('ph_sr_message')} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="mb-1 text-xs font-semibold text-slate-600">{t('sr_fields')}</legend>
              <div className="flex flex-wrap gap-2">
                {FIELDS.map((f) => (
                  <label key={f} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={form.fields.includes(f)}
                      onChange={(e) => setForm({ ...form, fields: e.target.checked ? [...form.fields, f] : form.fields.filter((x) => x !== f) })}
                    />
                    {t(`sr_f_${f}` as MsgKey)}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label={t('sr_days')}>
              <input className={inputCls} type="number" min={1} max={90} value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} />
            </Field>
            <Field label={t('sr_lang')}>
              <select className={inputCls} value={form.lang} onChange={(e) => setForm({ ...form, lang: e.target.value as DppLang })}>
                {DPP_LANGS.map((l) => (
                  <option key={l} value={l}>
                    {DPP_LANG_NAMES[l]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Button variant="primary" disabled={busy || !form.supplierName.trim() || !form.fields.length} onClick={create}>
              {t('sr_create')}
            </Button>
          </div>
          {created && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="font-semibold text-emerald-900">{t('sr_created')}</p>
              <ShareLink url={created} text={shareText(created)} subject={t('sr_email_subject', { product: productName })} />
            </div>
          )}
        </Card>
      )}

      <Card title={t('sr_list')}>
        {!requests ? (
          <p className="text-sm text-slate-500">{t('loading')}</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-500">{t('sr_none')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {requests.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{r.supplierName}</p>
                    <p className="text-xs text-slate-500">
                      {t('sr_created_at', { d: date(r.createdAt) })}
                      {r.submittedAt ? ` · ${t('sr_submitted_at', { d: date(r.submittedAt, true) })}` : ''}
                      {r.contact ? ` · ${r.contact}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{t(`sr_st_${r.status}` as MsgKey)}</span>
                    {r.response && (
                      <Button size="sm" onClick={() => setOpen(open === r.id ? null : r.id)}>
                        {open === r.id ? t('sr_hide') : t('sr_view')}
                      </Button>
                    )}
                  </div>
                </div>
                {(r.status === 'open' || r.status === 'submitted') && (
                  <ShareLink url={r.url} text={shareText(r.url)} subject={t('sr_email_subject', { product: productName })} />
                )}
                {open === r.id && r.response && (
                  <ResponseView
                    request={r}
                    readOnly={readOnly}
                    busy={busy}
                    dirty={dirty}
                    onApply={(sections) =>
                      run(async () => {
                        await api('suppliers.apply', { id: r.id, sections })
                        await onApplied()
                        await load()
                        setNotice(t('sr_applied_notice'))
                      })
                    }
                  />
                )}
                {!readOnly && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.status === 'submitted' && (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(async () => (await api('suppliers.reject', { id: r.id }), await load()))}>
                        {t('sr_reject')}
                      </Button>
                    )}
                    {r.status !== 'open' && r.status !== 'submitted' && (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(async () => (await api('suppliers.reopen', { id: r.id, days: 14 }), await load()))}>
                        {t('sr_reopen')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(t('sr_confirm_delete'))) run(async () => (await api('suppliers.delete', { id: r.id }), await load()))
                      }}
                    >
                      {t('sr_delete')}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function ShareLink({ url, text, subject }: { url: string; text: string; subject: string }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${inputCls} min-w-0 flex-1 font-mono text-xs`} dir="ltr" readOnly value={url} aria-label={t('sr_link')} onFocus={(e) => e.target.select()} />
        <Button
          size="sm"
          onClick={() => {
            navigator.clipboard?.writeText(url).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
        >
          {copied ? t('copied') : t('copy')}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <a className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-emerald-800 hover:bg-emerald-50" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
          {t('sr_share_whatsapp')}
        </a>
        <a className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50" href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}>
          {t('sr_share_email')}
        </a>
      </div>
    </div>
  )
}

function ResponseView({ request, readOnly, busy, dirty, onApply }: { request: SupplierRequest; readOnly: boolean; busy: boolean; dirty: boolean; onApply: (s: Section[]) => void }) {
  const { t, date, number, labels } = useT()
  const r = request.response!
  const available: Section[] = SECTIONS.filter((s) => {
    if (s === 'materials') return r.materials.length > 0
    if (s === 'certificates') return r.certificates.length > 0
    if (s === 'facility') return Boolean(r.facility)
    if (s === 'substances') return Boolean(r.substances)
    if (s === 'carbon') return r.carbonPerKg !== null
    if (s === 'files') return r.files.some((f) => !f.applied)
    return Boolean(r.notes)
  })
  const [sel, setSel] = useState<Section[]>(available)
  const sectionLabel = (s: Section) => (s === 'files' ? t('sr_resp_files') : s === 'notes' ? t('sr_resp_notes') : t(`sr_f_${s}` as MsgKey))
  const canApply = !readOnly && request.status === 'submitted'

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[10rem_1fr]">
        <dt className="font-semibold text-slate-600">{t('sr_resp_company')}</dt>
        <dd>{r.company}</dd>
        <dt className="font-semibold text-slate-600">{t('sr_resp_contact')}</dt>
        <dd>{[r.contactName, r.contactEmail].filter(Boolean).join(' · ')}</dd>
      </dl>
      {r.materials.length > 0 && (
        <Block title={t('sr_f_materials')}>
          <ul className="list-disc ps-5">
            {r.materials.map((m, i) => (
              <li key={i}>
                {m.name}
                {m.percent !== null ? ` — ${number(m.percent)}%` : ''}
                {m.recycledPercent ? ` (${t('mat_recycled')}: ${number(m.recycledPercent)}%)` : ''}
                {m.origin ? ` · ${m.origin}` : ''}
              </li>
            ))}
          </ul>
        </Block>
      )}
      {r.certificates.length > 0 && (
        <Block title={t('sp_certificates')}>
          <ul className="list-disc ps-5">
            {r.certificates.map((c, i) => (
              <li key={i}>
                {c.name}
                {c.reference ? ` — ${c.reference}` : ''}
                {c.validUntil ? ` (${t('sr_resp_valid', { d: date(c.validUntil) })})` : ''}
              </li>
            ))}
          </ul>
        </Block>
      )}
      {r.facility && <Block title={t('sr_f_facility')}>{r.facility}</Block>}
      {r.substances && <Block title={t('sr_f_substances')}>{r.substances}</Block>}
      {r.carbonPerKg !== null && (
        <Block title={t('sr_f_carbon')}>
          {number(r.carbonPerKg)} kg CO₂e/kg
          {r.carbonMethod ? ` · ${t('sr_resp_method')}: ${r.carbonMethod}` : ''}
        </Block>
      )}
      {r.files.length > 0 && (
        <Block title={t('sr_resp_files')}>
          <ul className="space-y-1">
            {r.files.map((f, i) => (
              <li key={i}>
                <a className="text-sky-700 underline" href={f.href} target="_blank" rel="noopener noreferrer">
                  📄 {f.title}
                </a>
                <span className="text-slate-500"> · {(f.size / 1024 / 1024).toFixed(1)} MB{f.applied ? ` · ${labels.documents}` : ''}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {r.notes && <Block title={t('sr_resp_notes')}>{r.notes}</Block>}

      {canApply && available.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 font-semibold text-slate-800">{t('sr_apply_title')}</p>
          <div className="flex flex-wrap gap-2">
            {available.map((s) => (
              <label key={s} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5">
                <input type="checkbox" checked={sel.includes(s)} onChange={(e) => setSel(e.target.checked ? [...sel, s] : sel.filter((x) => x !== s))} />
                {sectionLabel(s)}
              </label>
            ))}
          </div>
          {dirty && <p className="mt-2 text-xs text-amber-800">{t('ed_unsaved')}</p>}
          <Button
            className="mt-3"
            variant="success"
            disabled={busy || !sel.length || dirty}
            onClick={() => {
              if (sel.includes('materials') && !window.confirm(t('sr_confirm_materials'))) return
              onApply(sel)
            }}
          >
            {t('sr_apply')}
          </Button>
        </div>
      )}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-slate-700">{title}</p>
      <div dir="auto" className="whitespace-pre-line text-slate-800">{children}</div>
    </div>
  )
}
