// Dijital Ürün Pasaportu (DPP) — istemci ve sunucunun ortak kullandığı tipler, sabitler ve doğrulayıcılar.
// Sunucuya özel import yok: panel bileşenleri de bu dosyayı kullanır.

import { isMaterialTypeChoice, type MaterialTypeChoice } from './carbon'
import { fieldLabelKey, missingSectorFields, sanitizeSector, sectorFor, type SectorData, type Tier } from './sectors'
import { DppError, type MsgKey, type MsgParams } from './i18n'

export const DPP_LANGS = ['tr', 'en', 'de', 'fr', 'es', 'nl', 'ar', 'ru'] as const
export type DppLang = (typeof DPP_LANGS)[number]

export const DPP_LANG_NAMES: Record<DppLang, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  nl: 'Nederlands',
  ar: 'العربية',
  ru: 'Русский',
}

export function isDppLang(value: unknown): value is DppLang {
  return typeof value === 'string' && (DPP_LANGS as readonly string[]).includes(value)
}

export const DPP_CATEGORIES = {
  textile: 'Tekstil ve giyim',
  footwear: 'Ayakkabı',
  furniture: 'Mobilya',
  electronics: 'Elektronik',
  battery: 'Pil ve batarya',
  appliance: 'Beyaz eşya',
  toy: 'Oyuncak',
  cosmetics: 'Kozmetik',
  construction: 'Yapı malzemesi',
  steel: 'Demir-çelik / metal',
  packaging: 'Ambalaj',
  other: 'Diğer',
} as const
export type DppCategory = keyof typeof DPP_CATEGORIES

export const DPP_DOC_KINDS = {
  certificate: 'Sertifika',
  declaration: 'Uygunluk beyanı (DoC)',
  test_report: 'Test raporu',
  manual: 'Kullanım kılavuzu',
  sds: 'Güvenlik bilgi formu (SDS)',
  repair: 'Onarım / parça kılavuzu',
  other: 'Diğer',
} as const
export type DppDocKind = keyof typeof DPP_DOC_KINDS

export const DPP_PLANS = {
  demo: { label: 'Demo', productLimit: 3 },
  pilot: { label: 'Pilot', productLimit: 10 },
  starter: { label: 'Başlangıç', productLimit: 50 },
  growth: { label: 'Büyüme', productLimit: 200 },
  business: { label: 'İşletme', productLimit: 500 },
  enterprise: { label: 'Kurumsal', productLimit: 100000 },
} as const
export type DppPlan = keyof typeof DPP_PLANS

export const DPP_ROLES = { owner: 'Yönetici', editor: 'Editör', viewer: 'İzleyici' } as const
export type DppRole = keyof typeof DPP_ROLES

export type DppStatus = 'draft' | 'published' | 'archived'

/** Dile göre değişen metinler (her dil için ayrı tutulur, otomatik çevrilebilir). */
export interface DppTexts {
  name: string
  description: string
  care: string
  repair: string
  endOfLife: string
  safety: string
  /** Malzeme adlarının bu dildeki karşılıkları (data.materials ile aynı sırada). Ana dilde kullanılmaz; ana dil adı data.materials[i].name'dir. */
  materialNames: string[]
}
export type DppTextKey = Exclude<keyof DppTexts, 'materialNames'>
export const DPP_TEXT_KEYS: DppTextKey[] = ['name', 'description', 'care', 'repair', 'endOfLife', 'safety']

export interface DppMaterial {
  name: string
  percent: number | null
  recycledPercent: number | null
  origin: string
  /** Karbon tahmini için lif türü ('' = adından otomatik algıla, 'none' = güvenilir değer yok) */
  type?: MaterialTypeChoice
}

export interface DppParty {
  name: string
  address: string
  contact: string
}

/** Dilden bağımsız ürün verisi. */
export interface DppData {
  brand: string
  model: string
  gtin: string
  category: DppCategory
  countryOfOrigin: string
  manufacturer: DppParty
  /** AB pazarındaki sorumlu ekonomik operatör (ithalatçı / yetkili temsilci) */
  euOperator: DppParty
  weightGrams: number | null
  dimensions: string
  materials: DppMaterial[]
  environment: {
    carbonKg: number | null
    waterLiters: number | null
    energyKwh: number | null
    recycledContentPercent: number | null
    recyclablePercent: number | null
    expectedLifetimeYears: number | null
    /** 'declared' = firmanın beyanı (LCA vb.) · 'estimate' = QRNot hammadde aşaması tahmini (aralıkla) */
    carbonBasis: 'declared' | 'estimate'
    carbonMin: number | null
    carbonMax: number | null
  }
  repairability: {
    warrantyMonths: number | null
    sparePartsYears: number | null
    repairScore: number | null
    serviceUrl: string
  }
  compliance: Array<{ name: string; reference: string }>
  substancesOfConcern: string
  /** Sektöre özel modül (batarya / tekstil / mobilya): sectors.ts'teki alanlar */
  sector: SectorData
  /** Sadece yetkili erişim (denetim, geri dönüşüm) ile görünür */
  restricted: {
    suppliers: string
    facility: string
    notes: string
  }
}

