// Sektöre özel pasaport modülleri: batarya (AB 2023/1542 Ek XIII), tekstil, mobilya.
// Her alan tek yerde tanımlanır; panel formu, pasaport görünümü, JSON çıktısı ve yayın kontrolü buradan üretilir.
//
// Erişim seviyeleri (Pil Tüzüğü md. 77 / Ek XIII):
//   public    → herkes (Ek XIII nokta 1)
//   interest  → meşru ilgisi olanlar: tamir, yeniden kullanım, geri dönüşüm (nokta 2 ve 4) — firmanın "meşru ilgi anahtarı"
//   authority → onaylanmış kuruluşlar, piyasa gözetimi, Komisyon (nokta 3) — firmanın "yetkili erişim anahtarı"
// Yetkili erişim anahtarı tüm seviyeleri görür; meşru ilgi anahtarı public + interest görür.
//
// Tekstil ve mobilya için ürün grubuna özel AB düzenlemesi (ESPR ikincil düzenlemesi) henüz yayımlanmadı.
// Bu modüller ESPR'ın genel pasaport bilgileri, AB Tekstil Etiketleme Tüzüğü (1007/2011), EUDR (2023/1115)
// ve Komisyon hazırlık çalışmalarında öne çıkan alanlara göre kurulmuştur; düzenlemeler çıktıkça güncellenir.

import type { DppCategory } from './types'

export type Sector = 'battery' | 'textile' | 'furniture'
export type Tier = 'public' | 'interest' | 'authority'
export type FieldType = 'text' | 'longtext' | 'number' | 'select' | 'multi' | 'country' | 'url'

export interface SectorField {
  key: string
  group: string
  type: FieldType
  tier: Tier
  /** Tüzük / standart referansı (panelde ve JSON'da gösterilir) */
  ref?: string
  unit?: string
  options?: readonly string[]
  min?: number
  max?: number
  /** Yayın için zorunlu (sadece yürürlükteki düzenlemeye dayanan alanlar: şu an yalnızca batarya) */
  required?: boolean
  /** Tüzükte var ama uygulama düzenlemesi / tarih bekleniyor: şimdilik isteğe bağlı */
  deferred?: boolean
  /** Sadece bu batarya kategorilerinde anlamlı */
  onlyFor?: readonly string[]
}

const F = (f: SectorField) => f

export const SECTOR_OF_CATEGORY: Partial<Record<DppCategory, Sector>> = {
  battery: 'battery',
  textile: 'textile',
  footwear: 'textile',
  furniture: 'furniture',
}

export const SECTOR_GROUPS: Record<Sector, readonly string[]> = {
  battery: ['general', 'performance', 'carbon', 'content', 'labels', 'waste', 'interest'],
  textile: ['product', 'chain', 'care', 'durability', 'circularity', 'chemicals'],
  furniture: ['product', 'materials', 'health', 'durability', 'circularity', 'compliance'],
}

