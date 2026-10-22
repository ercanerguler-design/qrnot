'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DPP_CATEGORIES,
  DPP_DOC_KINDS,
  DPP_LANG_NAMES,
  DPP_LANGS,
  emptyData,
  emptyTexts,
  publishIssues,
  type DppData,
  type DppDocKind,
  type DppLang,
  type DppMaterial,
  type DppParty,
  type DppTextKey,
  type DppTexts,
} from '@/lib/dpp/types'
import ItemsPanel from './ItemsPanel'
import type { Me, View } from './PanelApp'
import QrBox from './QrBox'
import { Alert, api, Button, Card, Field, fmtDate, inputCls, StatusBadge, uploadFile } from './ui'

interface Bundle {
  id: string
  publicId: string
  status: string
  defaultLang: DppLang
  texts: Partial<Record<DppLang, DppTexts>>
  data: DppData
  hasImage: boolean
  version: number
  hasChanges: boolean
  publishedAt: string | null
  updatedAt: string
  documents: Array<{ id: string; title: string; kind: DppDocKind; visibility: string; content_type: string; size_bytes: number; created_at: string }>
  versions: Array<{ version: number; published_by: string; created_at: string }>
  itemCount: number
  passportUrl: string
  digitalLink: string | null
}

type Tab = 'general' | 'materials' | 'care' | 'compliance' | 'langs' | 'docs' | 'items' | 'versions'
const TABS: Array<[Tab, string, boolean]> = [
  ['general', 'Genel', false],
  ['materials', 'Malzeme ve çevre', false],
  ['care', 'Kullanım ve onarım', false],
  ['compliance', 'Uygunluk ve operatörler', false],
  ['langs', 'Diller', false],
  ['docs', 'Belgeler', true],
  ['items', 'Seri no ve QR', true],
  ['versions', 'Yayın geçmişi', true],
]

const COUNTRIES = ['TR', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'PT', 'BE', 'AT', 'GR', 'BG', 'RO', 'CN', 'IN', 'BD', 'VN', 'PK', 'EG', 'MA', 'US', 'GB']
const COMPLIANCE_PRESETS = ['CE', 'OEKO-TEX Standard 100', 'GOTS', 'GRS', 'REACH', 'RoHS', 'FSC', 'ISO 9001', 'ISO 14001', 'EU Ecolabel']

const num = (v: number | null) => (v === null || v === undefined ? '' : String(v))
const toNum = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