export function emptyTexts(): DppTexts {
  return { name: '', description: '', care: '', repair: '', endOfLife: '', safety: '', materialNames: [] }
}

export function emptyParty(): DppParty {
  return { name: '', address: '', contact: '' }
}

export function emptyData(): DppData {
  return {
    brand: '',
    model: '',
    gtin: '',
    category: 'textile',
    countryOfOrigin: 'TR',
    manufacturer: emptyParty(),
    euOperator: emptyParty(),
    weightGrams: null,
    dimensions: '',
    materials: [],
    environment: { carbonKg: null, waterLiters: null, energyKwh: null, recycledContentPercent: null, recyclablePercent: null, expectedLifetimeYears: null, carbonBasis: 'declared', carbonMin: null, carbonMax: null },
    repairability: { warrantyMonths: null, sparePartsYears: null, repairScore: null, serviceUrl: '' },
    compliance: [],
    substancesOfConcern: '',
    sector: {},
    restricted: { suppliers: '', facility: '', notes: '' },
  }
}

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
function num(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100))
}
function url(v: unknown) {
  const s = str(v, 500)
  return /^https?:\/\//i.test(s) ? s : ''
}
function party(v: unknown): DppParty {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  return { name: str(o.name, 200), address: str(o.address, 400), contact: str(o.contact, 200) }
}

/** GTIN: sadece rakam, 8/12/13/14 hane. Kontrol hanesi doğrulanır. Boşsa ''. Geçersizse null. */
export function normalizeGtin(input: unknown): string | null {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (![8, 12, 13, 14].includes(digits.length)) return null
  const body = digits.slice(0, -1)
  let sum = 0
  for (let i = 0; i < body.length; i++) {
    const d = Number(body[body.length - 1 - i])
    sum += i % 2 === 0 ? d * 3 : d
  }
  const check = (10 - (sum % 10)) % 10
  if (check !== Number(digits[digits.length - 1])) return null
  return digits.padStart(14, '0')
}

export function sanitizeTexts(input: unknown): DppTexts {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  return {
    name: str(o.name, 200),
    description: str(o.description, 4000),
    care: str(o.care, 3000),
    repair: str(o.repair, 3000),
    endOfLife: str(o.endOfLife, 3000),
    safety: str(o.safety, 3000),
    materialNames: (Array.isArray(o.materialNames) ? o.materialNames : []).slice(0, 30).map((n) => str(n, 120)),
  }
}

/** Malzemenin verilen dildeki adı: ana dilde ya da çevirisi yoksa girilen ad. */
export function materialName(data: DppData, texts: Partial<Record<DppLang, DppTexts>>, lang: DppLang, defaultLang: DppLang, index: number) {
  const base = data.materials[index]?.name || ''
  if (lang === defaultLang) return base
  return texts[lang]?.materialNames?.[index] || base
}

/** Panelden gelen veriyi güvenli, sınırlı bir şekle sokar. GTIN geçersizse hata fırlatır. */
export function sanitizeData(input: unknown): DppData {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const env = (o.environment && typeof o.environment === 'object' ? o.environment : {}) as Record<string, unknown>
  const rep = (o.repairability && typeof o.repairability === 'object' ? o.repairability : {}) as Record<string, unknown>
  const res = (o.restricted && typeof o.restricted === 'object' ? o.restricted : {}) as Record<string, unknown>
  const gtin = normalizeGtin(o.gtin)
  if (gtin === null) throw new DppError('e_gtin_invalid')
  const categoryRaw = str(o.category, 24)
  const category = (categoryRaw in DPP_CATEGORIES ? categoryRaw : 'other') as DppCategory
  return {
    brand: str(o.brand, 120),
    model: str(o.model, 120),
    gtin,
    category,
    countryOfOrigin: str(o.countryOfOrigin, 2).toUpperCase().replace(/[^A-Z]/g, ''),
    manufacturer: party(o.manufacturer),
    euOperator: party(o.euOperator),
    weightGrams: num(o.weightGrams, 0, 100_000_000),
    dimensions: str(o.dimensions, 120),
    materials: (Array.isArray(o.materials) ? o.materials : [])
      .slice(0, 30)
      .map((m) => {
        const r = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>
        return { name: str(r.name, 120), percent: num(r.percent, 0, 100), recycledPercent: num(r.recycledPercent, 0, 100), origin: str(r.origin, 80), type: isMaterialTypeChoice(r.type) ? r.type : '' }
      })
      .filter((m) => m.name),
    environment: {
      carbonKg: num(env.carbonKg, 0, 1_000_000),
      waterLiters: num(env.waterLiters, 0, 100_000_000),
      energyKwh: num(env.energyKwh, 0, 100_000_000),
      recycledContentPercent: num(env.recycledContentPercent, 0, 100),
      recyclablePercent: num(env.recyclablePercent, 0, 100),
      expectedLifetimeYears: num(env.expectedLifetimeYears, 0, 200),
      // Tahmin sadece karbon değeri ve aralığı birlikte varsa geçerli; aksi halde beyan kabul edilir
      ...(env.carbonBasis === 'estimate' && num(env.carbonMin, 0, 1_000_000) !== null && num(env.carbonMax, 0, 1_000_000) !== null && num(env.carbonKg, 0, 1_000_000) !== null
        ? { carbonBasis: 'estimate' as const, carbonMin: num(env.carbonMin, 0, 1_000_000), carbonMax: num(env.carbonMax, 0, 1_000_000) }
        : { carbonBasis: 'declared' as const, carbonMin: null, carbonMax: null }),
    },
    repairability: {
      warrantyMonths: num(rep.warrantyMonths, 0, 1200),
      sparePartsYears: num(rep.sparePartsYears, 0, 100),
      repairScore: num(rep.repairScore, 0, 10),
      serviceUrl: url(rep.serviceUrl),
    },
    compliance: (Array.isArray(o.compliance) ? o.compliance : [])
      .slice(0, 30)
      .map((c) => {
        const r = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>
        return { name: str(r.name, 120), reference: str(r.reference, 200) }
      })
      .filter((c) => c.name),
    substancesOfConcern: str(o.substancesOfConcern, 3000),
    sector: sanitizeSector(category, o.sector),
    restricted: { suppliers: str(res.suppliers, 4000), facility: str(res.facility, 2000), notes: str(res.notes, 4000) },
  }
}