export const SECTOR_FIELDS: Record<Sector, readonly SectorField[]> = {
  battery: [
    // Ek XIII 1(a) → Ek VI Kısım A: genel bilgiler
    F({ key: 'batteryCategory', group: 'general', type: 'select', tier: 'public', ref: 'Md. 77(1), Ek VI-A', options: ['ev', 'lmt', 'industrial', 'sli', 'portable'], required: true }),
    F({ key: 'chemistry', group: 'general', type: 'text', tier: 'public', ref: 'Ek VI-A, Ek XIII 1(b)', required: true }),
    F({ key: 'manufacturingPlace', group: 'general', type: 'text', tier: 'public', ref: 'Ek VI-A', required: true }),
    F({ key: 'ratedEnergyKwh', group: 'general', type: 'number', unit: 'kWh', min: 0, max: 100000, tier: 'public', ref: 'Md. 77(1)' }),
    F({ key: 'hazardousSubstances', group: 'general', type: 'longtext', tier: 'public', ref: 'Ek VI-A, Ek XIII 1(b)', required: true }),
    F({ key: 'criticalRawMaterials', group: 'general', type: 'multi', tier: 'public', ref: 'Ek VI-A, Ek XIII 1(b)', options: ['cobalt', 'lithium', 'nickel', 'natural_graphite', 'manganese', 'other'] }),
    F({ key: 'extinguishingAgent', group: 'general', type: 'text', tier: 'public', ref: 'Ek VI-A', required: true }),
    // Ek XIII 1(g)–(p): performans ve dayanıklılık (Ek IV)
    F({ key: 'ratedCapacityAh', group: 'performance', type: 'number', unit: 'Ah', min: 0, max: 1000000, tier: 'public', ref: 'Ek XIII 1(g)', required: true }),
    F({ key: 'voltageMin', group: 'performance', type: 'number', unit: 'V', min: 0, max: 100000, tier: 'public', ref: 'Ek XIII 1(h)' }),
    F({ key: 'voltageNominal', group: 'performance', type: 'number', unit: 'V', min: 0, max: 100000, tier: 'public', ref: 'Ek XIII 1(h)', required: true }),
    F({ key: 'voltageMax', group: 'performance', type: 'number', unit: 'V', min: 0, max: 100000, tier: 'public', ref: 'Ek XIII 1(h)' }),
    F({ key: 'voltageTempRange', group: 'performance', type: 'text', tier: 'public', ref: 'Ek XIII 1(h)' }),
    F({ key: 'powerOriginalW', group: 'performance', type: 'number', unit: 'W', min: 0, max: 100000000, tier: 'public', ref: 'Ek XIII 1(i)', required: true }),
    F({ key: 'powerLimitsTemp', group: 'performance', type: 'text', tier: 'public', ref: 'Ek XIII 1(i)' }),
    F({ key: 'expectedLifetimeCycles', group: 'performance', type: 'number', unit: 'cycles', min: 0, max: 1000000, tier: 'public', ref: 'Ek XIII 1(j)', required: true }),
    F({ key: 'lifetimeTestRef', group: 'performance', type: 'text', tier: 'public', ref: 'Ek XIII 1(j)' }),
    F({ key: 'capacityThresholdPct', group: 'performance', type: 'number', unit: '%', min: 0, max: 100, tier: 'public', ref: 'Ek XIII 1(k)', onlyFor: ['ev'] }),
    F({ key: 'storageTempMin', group: 'performance', type: 'number', unit: '°C', min: -100, max: 200, tier: 'public', ref: 'Ek XIII 1(l)' }),
    F({ key: 'storageTempMax', group: 'performance', type: 'number', unit: '°C', min: -100, max: 200, tier: 'public', ref: 'Ek XIII 1(l)' }),
    F({ key: 'calendarWarrantyYears', group: 'performance', type: 'number', unit: 'years', min: 0, max: 100, tier: 'public', ref: 'Ek XIII 1(m)' }),
    F({ key: 'rteInitialPct', group: 'performance', type: 'number', unit: '%', min: 0, max: 100, tier: 'public', ref: 'Ek XIII 1(n)' }),
    F({ key: 'rteAt50Pct', group: 'performance', type: 'number', unit: '%', min: 0, max: 100, tier: 'public', ref: 'Ek XIII 1(n)' }),
    F({ key: 'resistanceCellMohm', group: 'performance', type: 'number', unit: 'mΩ', min: 0, max: 1000000, tier: 'public', ref: 'Ek XIII 1(o)' }),
    F({ key: 'resistancePackMohm', group: 'performance', type: 'number', unit: 'mΩ', min: 0, max: 1000000, tier: 'public', ref: 'Ek XIII 1(o)' }),
    F({ key: 'cycleLifeCRate', group: 'performance', type: 'number', unit: 'C', min: 0, max: 1000, tier: 'public', ref: 'Ek XIII 1(p)' }),
    // Ek XIII 1(c): karbon ayak izi (md. 7) — uygulama düzenlemesi bekleniyor
    F({ key: 'carbonFootprintPerKwh', group: 'carbon', type: 'number', unit: 'kg CO₂e/kWh', min: 0, max: 100000, tier: 'public', ref: 'Md. 7, Ek XIII 1(c)', deferred: true }),
    F({ key: 'carbonClass', group: 'carbon', type: 'select', tier: 'public', ref: 'Md. 7(2)', options: ['A', 'B', 'C', 'D', 'E'], deferred: true }),
    F({ key: 'carbonStudyUrl', group: 'carbon', type: 'url', tier: 'public', ref: 'Md. 7(1)', deferred: true }),
    // Ek XIII 1(d)–(f): sorumlu tedarik, geri dönüştürülmüş ve yenilenebilir içerik
    F({ key: 'dueDiligenceReport', group: 'content', type: 'url', tier: 'public', ref: 'Md. 52(3), Ek XIII 1(d)', deferred: true }),
    F({ key: 'recycledCobaltPct', group: 'content', type: 'number', unit: '%', min: 0, max: 100, tier: 'public', ref: 'Md. 8, Ek XIII 1(e)', deferred: true }),
    F({ key: 'recycledLithiumPct', group: 'content', type: 'number', unit: '%', min: 0, max: 100, tier: 'public', ref: 'Md. 8, Ek XIII 1(e)', deferred: true }),
    F({ key: 'recycledNickelPct', group: 'content', type: 'number', unit: '%', min: 0, max: 100, tier: 'public', ref: 'Md. 8, Ek XIII 1(e)', deferred: true }),
    F({ key: 'recycledLeadPct', group: 'content', type: 'number', unit: '%', min: 0, max: 100, tier: 'public', ref: 'Md. 8, Ek XIII 1(e)', deferred: true }),
    F({ key: 'renewableContentPct', group: 'content', type: 'number', unit: '%', min: 0, max: 100, tier: 'public', ref: 'Ek XIII 1(f)' }),
    // Ek XIII 1(q)–(r): işaretler ve uygunluk beyanı
    F({ key: 'markings', group: 'labels', type: 'multi', tier: 'public', ref: 'Md. 13, Ek XIII 1(q)', options: ['ce', 'separate_collection', 'cd', 'pb', 'capacity'] }),
    F({ key: 'docReference', group: 'labels', type: 'text', tier: 'public', ref: 'Md. 18, Ek XIII 1(r)', required: true }),
    // Ek XIII 1(s): atık pillerin önlenmesi ve yönetimi (md. 60(1))
    F({ key: 'wasteInfo', group: 'waste', type: 'longtext', tier: 'public', ref: 'Md. 60(1), Ek XIII 1(s)', required: true }),
    // Ek XIII nokta 2: meşru ilgisi olanlar
    F({ key: 'detailedComposition', group: 'interest', type: 'longtext', tier: 'interest', ref: 'Ek XIII 2(a)' }),
    F({ key: 'spareParts', group: 'interest', type: 'longtext', tier: 'interest', ref: 'Ek XIII 2(b)' }),
    F({ key: 'dismantling', group: 'interest', type: 'longtext', tier: 'interest', ref: 'Ek XIII 2(c)' }),
    F({ key: 'safetyMeasures', group: 'interest', type: 'longtext', tier: 'interest', ref: 'Ek XIII 2(d)' }),
  ],
  textile: [
    F({ key: 'productType', group: 'product', type: 'text', tier: 'public' }),
    F({ key: 'sizeRange', group: 'product', type: 'text', tier: 'public' }),
    F({ key: 'animalOrigin', group: 'product', type: 'select', tier: 'public', ref: '1007/2011 md. 12', options: ['no', 'yes'] }),
    F({ key: 'countrySpinning', group: 'chain', type: 'country', tier: 'public' }),
    F({ key: 'countryWeaving', group: 'chain', type: 'country', tier: 'public' }),
    F({ key: 'countryDyeing', group: 'chain', type: 'country', tier: 'public' }),
    F({ key: 'countryAssembly', group: 'chain', type: 'country', tier: 'public' }),
    F({ key: 'careWash', group: 'care', type: 'select', tier: 'public', ref: 'ISO 3758', options: ['w95', 'w60', 'w40', 'w30', 'hand', 'nowash'] }),
    F({ key: 'careBleach', group: 'care', type: 'select', tier: 'public', ref: 'ISO 3758', options: ['bleach_any', 'bleach_oxygen', 'bleach_no'] }),
    F({ key: 'careDry', group: 'care', type: 'select', tier: 'public', ref: 'ISO 3758', options: ['tumble_normal', 'tumble_low', 'tumble_no', 'line', 'flat'] }),
    F({ key: 'careIron', group: 'care', type: 'select', tier: 'public', ref: 'ISO 3758', options: ['iron_high', 'iron_medium', 'iron_low', 'iron_no'] }),
    F({ key: 'careProfessional', group: 'care', type: 'select', tier: 'public', ref: 'ISO 3758', options: ['prof_p', 'prof_f', 'prof_w', 'prof_no'] }),
    F({ key: 'pillingGrade', group: 'durability', type: 'number', min: 1, max: 5, tier: 'public', ref: 'ISO 12945' }),
    F({ key: 'colourFastnessWash', group: 'durability', type: 'number', min: 1, max: 5, tier: 'public', ref: 'ISO 105-C06' }),
    F({ key: 'colourFastnessLight', group: 'durability', type: 'number', min: 1, max: 8, tier: 'public', ref: 'ISO 105-B02' }),
    F({ key: 'dimensionalChangePct', group: 'durability', type: 'number', unit: '%', min: -50, max: 50, tier: 'public', ref: 'ISO 5077' }),
    F({ key: 'washCyclesTested', group: 'durability', type: 'number', min: 0, max: 1000, tier: 'public' }),
    F({ key: 'recyclability', group: 'circularity', type: 'select', tier: 'public', options: ['mono', 'mostly_mono', 'blend'] }),
    F({ key: 'recyclingDisruptors', group: 'circularity', type: 'text', tier: 'public' }),
    F({ key: 'removableTrims', group: 'circularity', type: 'select', tier: 'public', options: ['yes', 'no', 'na'] }),
    F({ key: 'microfibreRelease', group: 'circularity', type: 'number', unit: 'mg/kg', min: 0, max: 100000, tier: 'public' }),
    F({ key: 'reachConform', group: 'chemicals', type: 'select', tier: 'public', ref: 'REACH Ek XVII', options: ['yes', 'no'] }),
    F({ key: 'chemicalCertifications', group: 'chemicals', type: 'text', tier: 'public' }),
  ],
  furniture: [
    F({ key: 'furnitureType', group: 'product', type: 'text', tier: 'public' }),
    F({ key: 'useEnvironment', group: 'product', type: 'select', tier: 'public', options: ['indoor', 'outdoor', 'both'] }),
    F({ key: 'maxLoadKg', group: 'product', type: 'number', unit: 'kg', min: 0, max: 100000, tier: 'public' }),
    F({ key: 'componentMaterials', group: 'materials', type: 'longtext', tier: 'public' }),
    F({ key: 'woodSpecies', group: 'materials', type: 'text', tier: 'public' }),
    F({ key: 'woodOrigin', group: 'materials', type: 'country', tier: 'public' }),
    F({ key: 'woodCertification', group: 'materials', type: 'text', tier: 'public', ref: 'FSC / PEFC' }),
    F({ key: 'upholstery', group: 'materials', type: 'text', tier: 'public' }),
    F({ key: 'foamType', group: 'materials', type: 'text', tier: 'public' }),
    F({ key: 'formaldehydeClass', group: 'health', type: 'select', tier: 'public', ref: 'EN 717-1 / EN 16516', options: ['e05', 'e1', 'e2', 'na'] }),
    F({ key: 'flameRetardants', group: 'health', type: 'select', tier: 'public', options: ['none', 'present'] }),
    F({ key: 'flameRetardantDetails', group: 'health', type: 'text', tier: 'public' }),
    F({ key: 'vocInfo', group: 'health', type: 'text', tier: 'public' }),
    F({ key: 'testedStandards', group: 'durability', type: 'text', tier: 'public', ref: 'EN 16139, EN 12520, EN 1730…' }),
    F({ key: 'disassembly', group: 'circularity', type: 'select', tier: 'public', options: ['tool_free', 'standard_tools', 'special_tools', 'not_designed'] }),
    F({ key: 'fasteners', group: 'circularity', type: 'text', tier: 'public' }),
    F({ key: 'sparePartsList', group: 'circularity', type: 'longtext', tier: 'public' }),
    F({ key: 'recyclabilityInfo', group: 'circularity', type: 'longtext', tier: 'public' }),
    F({ key: 'packaging', group: 'circularity', type: 'text', tier: 'public' }),
    F({ key: 'eudrReference', group: 'compliance', type: 'text', tier: 'authority', ref: 'EUDR 2023/1115 md. 4' }),
  ],
}

