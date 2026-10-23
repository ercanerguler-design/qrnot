'use client'

import { useCallback, useEffect, useState } from 'react'
import { CARBON_FACTORS, CARBON_SOURCES, estimateCarbon, guessMaterialType, type CarbonFactorKey, type MaterialTypeChoice } from '@/lib/dpp/carbon'
import type { MsgKey } from '@/lib/dpp/i18n'
import {
  DPP_CATEGORIES,
  DPP_DOC_KINDS,
  DPP_LANG_NAMES,
  DPP_LANGS,
  emptyData,
  emptyTexts,
  publishIssues,
  type DppCategory,
  type DppData,
  type DppDocKind,
  type DppLang,
  type DppMaterial,
  type DppParty,
  type DppTextKey,
  type DppTexts,
} from '@/lib/dpp/types'
import { useT } from './i18n'
import ItemsPanel from './ItemsPanel'
import type { Me, View } from './PanelApp'
import QrBox from './QrBox'
import SectorEditor from './SectorEditor'
import { sectorFor } from '@/lib/dpp/sectors'
import SuppliersPanel from './SuppliersPanel'
import { Alert, api, Button, Card, Field, FilePicker, inputCls, StatusBadge, uploadFile } from './ui'

interface Bundle {
  id: string
  publicId: string
  status: string
  defaultLang: DppLang
  texts: Partial<Record<DppLang, DppTexts>>
  data: DppData
  hasImage: boolean
  version: number
  revision: number
  hasChanges: boolean
  publishedAt: string | null
  updatedAt: string
  documents: Array<{ id: string; title: string; kind: DppDocKind; visibility: string; content_type: string; size_bytes: number; created_at: string }>
  versions: Array<{ version: number; published_by: string; created_at: string }>
  itemCount: number
  passportUrl: string
  digitalLink: string | null
}

type Tab = 'general' | 'sector' | 'materials' | 'care' | 'compliance' | 'langs' | 'docs' | 'suppliers' | 'items' | 'versions'
const TABS: Array<[Tab, MsgKey, boolean]> = [
  ['general', 'tab_general', false],
  ['sector', 'tab_sector_battery', false],
  ['materials', 'tab_materials', false],
  ['care', 'tab_care', false],
  ['compliance', 'tab_compliance', false],
  ['langs', 'tab_langs', false],
  ['docs', 'tab_docs', true],
  ['suppliers', 'tab_suppliers', true],
  ['items', 'tab_items', true],
  ['versions', 'tab_versions', true],
]

const COUNTRIES = ['TR', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'PT', 'BE', 'AT', 'GR', 'BG', 'RO', 'CN', 'IN', 'BD', 'VN', 'PK', 'EG', 'MA', 'US', 'GB']
const COMPLIANCE_PRESETS = ['CE', 'OEKO-TEX Standard 100', 'GOTS', 'GRS', 'REACH', 'RoHS', 'FSC', 'ISO 9001', 'ISO 14001', 'EU Ecolabel']

const num = (v: number | null) => (v === null || v === undefined ? '' : String(v))
const toNum = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

