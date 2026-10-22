'use client'

import { upload } from '@vercel/blob/client'
import { useState } from 'react'
import type { loadSupplierForm } from '@/lib/dpp/suppliers'
import type { DppMaterial } from '@/lib/dpp/types'
import { LangSelect, PanelI18nProvider, panelLang, useT } from '../../panel/i18n'
import { Alert, Button, Card, Field, FilePicker, inputCls } from '../../panel/ui'

// Tedarikçinin doldurduğu form (8 dil). Sadece firmanın istediği bölümler gösterilir.

type Form = NonNullable<Awaited<ReturnType<typeof loadSupplierForm>>>
type FileRow = { url: string; title: string; href?: string; size?: number }

export default function SupplierForm({ token, initial }: { token: string; initial: Form | null }) {
  return (
    <PanelI18nProvider preferred={initial?.lang}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Inner token={token} initial={initial} />
      </div>
    </PanelI18nProvider>
  )
}

function Inner({ token, initial }: { token: string; initial: Form | null }) {
  const { t, date } = useT()
  const [form, setForm] = useState(initial)
  const r = initial?.response
  const [company, setCompany] = useState(r?.company || initial?.supplierName || '')
  const [contactName, setContactName] = useState(r?.contactName || '')
  const [contactEmail, setContactEmail] = useState(r?.contactEmail || '')
  const [materials, setMaterials] = useState<DppMaterial[]>(r?.materials.length ? r.materials : [{ name: '', percent: null, recycledPercent: null, origin: '' }])
  const [certs, setCerts] = useState(r?.certificates.length ? r.certificates : [{ name: '', reference: '', validUntil: '' }])
  const [facility, setFacility] = useState(r?.facility || '')
  const [substances, setSubstances] = useState(r?.substances || '')
  const [carbonPerKg, setCarbonPerKg] = useState(r?.carbonPerKg !== null && r?.carbonPerKg !== undefined ? String(r.carbonPerKg) : '')
  const [carbonMethod, setCarbonMethod] = useState(r?.carbonMethod || '')
  const [notes, setNotes] = useState(r?.notes || '')
  const [files, setFiles] = useState<FileRow[]>((r?.files || []).map((f) => ({ url: (f as { url?: string }).url || '', title: f.title, href: f.href, size: f.size })))
  const [pick, setPick] = useState<File | null>(null)
  const [pickTitle, setPickTitle] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [declaration, setDeclaration] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const header = (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <span className="font-bold text-[#0f3d5e]">QRNot · DPP</span>
        <LangSelect />
      </div>
    </header>
  )

  if (!form) {
    return (
      <>
        {header}
        <main className="mx-auto max-w-3xl px-4 py-10">
          <Alert>{t('sp_not_found')}</Alert>
        </main>
      </>
    )
  }

  if (!form.canEdit && !done) {
    return (
      <>
        {header}
        <main className="mx-auto max-w-3xl px-4 py-10">
          <Card title={t('sp_closed_title')}>
            <p className="text-sm text-slate-600">{t('sp_closed', { company: form.companyName })}</p>
          </Card>
        </main>
      </>
    )
  }

  const has = (f: string) => form.fields.includes(f as Form['fields'][number])
  const total = materials.reduce((s, m) => s + (m.percent || 0), 0)
  const anyPct = materials.some((m) => m.percent !== null)
  const pctOk = !has('materials') || !anyPct || Math.abs(total - 100) <= 0.5
  const setMat = (i: number, p: Partial<DppMaterial>) => setMaterials(materials.map((m, j) => (j === i ? { ...m, ...p } : m)))
  const setCert = (i: number, p: Partial<(typeof certs)[number]>) => setCerts(certs.map((c, j) => (j === i ? { ...c, ...p } : c)))
  const toNum = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

  const doUpload = async () => {
    if (!pick) return
    setError(null)
    setProgress(0)
    try {
      const ext = (pick.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)
      const blob = await upload(`${form.uploadPrefix}${Date.now()}.${ext}`, pick, {
        access: 'private',
        handleUploadUrl: '/api/dpp/supplier/upload',
        clientPayload: JSON.stringify({ token, lang: panelLang() }),
        contentType: pick.type || undefined,
        multipart: pick.size > 8 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      })
      setFiles([...files, { url: blob.url, title: pickTitle.trim() || pick.name.replace(/\.[^.]+$/, ''), size: pick.size }])
      setPick(null)
      setPickTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_generic'))
    } finally {
      setProgress(null)
    }
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/dpp/supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-dpp-lang': panelLang() },
        body: JSON.stringify({
          token,
          declaration,
          response: {
            company,
            contactName,
            contactEmail,
            materials: materials.filter((m) => m.name.trim()),
            certificates: certs.filter((c) => c.name.trim()),
            facility,
            substances,
            carbonPerKg,
            carbonMethod,
            notes,
            files: files.map((f) => ({ url: f.url, title: f.title })),
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t('err_generic'))
      const fresh = await fetch(`/api/dpp/supplier?t=${encodeURIComponent(token)}`, { headers: { 'x-dpp-lang': panelLang() } }).then((x) => x.json())
      if (fresh.form) {
        setForm(fresh.form)
        setFiles(fresh.form.response.files.map((f: FileRow) => ({ url: f.url, title: f.title, href: f.href, size: f.size })))
      }
      setDeclaration(false)
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {header}
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">{t('sp_title')}</h1>
          <p className="mt-1 text-slate-600">{t('sp_intro', { company: form.companyName, product: form.productName })}</p>
          <p className="mt-1 text-xs text-slate-500">{t('sp_expires', { d: date(form.expiresAt) })}</p>
        </div>

        {done && (
          <Alert tone="success">
            <strong>{t('sp_thanks_title')}</strong> {t('sp_thanks', { company: form.companyName })}
          </Alert>
        )}
        {form.message && (
          <Card title={t('sp_note_from')}>
            <p dir="auto" className="whitespace-pre-line text-sm text-slate-700">{form.message}</p>
          </Card>
        )}

        <Card title={t('sp_section_company')}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('sp_supplier_company')}>
              <input className={inputCls} maxLength={200} value={company} onChange={(e) => setCompany(e.target.value)} />
            </Field>
            <Field label={t('sp_contact_name')}>
              <input className={inputCls} maxLength={120} value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </Field>
            <Field label={t('sp_contact_email')}>
              <input className={inputCls} type="email" dir="ltr" maxLength={255} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </Field>
          </div>
        </Card>

        {has('materials') && (
          <Card
            title={t('sr_f_materials')}
            subtitle={t('sp_materials_hint')}
            actions={
              anyPct ? (
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${pctOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{t('mat_total', { n: Math.round(total * 10) / 10 })}</span>
              ) : undefined
            }
          >
            <div className="space-y-2">
              {materials.map((m, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-[1fr_6rem_8rem_9rem_2.5rem] sm:border-0 sm:p-0">
                  <input className={`${inputCls} col-span-2 sm:col-span-1`} aria-label={t('mat_name')} placeholder={t('ph_material')} value={m.name} onChange={(e) => setMat(i, { name: e.target.value })} />
                  <input className={inputCls} inputMode="decimal" aria-label={t('mat_pct')} placeholder={t('mat_pct')} value={m.percent ?? ''} onChange={(e) => setMat(i, { percent: toNum(e.target.value) })} />
                  <input className={inputCls} inputMode="decimal" aria-label={t('mat_recycled')} placeholder={t('mat_recycled')} value={m.recycledPercent ?? ''} onChange={(e) => setMat(i, { recycledPercent: toNum(e.target.value) })} />
                  <input className={inputCls} aria-label={t('mat_origin')} placeholder={t('ph_origin')} value={m.origin} onChange={(e) => setMat(i, { origin: e.target.value })} />
                  <Button variant="ghost" size="sm" aria-label={t('delete_row')} onClick={() => setMaterials(materials.filter((_, j) => j !== i))}>
                    ✕
                  </Button>
                </div>
              ))}
              <Button size="sm" onClick={() => setMaterials([...materials, { name: '', percent: null, recycledPercent: null, origin: '' }])}>
                {t('mat_add')}
              </Button>
            </div>
          </Card>
        )}

        {has('certificates') && (
          <Card title={t('sp_certificates')}>
            <div className="space-y-2">
              {certs.map((c, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-[1fr_1fr_10rem_2.5rem] sm:border-0 sm:p-0">
                  <input className={`${inputCls} col-span-2 sm:col-span-1`} placeholder={t('ph_comp_name')} value={c.name} onChange={(e) => setCert(i, { name: e.target.value })} />
                  <input className={inputCls} placeholder={t('ph_comp_ref')} value={c.reference} onChange={(e) => setCert(i, { reference: e.target.value })} />
                  <input className={inputCls} type="date" aria-label={t('sp_cert_valid')} title={t('sp_cert_valid')} value={c.validUntil} onChange={(e) => setCert(i, { validUntil: e.target.value })} />
                  <Button variant="ghost" size="sm" aria-label={t('delete_row')} onClick={() => setCerts(certs.filter((_, j) => j !== i))}>
                    ✕
                  </Button>
                </div>
              ))}
              <Button size="sm" onClick={() => setCerts([...certs, { name: '', reference: '', validUntil: '' }])}>
                {t('comp_other')}
              </Button>
            </div>
          </Card>
        )}

        {has('facility') && (
          <Card title={t('sr_f_facility')}>
            <textarea className={inputCls} rows={3} maxLength={1000} placeholder={t('sp_facility_hint')} value={facility} onChange={(e) => setFacility(e.target.value)} />
          </Card>
        )}

        {has('substances') && (
          <Card title={t('sr_f_substances')}>
            <textarea className={inputCls} rows={3} maxLength={3000} value={substances} onChange={(e) => setSubstances(e.target.value)} />
          </Card>
        )}

        {has('carbon') && (
          <Card title={t('sr_f_carbon')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('sp_carbon')}>
                <input className={inputCls} inputMode="decimal" value={carbonPerKg} onChange={(e) => setCarbonPerKg(e.target.value)} />
              </Field>
              <Field label={t('sr_resp_method')}>
                <input className={inputCls} maxLength={300} placeholder="ISO 14067, LCA…" value={carbonMethod} onChange={(e) => setCarbonMethod(e.target.value)} />
              </Field>
            </div>
          </Card>
        )}

        <Card title={t('sp_files')} subtitle={t('sp_files_hint')}>
          {files.length > 0 && (
            <ul className="mb-3 space-y-1.5 text-sm">
              {files.map((f, i) => (
                <li key={f.url || i} className="flex items-center gap-2">
                  <span aria-hidden>📄</span>
                  <input className={`${inputCls} flex-1`} value={f.title} maxLength={160} onChange={(e) => setFiles(files.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  {f.href && (
                    <a className="text-xs text-sky-700 underline" href={f.href} target="_blank" rel="noopener noreferrer">
                      PDF
                    </a>
                  )}
                  <Button variant="ghost" size="sm" aria-label={t('delete_row')} onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                    ✕
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {files.length < 20 && (
            <div className="space-y-2">
              <FilePicker accept="application/pdf,image/jpeg,image/png,image/webp" file={pick} onChange={(f) => (setPick(f), setPickTitle(f ? f.name.replace(/\.[^.]+$/, '') : ''))} disabled={progress !== null} />
              {pick && (
                <div className="flex flex-wrap items-center gap-2">
                  <input className={`${inputCls} flex-1`} maxLength={160} value={pickTitle} onChange={(e) => setPickTitle(e.target.value)} placeholder={t('ph_doc_title')} />
                  <Button variant="primary" disabled={progress !== null} onClick={doUpload}>
                    {progress !== null ? `${Math.round(progress)}%` : t('sp_upload_btn')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title={t('sp_notes')}>
          <textarea className={inputCls} rows={3} maxLength={3000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Card>

        {error && <Alert>{error}</Alert>}
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} />
            {t('sp_declaration')}
          </label>
          <Button variant="primary" disabled={busy || !declaration || !company.trim() || !contactName.trim() || !pctOk || progress !== null} onClick={submit}>
            {busy ? t('sp_sending') : form.submitted || done ? t('sp_update') : t('sp_submit')}
          </Button>
          <p className="text-xs text-slate-500">{t('sp_privacy', { company: form.companyName })}</p>
        </div>
      </main>
    </>
  )
}