/** Ek XIII nokta 4: her pile özgü, kullanım sırasında güncellenen veriler (meşru ilgi seviyesi). */
export const BATTERY_ITEM_FIELDS: readonly SectorField[] = [
  F({ key: 'status', group: 'item', type: 'select', tier: 'interest', ref: 'Ek XIII 4', options: ['original', 'repurposed', 'reused', 'remanufactured', 'waste'] }),
  F({ key: 'stateOfHealthPct', group: 'item', type: 'number', unit: '%', min: 0, max: 100, tier: 'interest', ref: 'Md. 14, Ek XIII 4' }),
  F({ key: 'remainingCapacityAh', group: 'item', type: 'number', unit: 'Ah', min: 0, max: 1000000, tier: 'interest', ref: 'Ek VII, Ek XIII 4' }),
  F({ key: 'cycles', group: 'item', type: 'number', unit: 'cycles', min: 0, max: 10000000, tier: 'interest', ref: 'Ek XIII 4' }),
  F({ key: 'stateOfChargePct', group: 'item', type: 'number', unit: '%', min: 0, max: 100, tier: 'interest', ref: 'Ek XIII 4' }),
  F({ key: 'negativeEvents', group: 'item', type: 'longtext', tier: 'interest', ref: 'Ek XIII 4' }),
  F({ key: 'operatingConditions', group: 'item', type: 'longtext', tier: 'interest', ref: 'Ek XIII 4' }),
]