export default function ProductEditor({ productId, initialTab, go, me }: { productId: string | null; initialTab?: string; go: (v: View) => void; me: Me }) {
  const { t, lang, labels, date, number } = useT()
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [texts, setTexts] = useState<Partial<Record<DppLang, DppTexts>>>({ [lang]: emptyTexts() })
  const [data, setData] = useState<DppData>(emptyData())
  const [defaultLang, setDefaultLang] = useState<DppLang>(lang)
  const [newImage, setNewImage] = useState<{ url: string; preview: string } | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<Tab>(() => (productId && TABS.some(([k]) => k === initialTab) ? (initialTab as Tab) : 'general'))
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [translation, setTranslation] = useState(false)
  const [loading, setLoading] = useState(Boolean(productId))
  const readOnly = me.role === 'viewer'

  const load = useCallback(async (id: string) => {
    const res = await api<{ product: Bundle; translation: boolean }>('product.get', { id })
    setBundle(res.product)
    setTranslation(res.translation)
    setTexts(Object.keys(res.product.texts).length ? res.product.texts : { [res.product.defaultLang]: emptyTexts() })
    setData(res.product.data)
    setDefaultLang(res.product.defaultLang)
    setNewImage(null)
    setRemoveImage(false)
    setDirty(false)
  }, [])

  useEffect(() => {
    if (!productId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(productId)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [productId, load])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const tx = texts[defaultLang] || emptyTexts()
  // Kategoriye özel pasaport modülü (batarya / tekstil / mobilya)
  const sector = sectorFor(data.category)
  const setText = (l: DppLang, key: DppTextKey, value: string) => {
    setTexts((cur) => ({ ...cur, [l]: { ...(cur[l] || emptyTexts()), [key]: value } }))
    setDirty(true)
  }
  const setMaterialName = (l: DppLang, index: number, value: string) => {
    setTexts((cur) => {
      const base = cur[l] || emptyTexts()
      const names = [...(base.materialNames || [])]
      while (names.length <= index) names.push('')
      names[index] = value
      return { ...cur, [l]: { ...base, materialNames: names } }
    })
    setDirty(true)
  }
  const patch = (p: Partial<DppData>) => {
    setData((cur) => ({ ...cur, ...p }))
    setDirty(true)
  }

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(label)
    setError(null)
    setNotice(null)
    try {
      await task()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_generic'))
    } finally {
      setBusy(null)
    }
  }

  const save = async (): Promise<string> => {
    const res = await api<{ id: string }>('product.save', {
      id: bundle?.id || null,
      defaultLang,
      texts,
      data,
      imageUrl: newImage?.url || undefined,
      removeImage,
      // Arada başkası kaydettiyse sunucu 409 döner; değişiklik sessizce ezilmez
      revision: bundle ? bundle.revision : undefined,
    })
    await load(res.id)
    // Yeni ürün: bileşeni yeniden kurmadan adresi güncelle (yenileme / geri tuşu doğru ürüne dönsün)
    if (!bundle) window.history.replaceState(null, '', `?v=product&id=${res.id}`)
    return res.id
  }

  const issues = publishIssues(texts, defaultLang, data).map((i) => t(i.key, i.params))

  if (loading) return <p className="text-slate-500">{t('loading')}</p>
  if (productId && !bundle && error) return <Alert>{error}</Alert>

  const imageSrc = newImage?.preview || (!removeImage && bundle?.hasImage ? `/api/dpp/image?id=${bundle.id}&v=${encodeURIComponent(bundle.updatedAt)}` : null)
  const canPublish = !(Boolean(bundle?.version) && !dirty && !bundle?.hasChanges)

  return (
    <div className="space-y-5">
      {/* Başlık ve işlemler */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button type="button" className="text-sm text-slate-500 hover:text-slate-800" onClick={() => (!dirty || window.confirm(t('ed_confirm_leave'))) && go({ page: 'products' })}>
            ← {t('nav_products')}
          </button>
          <h1 className="mt-1 truncate text-2xl font-bold">{tx.name || t('ed_new_title')}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {bundle ? <StatusBadge status={bundle.status} changes={bundle.version > 0 && (dirty || bundle.hasChanges)} /> : <StatusBadge status="draft" />}
            {bundle && bundle.version > 0 && (
              <span>
                v{bundle.version} · {date(bundle.publishedAt, true)}
              </span>
            )}
            {dirty && <span className="font-semibold text-amber-700">{t('ed_unsaved')}</span>}
          </div>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {bundle?.version ? (
              <a href={bundle.passportUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                {t('ed_open_passport')}
              </a>
            ) : null}
            <Button
              onClick={() =>
                void run('save', async () => {
                  await save()
                  setNotice(bundle?.version ? t('ed_saved_need_publish') : t('ed_saved'))
                })
              }
              disabled={busy !== null || (!dirty && Boolean(bundle))}
            >
              {busy === 'save' ? t('saving') : t('save')}
            </Button>
            <Button
              variant="success"
              disabled={busy !== null || issues.length > 0 || bundle?.status === 'archived' || !canPublish}
              title={issues.length ? t('ed_missing_title', { list: issues.join(', ') }) : undefined}
              onClick={() =>
                void run('publish', async () => {
                  const id = dirty || !bundle ? await save() : bundle.id
                  const res = await api<{ version: number }>('product.publish', { id })
                  await load(id)
                  setNotice(t('ed_published_notice', { v: res.version }))
                })
              }
            >
              {busy === 'publish' ? t('ed_publishing') : bundle?.version ? (canPublish ? t('ed_publish_update') : t('ed_live')) : t('ed_publish')}
            </Button>
            {bundle && (
              <details className="relative">
                <summary className="inline-flex cursor-pointer list-none items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">⋯</summary>
                <div className="absolute end-0 z-20 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-1 text-sm shadow-lg">
                  <MenuItem
                    onClick={() =>
                      void run('dup', async () => {
                        const res = await api<{ id: string }>('product.duplicate', { id: bundle.id })
                        go({ page: 'product', id: res.id })
                      })
                    }
                  >
                    {t('ed_duplicate')}
                  </MenuItem>
                  <MenuItem
                    onClick={() =>
                      void run('archive', async () => {
                        const archived = bundle.status !== 'archived'
                        if (archived && !window.confirm(t('ed_confirm_archive'))) return
                        await api('product.archive', { id: bundle.id, archived })
                        await load(bundle.id)
                      })
                    }
                  >
                    {bundle.status === 'archived' ? t('ed_unarchive') : t('ed_archive')}
                  </MenuItem>
                  {bundle.version === 0 && (
                    <MenuItem
                      danger
                      onClick={() =>
                        void run('delete', async () => {
                          if (!window.confirm(t('ed_confirm_delete'))) return
                          await api('product.delete', { id: bundle.id })
                          go({ page: 'products' })
                        })
                      }
                    >
                      {t('ed_delete_draft')}
                    </MenuItem>
                  )}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      {!readOnly && issues.length > 0 && (
        <Alert tone="warn">
          <b>{t('ed_publish_missing')}</b> {issues.join(' · ')}
        </Alert>
      )}
      {readOnly && <Alert tone="info">{t('ed_viewer_notice')}</Alert>}
      {bundle?.status === 'archived' && <Alert tone="warn">{t('ed_archived_notice')}</Alert>}

      {/* Sekmeler */}
      <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4">
        {TABS.filter(([key]) => key !== 'sector' || sector).map(([key, label, needsSaved]) => (
          <button
            key={key}
            type="button"
            disabled={needsSaved && !bundle}
            title={needsSaved && !bundle ? t('ed_save_first') : undefined}
            onClick={() => setTab(key)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              tab === key ? 'border-[#0f3d5e] text-[#0f3d5e]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {key === 'sector' && sector ? t(`tab_sector_${sector}` as MsgKey) : t(label)}
            {key === 'docs' && bundle ? ` (${bundle.documents.length})` : ''}
            {key === 'items' && bundle ? ` (${bundle.itemCount.toLocaleString()})` : ''}
          </button>
        ))}
      </div>

      <fieldset disabled={readOnly} className="min-w-0 space-y-5">
        {tab === 'general' && (
          <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
            <Card title={t('ed_info_title')} subtitle={t('ed_info_sub', { lang: DPP_LANG_NAMES[defaultLang] })}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('f_name')} className="sm:col-span-2">
                  <input className={inputCls} value={tx.name} maxLength={200} onChange={(e) => setText(defaultLang, 'name', e.target.value)} placeholder={t('ph_name')} />
                </Field>
                <Field label={t('f_description')} className="sm:col-span-2">
                  <textarea className={`${inputCls} min-h-28`} value={tx.description} maxLength={4000} onChange={(e) => setText(defaultLang, 'description', e.target.value)} />
                </Field>
                <Field label={t('f_brand')}>
                  <input className={inputCls} value={data.brand} maxLength={120} onChange={(e) => patch({ brand: e.target.value })} />
                </Field>
                <Field label={t('f_model')}>
                  <input className={inputCls} value={data.model} maxLength={120} onChange={(e) => patch({ model: e.target.value })} />
                </Field>
                <Field label={t('f_gtin')} hint={t('hint_gtin')}>
                  <input className={`${inputCls} font-mono`} dir="ltr" inputMode="numeric" value={data.gtin} maxLength={14} onChange={(e) => patch({ gtin: e.target.value.replace(/\D/g, '') })} />
                </Field>
                <Field label={t('f_category')}>
                  <select className={inputCls} value={data.category} onChange={(e) => patch({ category: e.target.value as DppCategory })}>
                    {Object.keys(DPP_CATEGORIES).map((k) => (
                      <option key={k} value={k}>
                        {labels.categories[k as DppCategory]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('f_origin')}>
                  <CountrySelect value={data.countryOfOrigin} onChange={(v) => patch({ countryOfOrigin: v })} />
                </Field>
                <Field label={t('f_default_lang')}>
                  <select
                    className={inputCls}
                    value={defaultLang}
                    onChange={(e) => {
                      const l = e.target.value as DppLang
                      setDefaultLang(l)
                      setTexts((cur) => (cur[l] ? cur : { ...cur, [l]: { ...emptyTexts(), ...(cur[defaultLang] || {}) } }))
                      setDirty(true)
                    }}
                  >
                    {DPP_LANGS.map((l) => (
                      <option key={l} value={l}>
                        {DPP_LANG_NAMES[l]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('f_weight')}>
                  <input className={inputCls} inputMode="decimal" value={num(data.weightGrams)} onChange={(e) => patch({ weightGrams: toNum(e.target.value) })} />
                </Field>
                <Field label={t('f_dimensions')}>
                  <input className={inputCls} value={data.dimensions} maxLength={120} placeholder={t('ph_dimensions')} onChange={(e) => patch({ dimensions: e.target.value })} />
                </Field>
              </div>
            </Card>
            <div className="space-y-5">
              <Card title={t('img_title')}>
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageSrc} alt="" className="aspect-square w-full rounded-xl border border-slate-200 object-contain" />
                ) : (
                  <div className="grid aspect-square w-full place-items-center rounded-xl border border-dashed border-slate-300 text-4xl text-slate-300">📷</div>
                )}
                {!readOnly && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center rounded-xl bg-[#0f3d5e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0b2f49]">
                      {busy === 'image' ? t('loading') : imageSrc ? t('img_change') : t('img_upload')}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          e.target.value = ''
                          if (!file) return
                          void run('image', async () => {
                            if (file.size > 25 * 1024 * 1024) throw new Error(t('err_img_size'))
                            const url = await uploadFile(me.companyId, file)
                            setNewImage({ url, preview: URL.createObjectURL(file) })
                            setRemoveImage(false)
                            setDirty(true)
                          })
                        }}
                      />
                    </label>
                    {imageSrc && (
                      <Button size="sm" variant="ghost" onClick={() => (setNewImage(null), setRemoveImage(true), setDirty(true))}>
                        {t('img_remove')}
                      </Button>
                    )}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-500">{t('img_hint')}</p>
              </Card>
              {bundle && (
                <Card title={t('qr_title')} subtitle={t('qr_sub')}>
                  <QrBox url={bundle.passportUrl} filename={`dpp-${bundle.publicId}`} />
                  {!bundle.version && <p className="mt-2 text-xs text-amber-700">{t('qr_unpublished')}</p>}
                  {bundle.digitalLink && (
                    <p className="mt-2 break-all text-xs text-slate-500" dir="ltr">
                      GS1 Digital Link: {bundle.digitalLink}
                    </p>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === 'sector' && sector && <SectorEditor sector={sector} value={data.sector || {}} onChange={(v) => patch({ sector: v })} />}

        {tab === 'materials' && (
          <>
            <MaterialsEditor materials={data.materials} onChange={(materials) => patch({ materials })} />
            <CarbonEstimator
              materials={data.materials}
              weightGrams={data.weightGrams}
              onTypes={(materials) => patch({ materials })}
              onApply={(e) => patch({ environment: { ...data.environment, carbonKg: e.mid, carbonMin: e.min, carbonMax: e.max, carbonBasis: 'estimate' } })}
            />
            <Card title={t('env_title')} subtitle={t('env_sub')}>
              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ['carbonKg', 'env_carbon'],
                    ['waterLiters', 'env_water'],
                    ['energyKwh', 'env_energy'],
                    ['recycledContentPercent', 'env_recycled'],
                    ['recyclablePercent', 'env_recyclable'],
                    ['expectedLifetimeYears', 'env_lifetime'],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} label={t(label)}>
                    <input
                      className={inputCls}
                      inputMode="decimal"
                      value={num(data.environment[key])}
                      onChange={(e) =>
                        patch({
                          environment: {
                            ...data.environment,
                            [key]: toNum(e.target.value),
                            // Elle değiştirilen karbon değeri artık tahmin değil, firma beyanıdır
                            ...(key === 'carbonKg' ? { carbonBasis: 'declared' as const, carbonMin: null, carbonMax: null } : {}),
                          },
                        })
                      }
                    />
                  </Field>
                ))}
              </div>
              {data.environment.carbonBasis === 'estimate' && data.environment.carbonMin !== null && data.environment.carbonMax !== null && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {t('cb_basis_estimate', { min: number(data.environment.carbonMin), max: number(data.environment.carbonMax) })}
                </p>
              )}
            </Card>
          </>
        )}

        {tab === 'care' && (
          <>
            <Card title={t('care_title')}>
              <Field label={t('f_care')} hint={t('hint_care')}>
                <textarea className={`${inputCls} min-h-28`} value={tx.care} onChange={(e) => setText(defaultLang, 'care', e.target.value)} />
              </Field>
            </Card>
            <Card title={t('repair_title')}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t('f_warranty')}>
                  <input className={inputCls} inputMode="numeric" value={num(data.repairability.warrantyMonths)} onChange={(e) => patch({ repairability: { ...data.repairability, warrantyMonths: toNum(e.target.value) } })} />
                </Field>
                <Field label={t('f_spare')}>
                  <input className={inputCls} inputMode="numeric" value={num(data.repairability.sparePartsYears)} onChange={(e) => patch({ repairability: { ...data.repairability, sparePartsYears: toNum(e.target.value) } })} />
                </Field>
                <Field label={t('f_repair_score')}>
                  <input className={inputCls} inputMode="decimal" value={num(data.repairability.repairScore)} onChange={(e) => patch({ repairability: { ...data.repairability, repairScore: toNum(e.target.value) } })} />
                </Field>
                <Field label={t('f_service')} className="sm:col-span-3">
                  <input className={inputCls} dir="ltr" placeholder="https://" value={data.repairability.serviceUrl} onChange={(e) => patch({ repairability: { ...data.repairability, serviceUrl: e.target.value } })} />
                </Field>
                <Field label={t('f_repair')} className="sm:col-span-3">
                  <textarea className={`${inputCls} min-h-24`} value={tx.repair} onChange={(e) => setText(defaultLang, 'repair', e.target.value)} />
                </Field>
              </div>
            </Card>
            <Card title={t('eol_title')}>
              <Field label={t('f_eol')} hint={t('hint_eol')}>
                <textarea className={`${inputCls} min-h-24`} value={tx.endOfLife} onChange={(e) => setText(defaultLang, 'endOfLife', e.target.value)} />
              </Field>
            </Card>
            <Card title={t('safety_title')}>
              <div className="grid gap-4">
                <Field label={t('f_safety')}>
                  <textarea className={`${inputCls} min-h-20`} value={tx.safety} onChange={(e) => setText(defaultLang, 'safety', e.target.value)} />
                </Field>
                <Field label={t('f_svhc')} hint={t('hint_svhc')}>
                  <textarea className={`${inputCls} min-h-20`} value={data.substancesOfConcern} onChange={(e) => patch({ substancesOfConcern: e.target.value })} />
                </Field>
              </div>
            </Card>
          </>
        )}

        {tab === 'compliance' && (
          <>
            <ComplianceEditor items={data.compliance} onChange={(compliance) => patch({ compliance })} />
            <div className="grid gap-5 lg:grid-cols-2">
              <PartyEditor title={t('party_manufacturer')} party={data.manufacturer} onChange={(manufacturer) => patch({ manufacturer })} />
              <PartyEditor title={t('party_eu')} subtitle={t('party_eu_sub')} party={data.euOperator} onChange={(euOperator) => patch({ euOperator })} />
            </div>
            <Card title={t('restr_title')} subtitle={t('restr_sub')}>
              <div className="grid gap-4">
                <Field label={t('f_suppliers')}>
                  <textarea className={`${inputCls} min-h-20`} value={data.restricted.suppliers} onChange={(e) => patch({ restricted: { ...data.restricted, suppliers: e.target.value } })} />
                </Field>
                <Field label={t('f_facility')}>
                  <textarea className={`${inputCls} min-h-16`} value={data.restricted.facility} onChange={(e) => patch({ restricted: { ...data.restricted, facility: e.target.value } })} />
                </Field>
                <Field label={t('f_notes')}>
                  <textarea className={`${inputCls} min-h-20`} value={data.restricted.notes} onChange={(e) => patch({ restricted: { ...data.restricted, notes: e.target.value } })} />
                </Field>
              </div>
            </Card>
          </>
        )}

        {tab === 'langs' && (
          <LanguagesEditor
            texts={texts}
            defaultLang={defaultLang}
            setText={setText}
            materials={data.materials.map((m) => m.name)}
            setMaterialName={setMaterialName}
            translation={translation}
            canTranslate={Boolean(bundle) && !readOnly}
            busy={busy === 'translate'}
            onTranslate={(langs) =>
              void run('translate', async () => {
                if (!bundle) return
                if (dirty) await save()
                const res = await api<{ done: DppLang[]; failed: DppLang[] }>('product.translate', { id: bundle.id, langs })
                await load(bundle.id)
                const names = (ls: DppLang[]) => ls.map((l) => DPP_LANG_NAMES[l]).join(', ')
                setNotice([t('tr_done', { list: names(res.done) }), res.failed.length ? t('tr_failed', { list: names(res.failed) }) : '', t('tr_review')].filter(Boolean).join(' '))
              })
            }
          />
        )}

        {tab === 'docs' && bundle && <DocumentsEditor bundle={bundle} me={me} readOnly={readOnly} reload={() => load(bundle.id)} />}
        {tab === 'suppliers' && bundle && (
          <SuppliersPanel productId={bundle.id} productName={tx.name} companyName={me.companyName} readOnly={readOnly} dirty={dirty} onApplied={() => load(bundle.id)} />
        )}
        {tab === 'items' && bundle && (
          <ItemsPanel productId={bundle.id} productName={tx.name} gtin={data.gtin} published={bundle.version > 0} readOnly={readOnly} battery={sector === 'battery'} onChange={() => load(bundle.id)} />
        )}
        {tab === 'versions' && bundle && (
          <Card title={t('tab_versions')} subtitle={t('ver_sub')}>
            {bundle.versions.length === 0 ? (
              <p className="text-sm text-slate-500">{t('ver_none')}</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {bundle.versions.map((v) => (
                  <li key={v.version} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      <b>{t('ver_label', { v: v.version })}</b>
                      {v.version === bundle.version && <span className="ms-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">{t('st_published')}</span>}
                    </span>
                    <span className="text-slate-500">
                      {date(v.created_at, true)} · {v.published_by}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </fieldset>
    </div>
  )
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`block w-full rounded-xl px-3 py-2 text-start hover:bg-slate-100 ${danger ? 'text-red-700' : ''}`}>
      {children}
    </button>
  )
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t, lang } = useT()
  const region = new Intl.DisplayNames([lang], { type: 'region' })
  const codes = COUNTRIES.includes(value) || !value ? COUNTRIES : [value, ...COUNTRIES]
  return (
    <div className="flex gap-2">
      <select className={inputCls} value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('choose')}</option>
        {codes.map((c) => (
          <option key={c} value={c}>
            {region.of(c)} ({c})
          </option>
        ))}
      </select>
      <input className={`${inputCls} w-20 font-mono uppercase`} dir="ltr" maxLength={2} value={value} title={t('iso_hint')} onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} />
    </div>
  )
}

function MaterialsEditor({ materials, onChange }: { materials: DppMaterial[]; onChange: (m: DppMaterial[]) => void }) {
  const { t } = useT()
  const total = materials.reduce((s, m) => s + (m.percent || 0), 0)
  const set = (i: number, p: Partial<DppMaterial>) => onChange(materials.map((m, j) => (j === i ? { ...m, ...p } : m)))
  return (
    <Card
      title={t('mat_title')}
      subtitle={t('mat_sub')}
      actions={
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${materials.length === 0 ? 'bg-slate-100 text-slate-500' : Math.abs(total - 100) <= 0.5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {t('mat_total', { n: Math.round(total * 10) / 10 })}
        </span>
      }
    >
      <div className="space-y-2">
        {materials.length > 0 && (
          <div className="hidden grid-cols-[1fr_6rem_8rem_10rem_2.5rem] gap-2 text-xs font-semibold text-slate-500 sm:grid">
            <span>{t('mat_name')}</span>
            <span>{t('mat_pct')}</span>
            <span>{t('mat_recycled')}</span>
            <span>{t('mat_origin')}</span>
            <span />
          </div>
        )}
        {materials.map((m, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-[1fr_6rem_8rem_10rem_2.5rem] sm:border-0 sm:p-0">
            <input className={`${inputCls} col-span-2 sm:col-span-1`} placeholder={t('ph_material')} value={m.name} onChange={(e) => set(i, { name: e.target.value })} />
            <input className={inputCls} inputMode="decimal" placeholder="%" value={num(m.percent)} onChange={(e) => set(i, { percent: toNum(e.target.value) })} />
            <input className={inputCls} inputMode="decimal" placeholder="%" value={num(m.recycledPercent)} onChange={(e) => set(i, { recycledPercent: toNum(e.target.value) })} />
            <input className={inputCls} placeholder={t('ph_origin')} value={m.origin} onChange={(e) => set(i, { origin: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => onChange(materials.filter((_, j) => j !== i))} aria-label={t('delete_row')}>
              ✕
            </Button>
          </div>
        ))}
        <Button size="sm" onClick={() => onChange([...materials, { name: '', percent: null, recycledPercent: null, origin: '' }])}>
          {t('mat_add')}
        </Button>
      </div>
    </Card>
  )
}

const CARBON_TYPES = Object.keys(CARBON_FACTORS) as CarbonFactorKey[]

function CarbonEstimator({
  materials,
  weightGrams,
  onTypes,
  onApply,
}: {
  materials: DppMaterial[]
  weightGrams: number | null
  onTypes: (m: DppMaterial[]) => void
  onApply: (e: { min: number; max: number; mid: number }) => void
}) {
  const { t, number } = useT()
  const [applied, setApplied] = useState(false)
  const est = estimateCarbon(materials, weightGrams)
  const typeLabel = (k: CarbonFactorKey) => t(`cb_t_${k}` as MsgKey)
  const rows = materials.map((m, i) => ({ m, i })).filter(({ m }) => m.name.trim())
  return (
    <Card title={t('cb_title')} subtitle={t('cb_sub')}>
      <div className="space-y-3">
        {rows.length > 0 && (
          <div className="space-y-2">
            {rows.map(({ m, i }) => {
              const guess = guessMaterialType(m.name)
              return (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_20rem] sm:items-center">
                  <span className="text-sm text-slate-700">
                    {m.name}
                    {m.percent !== null && <span className="text-slate-400"> · {number(m.percent)}%</span>}
                  </span>
                  <select
                    className={inputCls}
                    aria-label={t('cb_type')}
                    value={m.type || ''}
                    onChange={(e) => {
                      setApplied(false)
                      onTypes(materials.map((x, j) => (j === i ? { ...x, type: e.target.value as MaterialTypeChoice } : x)))
                    }}
                  >
                    <option value="">{guess ? t('cb_auto', { t: typeLabel(guess) }) : t('cb_auto_none')}</option>
                    {CARBON_TYPES.map((k) => (
                      <option key={k} value={k}>
                        {typeLabel(k)}
                      </option>
                    ))}
                    <option value="none">{t('cb_none')}</option>
                  </select>
                </div>
              )
            })}
          </div>
        )}
        {!est || est.coveredPercent === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{est ? t('cb_unknown', { list: est.unknown.join(', ') }) : t('cb_need')}</p>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
            <p className="font-semibold">{t('cb_result', { min: number(est.min), max: number(est.max), mid: number(est.mid) })}</p>
            <p className="mt-1">{t('cb_coverage', { p: number(est.coveredPercent) })}</p>
            {est.unknown.length > 0 && <p className="mt-1 text-amber-800">{t('cb_unknown', { list: est.unknown.join(', ') })}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                onClick={() => {
                  onApply(est)
                  setApplied(true)
                }}
              >
                {t('cb_apply')}
              </Button>
              {applied && <span className="text-emerald-800">{t('cb_applied')}</span>}
            </div>
          </div>
        )}
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer">{t('cb_sources')}</summary>
          <ul className="mt-2 space-y-1">
            {CARBON_TYPES.map((k) => (
              <li key={k} dir="ltr">
                {typeLabel(k)}: {number(CARBON_FACTORS[k].min)}–{number(CARBON_FACTORS[k].max)} kg CO₂e/kg
              </li>
            ))}
            {CARBON_SOURCES.map((src) => (
              <li key={src.url}>
                <a className="underline" href={src.url} target="_blank" rel="noopener noreferrer">
                  {src.name}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </Card>
  )
}

function ComplianceEditor({ items, onChange }: { items: DppData['compliance']; onChange: (c: DppData['compliance']) => void }) {
  const { t } = useT()
  const set = (i: number, p: Partial<DppData['compliance'][number]>) => onChange(items.map((c, j) => (j === i ? { ...c, ...p } : c)))
  const missing = COMPLIANCE_PRESETS.filter((p) => !items.some((c) => c.name === p))
  return (
    <Card title={t('comp_title')} subtitle={t('comp_sub')}>
      <div className="space-y-2">
        {items.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_2.5rem] gap-2">
            <input className={inputCls} placeholder={t('ph_comp_name')} value={c.name} onChange={(e) => set(i, { name: e.target.value })} />
            <input className={inputCls} placeholder={t('ph_comp_ref')} value={c.reference} onChange={(e) => set(i, { reference: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={t('delete')}>
              ✕
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {missing.map((p) => (
            <button key={p} type="button" onClick={() => onChange([...items, { name: p, reference: '' }])} className="rounded-full border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50">
              ＋ {p}
            </button>
          ))}
          <button type="button" onClick={() => onChange([...items, { name: '', reference: '' }])} className="rounded-full border border-dashed border-slate-400 px-2.5 py-1 text-xs hover:bg-slate-50">
            {t('comp_other')}
          </button>
        </div>
      </div>
    </Card>
  )
}

function PartyEditor({ title, subtitle, party, onChange }: { title: string; subtitle?: string; party: DppParty; onChange: (p: DppParty) => void }) {
  const { t } = useT()
  return (
    <Card title={title} subtitle={subtitle}>
      <div className="grid gap-3">
        <Field label={t('f_party_name')}>
          <input className={inputCls} value={party.name} onChange={(e) => onChange({ ...party, name: e.target.value })} />
        </Field>
        <Field label={t('f_address')}>
          <textarea className={`${inputCls} min-h-16`} value={party.address} onChange={(e) => onChange({ ...party, address: e.target.value })} />
        </Field>
        <Field label={t('f_contact')}>
          <input className={inputCls} value={party.contact} onChange={(e) => onChange({ ...party, contact: e.target.value })} />
        </Field>
      </div>
    </Card>
  )
}

function LanguagesEditor({
  texts,
  defaultLang,
  setText,
  materials,
  setMaterialName,
  translation,
  canTranslate,
  busy,
  onTranslate,
}: {
  texts: Partial<Record<DppLang, DppTexts>>
  defaultLang: DppLang
  setText: (lang: DppLang, key: DppTextKey, value: string) => void
  materials: string[]
  setMaterialName: (lang: DppLang, index: number, value: string) => void
  translation: boolean
  canTranslate: boolean
  busy: boolean
  onTranslate: (langs: DppLang[]) => void
}) {
  const { t } = useT()
  const others = DPP_LANGS.filter((l) => l !== defaultLang)
  const [lang, setLang] = useState<DppLang>(others[0])
  const [selected, setSelected] = useState<DppLang[]>(others.filter((l) => !texts[l]?.name))
  const tt = texts[lang] || emptyTexts()
  const src = texts[defaultLang] || emptyTexts()
  const fields: Array<[DppTextKey, MsgKey, boolean]> = [
    ['name', 'lf_name', false],
    ['description', 'lf_description', true],
    ['care', 'lf_care', true],
    ['repair', 'lf_repair', true],
    ['endOfLife', 'lf_eol', true],
    ['safety', 'lf_safety', true],
  ]

  return (
    <div className="space-y-5">
      <Card title={t('tr_title')} subtitle={t('tr_sub', { lang: DPP_LANG_NAMES[defaultLang] })}>
        {!translation ? (
          <Alert tone="info">{t('tr_off')}</Alert>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {others.map((l) => (
                <label key={l} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${selected.includes(l) ? 'border-sky-500 bg-sky-50' : 'border-slate-300'}`}>
                  <input type="checkbox" checked={selected.includes(l)} onChange={(e) => setSelected((cur) => (e.target.checked ? [...cur, l] : cur.filter((x) => x !== l)))} />
                  {DPP_LANG_NAMES[l]}
                  {texts[l]?.name ? <span className="text-xs text-emerald-700">✓</span> : null}
                </label>
              ))}
            </div>
            <Button variant="primary" disabled={!canTranslate || busy || selected.length === 0} onClick={() => onTranslate(selected)}>
              {busy ? t('tr_busy') : t('tr_btn', { n: selected.length })}
            </Button>
            {!canTranslate && <p className="text-xs text-slate-500">{t('tr_save_first')}</p>}
          </div>
        )}
      </Card>

      <Card title={t('langs_title')} subtitle={t('langs_sub')}>
        <div className="mb-4 flex flex-wrap gap-1">
          {others.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${lang === l ? 'bg-[#0f3d5e] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {DPP_LANG_NAMES[l]} {texts[l]?.name ? '✓' : ''}
            </button>
          ))}
        </div>
        <div className="grid gap-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {fields.map(([key, label, multi]) => (
            <div key={key} className="grid gap-2 lg:grid-cols-2">
              <Field label={`${t(label)} (${DPP_LANG_NAMES[lang]})`}>
                {multi ? (
                  <textarea className={`${inputCls} min-h-20`} value={tt[key]} onChange={(e) => setText(lang, key, e.target.value)} />
                ) : (
                  <input className={inputCls} value={tt[key]} onChange={(e) => setText(lang, key, e.target.value)} />
                )}
              </Field>
              <div className="hidden lg:block" dir={defaultLang === 'ar' ? 'rtl' : 'ltr'}>
                <span className="mb-1 block text-xs font-semibold text-slate-400">{t('lf_source', { lang: DPP_LANG_NAMES[defaultLang] })}</span>
                <p className="min-h-10 whitespace-pre-line rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">{src[key] || '—'}</p>
              </div>
            </div>
          ))}
          {materials.some(Boolean) && (
            <div className="grid gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-600">{t('lf_materials', { lang: DPP_LANG_NAMES[lang] })}</span>
              {materials.map((name, i) =>
                name ? (
                  <div key={i} className="grid items-center gap-2 lg:grid-cols-2">
                    <input className={inputCls} placeholder={name} value={tt.materialNames?.[i] || ''} onChange={(e) => setMaterialName(lang, i, e.target.value)} />
                    <p className="hidden rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 lg:block" dir={defaultLang === 'ar' ? 'rtl' : 'ltr'}>
                      {name}
                    </p>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function DocumentsEditor({ bundle, me, readOnly, reload }: { bundle: Bundle; me: Me; readOnly: boolean; reload: () => Promise<void> }) {
  const { t, labels } = useT()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<DppDocKind>('certificate')
  const [visibility, setVisibility] = useState<'public' | 'interest' | 'restricted'>('public')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error(t('err_file_size'))
      const blobUrl = await uploadFile(me.companyId, file, setProgress)
      await api('docs.add', { productId: bundle.id, blobUrl, title: title || file.name.replace(/\.[^.]+$/, ''), kind, visibility })
      setTitle('')
      setFile(null)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_upload'))
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="space-y-5">
      {!readOnly && (
        <Card title={t('doc_add_title')} subtitle={t('doc_add_sub')}>
          <div className="grid gap-4">
            <Field label={t('f_file')}>
              <FilePicker accept="application/pdf,image/jpeg,image/png,image/webp" file={file} onChange={setFile} disabled={progress !== null} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t('f_doc_title')}>
                <input className={inputCls} value={title} placeholder={file?.name.replace(/\.[^.]+$/, '') || t('ph_doc_title')} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label={t('f_doc_kind')}>
                <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as DppDocKind)}>
                  {Object.keys(DPP_DOC_KINDS).map((k) => (
                    <option key={k} value={k}>
                      {labels.docKinds[k as DppDocKind]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('f_visibility')}>
                <select className={inputCls} value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'interest' | 'restricted')}>
                  <option value="public">{t('vis_public')}</option>
                  <option value="interest">{t('vis_interest')}</option>
                  <option value="restricted">{t('vis_restricted')}</option>
                </select>
              </Field>
            </div>
          </div>
          {error && (
            <div className="mt-3">
              <Alert>{error}</Alert>
            </div>
          )}
          <Button variant="primary" className="mt-4" disabled={!file || progress !== null} onClick={() => void add()}>
            {progress !== null ? t('doc_uploading', { n: Math.round(progress) }) : t('doc_add_btn')}
          </Button>
        </Card>
      )}
      <Card title={t('tab_docs')}>
        {bundle.documents.length === 0 ? (
          <p className="text-sm text-slate-500">{t('docs_none')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {bundle.documents.map((d) => (
              <DocRow key={d.id} doc={d} readOnly={readOnly} reload={reload} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function DocRow({ doc, readOnly, reload }: { doc: Bundle['documents'][number]; readOnly: boolean; reload: () => Promise<void> }) {
  const { t, labels, date, number } = useT()
  const [busy, setBusy] = useState(false)
  const update = async (patch: Record<string, unknown>) => {
    setBusy(true)
    try {
      await api('docs.update', { id: doc.id, title: doc.title, kind: doc.kind, visibility: doc.visibility, ...patch })
      await reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('err_update'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
      <a href={`/api/dpp/doc/${doc.id}`} target="_blank" rel="noopener noreferrer" className="min-w-0 hover:text-sky-700">
        <p className="truncate font-semibold">📄 {doc.title}</p>
        <p className="text-xs text-slate-500">
          {labels.docKinds[doc.kind] || doc.kind} · {number(Math.max(1, Math.round(doc.size_bytes / 1024)))} KB · {date(doc.created_at)}
        </p>
      </a>
      {!readOnly && (
        <div className="flex items-center gap-2">
          <select className={`${inputCls} w-auto py-1 text-xs`} value={doc.visibility} disabled={busy} onChange={(e) => void update({ visibility: e.target.value })}>
            <option value="public">{t('vis_public')}</option>
            <option value="interest">{t('tier_interest')}</option>
            <option value="restricted">{t('vis_restricted_short')}</option>
          </select>
          <Button
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm(t('doc_confirm_delete', { title: doc.title }))) return
              setBusy(true)
              try {
                await api('docs.delete', { id: doc.id })
                await reload()
              } finally {
                setBusy(false)
              }
            }}
          >
            {t('delete')}
          </Button>
        </div>
      )}
    </li>
  )
}