/** Kayıttan okunan veriyi (eski / eksik alanlar olsa da) tam şekle tamamlar. */
export function readData(input: unknown): DppData {
  try {
    return sanitizeData(input)
  } catch {
    return { ...sanitizeData({ ...(input as object), gtin: '' }) }
  }
}

export function readTextsMap(input: unknown): Partial<Record<DppLang, DppTexts>> {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const out: Partial<Record<DppLang, DppTexts>> = {}
  for (const lang of DPP_LANGS) if (o[lang]) out[lang] = sanitizeTexts(o[lang])
  return out
}

/** Yayın öncesi kontrol: pasaportun anlamlı olması için gereken asgari alanlar. */
export function publishIssues(texts: Partial<Record<DppLang, DppTexts>>, defaultLang: DppLang, data: DppData): Array<{ key: MsgKey; params?: MsgParams }> {
  const t = texts[defaultLang]
  const issues: Array<{ key: MsgKey; params?: MsgParams }> = []
  if (!t?.name) issues.push({ key: 'iss_name' })
  if (!data.brand) issues.push({ key: 'iss_brand' })
  if (!data.manufacturer.name) issues.push({ key: 'iss_manufacturer' })
  if (!data.countryOfOrigin) issues.push({ key: 'iss_origin' })
  if (data.materials.length === 0) issues.push({ key: 'iss_material' })
  const total = data.materials.reduce((sum, m) => sum + (m.percent || 0), 0)
  if (data.materials.some((m) => m.percent !== null) && Math.abs(total - 100) > 0.5) issues.push({ key: 'iss_material_sum', params: { n: Math.round(total * 10) / 10 } })
  // Sektör modülünün zorunlu alanları (ör. batarya: kimya, kapasite, voltaj… — Pil Tüzüğü Ek XIII)
  const sector = sectorFor(data.category)
  if (sector) for (const f of missingSectorFields(data.category, data.sector || {})) issues.push({ key: fieldLabelKey(sector, f.key) as MsgKey })
  return issues
}

/** Yayınlanan (herkese açık) pasaport görünümü. */
export interface DppPublicView {
  publicId: string
  version: number
  publishedAt: string
  defaultLang: DppLang
  langs: DppLang[]
  texts: Partial<Record<DppLang, DppTexts>>
  data: Omit<DppData, 'restricted'> & { restricted?: DppData['restricted'] }
  hasImage: boolean
  company: { name: string; country: string; website: string }
  item: { serial: string; batch: string; productionDate: string | null } | null
  documents: Array<{ id: string; title: string; kind: DppDocKind; restricted: boolean; contentType: string; sizeBytes: number }>
  restrictedAccess: boolean
  /** Görüntüleyenin erişim seviyesi: herkese açık, meşru ilgi anahtarı, yetkili erişim anahtarı */
  access: Tier
  /** Seri numaralı pilin değişen verileri (Ek XIII nokta 4); sadece meşru ilgi / yetkili erişimde */
  itemDynamic: SectorData | null
  itemDynamicUpdatedAt: string | null
  /** Demo firmasının pasaportu: sayfada ve JSON'da "demo" olarak işaretlenir */
  demo: boolean
}