export type SectorValue = string | number | string[] | null
export type SectorData = Record<string, SectorValue>

const TIER_RANK: Record<Tier, number> = { public: 0, interest: 1, authority: 2 }
/** Bu erişim seviyesindeki kişi bu alanı görebilir mi? */
export const canSee = (field: Pick<SectorField, 'tier'>, access: Tier) => TIER_RANK[access] >= TIER_RANK[field.tier]

export function sectorFor(category: string | null | undefined): Sector | null {
  return (category && SECTOR_OF_CATEGORY[category as DppCategory]) || null
}

function cleanValue(f: SectorField, raw: unknown): SectorValue {
  if (raw === undefined || raw === null || raw === '') return null
  switch (f.type) {
    case 'number': {
      const n = Number(String(raw).replace(',', '.'))
      if (!Number.isFinite(n)) return null
      return Math.min(f.max ?? 1e12, Math.max(f.min ?? -1e12, Math.round(n * 1000) / 1000))
    }
    case 'select':
      return f.options?.includes(String(raw)) ? String(raw) : null
    case 'multi': {
      const list = (Array.isArray(raw) ? raw : []).map(String).filter((v) => f.options?.includes(v))
      return list.length ? Array.from(new Set(list)) : null
    }
    case 'country': {
      const c = String(raw).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
      return c.length === 2 ? c : null
    }
    case 'url': {
      const s = String(raw).trim().slice(0, 500)
      return /^https?:\/\//i.test(s) ? s : null
    }
    case 'longtext':
      return String(raw).trim().slice(0, 4000) || null
    default:
      return String(raw).trim().slice(0, 300) || null
  }
}