export default function ProductEditor({ productId, go, me }: { productId: string | null; go: (v: View) => void; me: Me }) {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [texts, setTexts] = useState<Partial<Record<DppLang, DppTexts>>>({ tr: emptyTexts() })
  const [data, setData] = useState<DppData>(emptyData())
  const [defaultLang, setDefaultLang] = useState<DppLang>('tr')
  const [newImage, setNewImage] = useState<{ url: string; preview: string } | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<Tab>('general')
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

  const t = texts[defaultLang] || emptyTexts()
  const setText = (lang: DppLang, key: DppTextKey, value: string) => {
    setTexts((cur) => ({ ...cur, [lang]: { ...(cur[lang] || emptyTexts()), [key]: value } }))
    setDirty(true)
  }
  const setMaterialName = (lang: DppLang, index: number, value: string) => {
    setTexts((cur) => {
      const base = cur[lang] || emptyTexts()
      const names = [...(base.materialNames || [])]
      while (names.length <= index) names.push('')
      names[index] = value
      return { ...cur, [lang]: { ...base, materialNames: names } }
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
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
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
    })
    await load(res.id)
    // Yeni ürün: bileşeni yeniden kurmadan adresi güncelle (yenileme / geri tuşu doğru ürüne dönsün)
    if (!bundle) window.history.replaceState(null, '', `?v=product&id=${res.id}`)
    return res.id
  }

  const issues = publishIssues(texts, defaultLang, data)

  if (loading) return <p className="text-slate-500">Yükleniyor…</p>
  if (productId && !bundle && error) return <Alert>{error}</Alert>

  const imageSrc = newImage?.preview || (!removeImage && bundle?.hasImage ? `/api/dpp/image?id=${bundle.id}&v=${encodeURIComponent(bundle.updatedAt)}` : null)

  return (
    <div className="space-y-5">
      {/* Başlık ve işlemler */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button type="button" className="text-sm text-slate-500 hover:text-slate-800" onClick={() => (!dirty || window.confirm('Kaydedilmemiş değişiklikler kaybolacak. Çıkılsın mı?')) && go({ page: 'products' })}>
            ← Ürün pasaportları
          </button>
          <h1 className="mt-1 truncate text-2xl font-bold">{t.name || 'Yeni ürün pasaportu'}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {bundle ? <StatusBadge status={bundle.status} changes={bundle.version > 0 && (dirty || bundle.hasChanges)} /> : <StatusBadge status="draft" />}
            {bundle && bundle.version > 0 && (
              <span>
                v{bundle.version} · {fmtDate(bundle.publishedAt, true)}
              </span>
            )}
            {dirty && <span className="font-semibold text-amber-700">● Kaydedilmemiş değişiklik</span>}
          </div>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {bundle?.version ? (
              <a href={bundle.passportUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                Pasaportu aç ↗
              </a>
            ) : null}
            <Button
              onClick={() =>
                void run('save', async () => {
                  await save()
                  setNotice(bundle?.version ? 'Kaydedildi. Ziyaretçilerin görmesi için “Güncellemeyi yayınla”ya bas.' : 'Kaydedildi')
                })
              }
              disabled={busy !== null || (!dirty && Boolean(bundle))}
            >
              {busy === 'save' ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
            <Button
              variant="success"
              disabled={busy !== null || issues.length > 0 || bundle?.status === 'archived' || (Boolean(bundle?.version) && !dirty && !bundle?.hasChanges)}
              title={issues.length ? `Eksik: ${issues.join(', ')}` : undefined}
              onClick={() =>
                void run('publish', async () => {
                  const id = dirty || !bundle ? await save() : bundle.id
                  const res = await api<{ version: number }>('product.publish', { id })
                  await load(id)
                  setNotice(`Yayınlandı · sürüm ${res.version}. Pasaport adresi değişmez; etiketleri yeniden basmana gerek yok.`)
                })
              }
            >
              {busy === 'publish' ? 'Yayınlanıyor…' : bundle?.version ? (dirty || bundle.hasChanges ? 'Güncellemeyi yayınla' : 'Yayında ✓') : 'Yayınla'}
            </Button>
            {bundle && (
              <details className="relative">
                <summary className="inline-flex cursor-pointer list-none items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">⋯</summary>
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1 text-sm shadow-lg">
                  <MenuItem
                    onClick={() =>
                      void run('dup', async () => {
                        const res = await api<{ id: string }>('product.duplicate', { id: bundle.id })
                        go({ page: 'product', id: res.id })
                      })
                    }
                  >
                    📄 Kopyasını oluştur
                  </MenuItem>
                  <MenuItem
                    onClick={() =>
                      void run('archive', async () => {
                        const archived = bundle.status !== 'archived'
                        if (archived && !window.confirm('Ürün arşivlensin mi? Pasaport erişilebilir kalır, “artık üretilmiyor” notu gösterilir.')) return
                        await api('product.archive', { id: bundle.id, archived })
                        await load(bundle.id)
                      })
                    }
                  >
                    {bundle.status === 'archived' ? '↩ Arşivden çıkar' : '🗄 Arşivle (üretim bitti)'}
                  </MenuItem>
                  {bundle.version === 0 && (
                    <MenuItem
                      danger
                      onClick={() =>
                        void run('delete', async () => {
                          if (!window.confirm('Taslak ve tüm belgeleri / seri numaraları kalıcı olarak silinsin mi?')) return
                          await api('product.delete', { id: bundle.id })
                          go({ page: 'products' })
                        })
                      }
                    >
                      🗑 Taslağı sil
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
          <b>Yayın için eksik:</b> {issues.join(' · ')}
        </Alert>
      )}
      {readOnly && <Alert tone="info">İzleyici yetkisiyle görüntülüyorsun; değişiklik yapamazsın.</Alert>}
      {bundle?.status === 'archived' && <Alert tone="warn">Bu ürün arşivde. Pasaport erişilebilir, ziyaretçiye “artık üretilmiyor” notu gösteriliyor.</Alert>}

      {/* Sekmeler */}
      <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4">
        {TABS.map(([key, label, needsSaved]) => (
          <button
            key={key}
            type="button"
            disabled={needsSaved && !bundle}
            title={needsSaved && !bundle ? 'Önce ürünü kaydet' : undefined}
            onClick={() => setTab(key)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              tab === key ? 'border-[#0f3d5e] text-[#0f3d5e]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
            {key === 'docs' && bundle ? ` (${bundle.documents.length})` : ''}
            {key === 'items' && bundle ? ` (${bundle.itemCount.toLocaleString('tr-TR')})` : ''}
          </button>
        ))}
      </div>

      <fieldset disabled={readOnly} className="min-w-0 space-y-5">
        {tab === 'general' && (
          <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
            <Card title="Ürün bilgileri" subtitle={`Metinler ${DPP_LANG_NAMES[defaultLang]} olarak giriliyor. Diğer diller “Diller” sekmesinde.`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ürün adı *" className="sm:col-span-2">
                  <input className={inputCls} value={t.name} maxLength={200} onChange={(e) => setText(defaultLang, 'name', e.target.value)} placeholder="Ör. Organik Pamuk Basic Tişört" />
                </Field>
                <Field label="Ürün açıklaması" className="sm:col-span-2">
                  <textarea className={`${inputCls} min-h-28`} value={t.description} maxLength={4000} onChange={(e) => setText(defaultLang, 'description', e.target.value)} />
                </Field>
                <Field label="Marka *">
                  <input className={inputCls} value={data.brand} maxLength={120} onChange={(e) => patch({ brand: e.target.value })} />
                </Field>
                <Field label="Model / stok kodu (SKU)">
                  <input className={inputCls} value={data.model} maxLength={120} onChange={(e) => patch({ model: e.target.value })} />
                </Field>
                <Field label="GTIN / EAN barkod" hint="8, 12, 13 ya da 14 hane. GS1 standardı gereği 14 haneye tamamlanır (başına 0 eklenir); GS1 Digital Link adresi de çalışır.">
                  <input className={`${inputCls} font-mono`} inputMode="numeric" value={data.gtin} maxLength={14} onChange={(e) => patch({ gtin: e.target.value.replace(/\D/g, '') })} />
                </Field>
                <Field label="Kategori">
                  <select className={inputCls} value={data.category} onChange={(e) => patch({ category: e.target.value as DppData['category'] })}>
                    {Object.entries(DPP_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Menşe ülke *">
                  <CountrySelect value={data.countryOfOrigin} onChange={(v) => patch({ countryOfOrigin: v })} />
                </Field>
                <Field label="Pasaportun ana dili">
                  <select className={inputCls} value={defaultLang} onChange={(e) => {
                    const l = e.target.value as DppLang
                    setDefaultLang(l)
                    setTexts((cur) => (cur[l] ? cur : { ...cur, [l]: { ...emptyTexts(), ...(cur[defaultLang] || {}) } }))
                    setDirty(true)
                  }}>
                    {DPP_LANGS.map((l) => (
                      <option key={l} value={l}>
                        {DPP_LANG_NAMES[l]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ağırlık (gram)">
                  <input className={inputCls} inputMode="decimal" value={num(data.weightGrams)} onChange={(e) => patch({ weightGrams: toNum(e.target.value) })} />
                </Field>
                <Field label="Ölçüler">
                  <input className={inputCls} value={data.dimensions} maxLength={120} placeholder="Ör. 70 × 50 cm" onChange={(e) => patch({ dimensions: e.target.value })} />
                </Field>
              </div>
            </Card>
            <div className="space-y-5">
              <Card title="Ürün görseli">
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageSrc} alt="" className="aspect-square w-full rounded-xl border border-slate-200 object-contain" />
                ) : (
                  <div className="grid aspect-square w-full place-items-center rounded-xl border border-dashed border-slate-300 text-4xl text-slate-300">📷</div>
                )}
                {!readOnly && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                      {busy === 'image' ? 'Yükleniyor…' : imageSrc ? 'Değiştir' : 'Görsel yükle'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          e.target.value = ''
                          if (!file) return
                          void run('image', async () => {
                            if (file.size > 25 * 1024 * 1024) throw new Error('Görsel 25 MB’dan küçük olmalı')
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
                        Kaldır
                      </Button>
                    )}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-500">JPG, PNG ya da WEBP · kare, beyaz zeminli görsel önerilir.</p>
              </Card>
              {bundle && (
                <Card title="Pasaport QR'ı" subtitle="Model düzeyinde (tüm ürünler için tek QR)">
                  <QrBox url={bundle.passportUrl} filename={`dpp-${bundle.publicId}`} />
                  {!bundle.version && <p className="mt-2 text-xs text-amber-700">Pasaport yayınlanınca bu adres açılır.</p>}
                  {bundle.digitalLink && <p className="mt-2 break-all text-xs text-slate-500">GS1 Digital Link: {bundle.digitalLink}</p>}
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === 'materials' && (
          <>
            <MaterialsEditor materials={data.materials} onChange={(materials) => patch({ materials })} />
            <Card title="Çevresel veriler" subtitle="Bilmediğin alanları boş bırak; pasaportta sadece doldurulanlar görünür.">
              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ['carbonKg', 'Karbon ayak izi (kg CO₂e)'],
                    ['waterLiters', 'Su kullanımı (litre)'],
                    ['energyKwh', 'Üretim enerjisi (kWh)'],
                    ['recycledContentPercent', 'Geri dönüştürülmüş içerik (%)'],
                    ['recyclablePercent', 'Geri dönüştürülebilirlik (%)'],
                    ['expectedLifetimeYears', 'Beklenen kullanım ömrü (yıl)'],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <input className={inputCls} inputMode="decimal" value={num(data.environment[key])} onChange={(e) => patch({ environment: { ...data.environment, [key]: toNum(e.target.value) } })} />
                  </Field>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === 'care' && (
          <>
            <Card title="Kullanım ve bakım">
              <Field label="Bakım talimatları" hint="Ör. yıkama sıcaklığı, kurutma, ütüleme, temizlik">
                <textarea className={`${inputCls} min-h-28`} value={t.care} onChange={(e) => setText(defaultLang, 'care', e.target.value)} />
              </Field>
            </Card>
            <Card title="Onarım ve garanti">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Garanti süresi (ay)">
                  <input className={inputCls} inputMode="numeric" value={num(data.repairability.warrantyMonths)} onChange={(e) => patch({ repairability: { ...data.repairability, warrantyMonths: toNum(e.target.value) } })} />
                </Field>
                <Field label="Yedek parça temini (yıl)">
                  <input className={inputCls} inputMode="numeric" value={num(data.repairability.sparePartsYears)} onChange={(e) => patch({ repairability: { ...data.repairability, sparePartsYears: toNum(e.target.value) } })} />
                </Field>
                <Field label="Onarılabilirlik puanı (0-10)">
                  <input className={inputCls} inputMode="decimal" value={num(data.repairability.repairScore)} onChange={(e) => patch({ repairability: { ...data.repairability, repairScore: toNum(e.target.value) } })} />
                </Field>
                <Field label="Servis / onarım bağlantısı" className="sm:col-span-3">
                  <input className={inputCls} placeholder="https://" value={data.repairability.serviceUrl} onChange={(e) => patch({ repairability: { ...data.repairability, serviceUrl: e.target.value } })} />
                </Field>
                <Field label="Onarım bilgisi" className="sm:col-span-3">
                  <textarea className={`${inputCls} min-h-24`} value={t.repair} onChange={(e) => setText(defaultLang, 'repair', e.target.value)} />
                </Field>
              </div>
            </Card>
            <Card title="Kullanım ömrü sonu">
              <Field label="Geri dönüşüm ve bertaraf talimatı" hint="Ürün nasıl ayrıştırılır, hangi atık kutusuna atılır, geri toplama noktaları">
                <textarea className={`${inputCls} min-h-24`} value={t.endOfLife} onChange={(e) => setText(defaultLang, 'endOfLife', e.target.value)} />
              </Field>
            </Card>
            <Card title="Güvenlik">
              <div className="grid gap-4">
                <Field label="Güvenlik bilgileri ve uyarılar">
                  <textarea className={`${inputCls} min-h-20`} value={t.safety} onChange={(e) => setText(defaultLang, 'safety', e.target.value)} />
                </Field>
                <Field label="Endişe verici maddeler (SVHC)" hint="REACH aday listesindeki maddeler, konsantrasyon. Yoksa “İçermez” yazabilirsin.">
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
              <PartyEditor title="Üretici *" party={data.manufacturer} onChange={(manufacturer) => patch({ manufacturer })} />
              <PartyEditor
                title="AB sorumlu ekonomik operatör"
                subtitle="AB dışından ihracatta: AB’deki ithalatçı ya da yetkili temsilci"
                party={data.euOperator}
                onChange={(euOperator) => patch({ euOperator })}
              />
            </div>
            <Card title="🔒 Yetkili erişim bilgileri" subtitle="Herkese gösterilmez. Sadece “Firma bilgileri”ndeki yetkili erişim linkiyle (denetim, geri dönüşüm) görülür.">
              <div className="grid gap-4">
                <Field label="Tedarikçiler">
                  <textarea className={`${inputCls} min-h-20`} value={data.restricted.suppliers} onChange={(e) => patch({ restricted: { ...data.restricted, suppliers: e.target.value } })} />
                </Field>
                <Field label="Üretim tesisi">
                  <textarea className={`${inputCls} min-h-16`} value={data.restricted.facility} onChange={(e) => patch({ restricted: { ...data.restricted, facility: e.target.value } })} />
                </Field>
                <Field label="Notlar (sökme talimatı, tehlikeli bileşenler vb.)">
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
                setNotice(
                  `Çevrildi: ${res.done.map((l) => DPP_LANG_NAMES[l]).join(', ')}.${res.failed.length ? ` Çevrilemedi: ${res.failed.map((l) => DPP_LANG_NAMES[l]).join(', ')}.` : ''} Kontrol edip “Güncellemeyi yayınla” ile yayına al.`
                )
              })
            }
          />
        )}

        {tab === 'docs' && bundle && <DocumentsEditor bundle={bundle} me={me} readOnly={readOnly} reload={() => load(bundle.id)} />}
        {tab === 'items' && bundle && <ItemsPanel productId={bundle.id} productName={t.name} gtin={data.gtin} published={bundle.version > 0} readOnly={readOnly} onChange={() => load(bundle.id)} />}
        {tab === 'versions' && bundle && (
          <Card title="Yayın geçmişi" subtitle="Her yayın değiştirilemez bir sürüm olarak saklanır. Pasaport adresi ve QR kodu hiç değişmez.">
            {bundle.versions.length === 0 ? (
              <p className="text-sm text-slate-500">Henüz yayınlanmadı.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {bundle.versions.map((v) => (
                  <li key={v.version} className="flex items-center justify-between py-2.5">
                    <span>
                      <b>Sürüm {v.version}</b>
                      {v.version === bundle.version && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Yayında</span>}
                    </span>
                    <span className="text-slate-500">
                      {fmtDate(v.created_at, true)} · {v.published_by}
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
    <button type="button" onClick={onClick} className={`block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 ${danger ? 'text-red-700' : ''}`}>
      {children}
    </button>
  )
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const region = new Intl.DisplayNames(['tr'], { type: 'region' })
  const codes = COUNTRIES.includes(value) || !value ? COUNTRIES : [value, ...COUNTRIES]
  return (
    <div className="flex gap-2">
      <select className={inputCls} value={COUNTRIES.includes(value) ? value : value ? value : ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seç…</option>
        {codes.map((c) => (
          <option key={c} value={c}>
            {region.of(c)} ({c})
          </option>
        ))}
      </select>
      <input className={`${inputCls} w-20 font-mono uppercase`} maxLength={2} value={value} title="ISO ülke kodu" onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} />
    </div>
  )
}

function MaterialsEditor({ materials, onChange }: { materials: DppMaterial[]; onChange: (m: DppMaterial[]) => void }) {
  const total = materials.reduce((s, m) => s + (m.percent || 0), 0)
  const set = (i: number, p: Partial<DppMaterial>) => onChange(materials.map((m, j) => (j === i ? { ...m, ...p } : m)))
  return (
    <Card
      title="Malzeme bileşimi *"
      subtitle="Oranlar girilirse toplamı %100 olmalı"
      actions={
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${materials.length === 0 ? 'bg-slate-100 text-slate-500' : Math.abs(total - 100) <= 0.5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          Toplam %{Math.round(total * 10) / 10}
        </span>
      }
    >
      <div className="space-y-2">
        {materials.length > 0 && (
          <div className="hidden grid-cols-[1fr_6rem_8rem_10rem_2.5rem] gap-2 text-xs font-semibold text-slate-500 sm:grid">
            <span>Malzeme</span>
            <span>Oran (%)</span>
            <span>Geri dönüşümlü (%)</span>
            <span>Kaynak / menşe</span>
            <span />
          </div>
        )}
        {materials.map((m, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-[1fr_6rem_8rem_10rem_2.5rem] sm:border-0 sm:p-0">
            <input className={`${inputCls} col-span-2 sm:col-span-1`} placeholder="Ör. Organik pamuk" value={m.name} onChange={(e) => set(i, { name: e.target.value })} />
            <input className={inputCls} inputMode="decimal" placeholder="%" value={num(m.percent)} onChange={(e) => set(i, { percent: toNum(e.target.value) })} />
            <input className={inputCls} inputMode="decimal" placeholder="%" value={num(m.recycledPercent)} onChange={(e) => set(i, { recycledPercent: toNum(e.target.value) })} />
            <input className={inputCls} placeholder="Ör. Türkiye" value={m.origin} onChange={(e) => set(i, { origin: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => onChange(materials.filter((_, j) => j !== i))} aria-label="Satırı sil">
              ✕
            </Button>
          </div>
        ))}
        <Button size="sm" onClick={() => onChange([...materials, { name: '', percent: null, recycledPercent: null, origin: '' }])}>
          ＋ Malzeme ekle
        </Button>
      </div>
    </Card>
  )
}

function ComplianceEditor({ items, onChange }: { items: DppData['compliance']; onChange: (c: DppData['compliance']) => void }) {
  const set = (i: number, p: Partial<DppData['compliance'][number]>) => onChange(items.map((c, j) => (j === i ? { ...c, ...p } : c)))
  const missing = COMPLIANCE_PRESETS.filter((p) => !items.some((c) => c.name === p))
  return (
    <Card title="Uygunluk ve sertifikalar" subtitle="Sertifika belgelerini “Belgeler” sekmesinden PDF olarak ekleyebilirsin.">
      <div className="space-y-2">
        {items.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_2.5rem] gap-2">
            <input className={inputCls} placeholder="Ör. OEKO-TEX Standard 100" value={c.name} onChange={(e) => set(i, { name: e.target.value })} />
            <input className={inputCls} placeholder="Sertifika / referans no" value={c.reference} onChange={(e) => set(i, { reference: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Sil">
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
            ＋ Diğer
          </button>
        </div>
      </div>
    </Card>
  )
}

function PartyEditor({ title, subtitle, party, onChange }: { title: string; subtitle?: string; party: DppParty; onChange: (p: DppParty) => void }) {
  return (
    <Card title={title} subtitle={subtitle}>
      <div className="grid gap-3">
        <Field label="Ünvan">
          <input className={inputCls} value={party.name} onChange={(e) => onChange({ ...party, name: e.target.value })} />
        </Field>
        <Field label="Adres">
          <textarea className={`${inputCls} min-h-16`} value={party.address} onChange={(e) => onChange({ ...party, address: e.target.value })} />
        </Field>
        <Field label="İletişim (e-posta / telefon / web)">
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
  const others = DPP_LANGS.filter((l) => l !== defaultLang)
  const [lang, setLang] = useState<DppLang>(others[0])
  const [selected, setSelected] = useState<DppLang[]>(others.filter((l) => !texts[l]?.name))
  const tt = texts[lang] || emptyTexts()
  const src = texts[defaultLang] || emptyTexts()
  const fields: Array<[DppTextKey, string, boolean]> = [
    ['name', 'Ürün adı', false],
    ['description', 'Açıklama', true],
    ['care', 'Bakım', true],
    ['repair', 'Onarım', true],
    ['endOfLife', 'Kullanım ömrü sonu', true],
    ['safety', 'Güvenlik', true],
  ]

  return (
    <div className="space-y-5">
      <Card
        title="Otomatik çeviri"
        subtitle={`${DPP_LANG_NAMES[defaultLang]} metinlerini yapay zekâ ile seçtiğin dillere çevirir. Sonucu kontrol edip düzenleyebilirsin.`}
      >
        {!translation ? (
          <Alert tone="info">Otomatik çeviri şu an kapalı. Metinleri aşağıdan elle girebilirsin.</Alert>
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
              {busy ? 'Çevriliyor… (birkaç saniye sürebilir)' : `Seçilen ${selected.length} dile çevir`}
            </Button>
            {!canTranslate && <p className="text-xs text-slate-500">Çeviri için önce ürünü kaydet.</p>}
          </div>
        )}
      </Card>

      <Card title="Dile göre metinler" subtitle="Doldurulmamış dilde ziyaretçiye ana dil gösterilir.">
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
              <Field label={`${label} (${DPP_LANG_NAMES[lang]})`}>
                {multi ? (
                  <textarea className={`${inputCls} min-h-20`} value={tt[key]} onChange={(e) => setText(lang, key, e.target.value)} />
                ) : (
                  <input className={inputCls} value={tt[key]} onChange={(e) => setText(lang, key, e.target.value)} />
                )}
              </Field>
              <div className="hidden lg:block" dir="ltr">
                <span className="mb-1 block text-xs font-semibold text-slate-400">Kaynak ({DPP_LANG_NAMES[defaultLang]})</span>
                <p className="min-h-10 whitespace-pre-line rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">{src[key] || '—'}</p>
              </div>
            </div>
          ))}
          {materials.some(Boolean) && (
            <div className="grid gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-600">Malzeme adları ({DPP_LANG_NAMES[lang]})</span>
              {materials.map((name, i) =>
                name ? (
                  <div key={i} className="grid items-center gap-2 lg:grid-cols-2">
                    <input className={inputCls} placeholder={name} value={tt.materialNames?.[i] || ''} onChange={(e) => setMaterialName(lang, i, e.target.value)} />
                    <p className="hidden rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 lg:block" dir="ltr">{name}</p>
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
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<DppDocKind>('certificate')
  const [visibility, setVisibility] = useState<'public' | 'restricted'>('public')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('Dosya 25 MB’dan küçük olmalı')
      const blobUrl = await uploadFile(me.companyId, file, setProgress)
      await api('docs.add', { productId: bundle.id, blobUrl, title: title || file.name.replace(/\.[^.]+$/, ''), kind, visibility })
      setTitle('')
      setFile(null)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yüklenemedi')
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="space-y-5">
      {!readOnly && (
        <Card title="Belge ekle" subtitle="PDF ya da görsel, en fazla 25 MB. Belgeler pasaportta anında görünür (yeniden yayın gerekmez).">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Dosya">
              <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="block w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Field>
            <Field label="Belge adı">
              <input className={inputCls} value={title} placeholder={file?.name || 'Ör. OEKO-TEX sertifikası'} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Tür">
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as DppDocKind)}>
                {Object.entries(DPP_DOC_KINDS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Görünürlük">
              <select className={inputCls} value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'restricted')}>
                <option value="public">Herkese açık</option>
                <option value="restricted">🔒 Sadece yetkili erişim</option>
              </select>
            </Field>
          </div>
          {error && <div className="mt-3"><Alert>{error}</Alert></div>}
          <Button variant="primary" className="mt-4" disabled={!file || progress !== null} onClick={() => void add()}>
            {progress !== null ? `Yükleniyor… %${Math.round(progress)}` : 'Belgeyi ekle'}
          </Button>
        </Card>
      )}
      <Card title="Belgeler">
        {bundle.documents.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz belge yok.</p>
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
  const [busy, setBusy] = useState(false)
  const update = async (patch: Record<string, unknown>) => {
    setBusy(true)
    try {
      await api('docs.update', { id: doc.id, title: doc.title, kind: doc.kind, visibility: doc.visibility, ...patch })
      await reload()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Güncellenemedi')
    } finally {
      setBusy(false)
    }
  }
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
      <a href={`/api/dpp/doc/${doc.id}`} target="_blank" rel="noopener noreferrer" className="min-w-0 hover:text-sky-700">
        <p className="truncate font-semibold">📄 {doc.title}</p>
        <p className="text-xs text-slate-500">
          {DPP_DOC_KINDS[doc.kind] || doc.kind} · {Math.max(1, Math.round(doc.size_bytes / 1024))} KB · {fmtDate(doc.created_at)}
        </p>
      </a>
      {!readOnly && (
        <div className="flex items-center gap-2">
          <select className={`${inputCls} w-auto py-1 text-xs`} value={doc.visibility} disabled={busy} onChange={(e) => void update({ visibility: e.target.value })}>
            <option value="public">Herkese açık</option>
            <option value="restricted">🔒 Yetkili erişim</option>
          </select>
          <Button
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm(`“${doc.title}” silinsin mi?`)) return
              setBusy(true)
              try {
                await api('docs.delete', { id: doc.id })
                await reload()
              } finally {
                setBusy(false)
              }
            }}
          >
            Sil
          </Button>
        </div>
      )}
    </li>
  )
}