/** Kategoriye ait modülün alanlarını temizler; diğer sektörlerin alanlarını atar. */
export function sanitizeSector(category: string, input: unknown): SectorData {
  const sector = sectorFor(category)
  if (!sector) return {}
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const out: SectorData = {}
  for (const f of SECTOR_FIELDS[sector]) {
    const v = cleanValue(f, o[f.key])
    if (v !== null) out[f.key] = v
  }
  return out
}

export function sanitizeItemDynamic(input: unknown): SectorData {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const out: SectorData = {}
  for (const f of BATTERY_ITEM_FIELDS) {
    const v = cleanValue(f, o[f.key])
    if (v !== null) out[f.key] = v
  }
  return out
}

/** Yayın için eksik zorunlu sektör alanları (alan anahtarları). */
export function missingSectorFields(category: string, data: SectorData): SectorField[] {
  const sector = sectorFor(category)
  if (!sector) return []
  const batteryCategory = String(data.batteryCategory || '')
  return SECTOR_FIELDS[sector].filter((f) => f.required && (!f.onlyFor || f.onlyFor.includes(batteryCategory)) && (data[f.key] === undefined || data[f.key] === null))
}

/** Görüntüleyenin erişim seviyesine göre görünür alanlar (pasaport ve JSON için). */
export function visibleSector(category: string, data: SectorData, access: Tier) {
  const sector = sectorFor(category)
  if (!sector) return null
  const fields = SECTOR_FIELDS[sector].filter((f) => canSee(f, access) && data[f.key] !== undefined && data[f.key] !== null)
  return { sector, fields }
}

export const fieldLabelKey = (sector: Sector | 'item', key: string) => `sf_${sector}_${key}`
export const groupLabelKey = (sector: Sector, group: string) => `sg_${sector}_${group}`
export const optionLabelKey = (option: string) => `so_${option}`
