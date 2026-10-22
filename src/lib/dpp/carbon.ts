import type { DppMaterial } from './types'

// Karbon tahmin yardımcısı — SADECE hammadde (lif) aşaması, ARALIK olarak.
// Kaynaklardaki değerler aynı lif için bile çok farklı olduğundan tek bir "kesin" sayı üretilmez;
// sonuç pasaportta "tahmin" olarak etiketlenir. Kesin beyan için ürüne özel yaşam döngüsü analizi (LCA) gerekir.
// Değerler kg CO₂e / kg lif. Aralıklar aşağıdaki kaynaklarda yayımlanmış değerlerden derlenmiştir.

export const CARBON_SOURCES = [
  { name: 'Superino — Impact calculations', url: 'https://www.superino.eu/pages/impact-calculations' },
  { name: 'Geopelie — Textile fibers and their environmental impact (ADEME Base Carbone değerleri dahil)', url: 'https://geopelie.com/en/blogs/blog/the-environmental-impact-of-the-different-textile-fibers' },
  { name: 'Selvane — Fashion’s carbon footprint by material', url: 'https://www.selvane.co/blogs/knowledge/the-carbon-footprint-of-your-wardrobe-a-material-by-material-analysis' },
  { name: '8 Billion Trees — Carbon footprint of polyester vs cotton vs wool vs nylon', url: 'https://8billiontrees.com/carbon-offsets-credits/carbon-footprint-of-polyester/' },
] as const

export const CARBON_FACTORS = {
  cotton: { min: 5.7, max: 7.5 },
  organic_cotton: { min: 1.15, max: 3.0 },
  polyester: { min: 5.5, max: 14.2 },
  recycled_polyester: { min: 1.15, max: 2.5 },
  wool: { min: 19, max: 80.3 },
  nylon: { min: 6.5, max: 20 },
  recycled_nylon: { min: 2, max: 4 },
} as const
export type CarbonFactorKey = keyof typeof CARBON_FACTORS
/** '' = otomatik algıla, 'none' = bu malzeme için güvenilir değer yok */
export type MaterialTypeChoice = CarbonFactorKey | '' | 'none'

export function isMaterialTypeChoice(v: unknown): v is MaterialTypeChoice {
  return v === '' || v === 'none' || (typeof v === 'string' && v in CARBON_FACTORS)
}

/** Geri dönüştürülmüş karşılığı olan lifler (geri dönüşümlü oran bu faktörle hesaplanır) */
const RECYCLED_OF: Partial<Record<CarbonFactorKey, CarbonFactorKey>> = { polyester: 'recycled_polyester', nylon: 'recycled_nylon' }

/** Malzeme adından (8 dilde) lif türünü tahmin eder. Bulamazsa null. */
export function guessMaterialType(name: string): CarbonFactorKey | null {
  const n = name.toLocaleLowerCase('tr')
  const recycled = /geri d[öo]n[üu]ş|recycl|recyc|rpet|recycel|reciclad|gerecycl|переработ|معاد/.test(n)
  if (/pamuk|cotton|baumwoll|coton|algod[oó]n|katoen|хлоп|قطن/.test(n)) {
    return /organik|organic|bio|biolog|org[áa]nic|органич|عضوي/.test(n) ? 'organic_cotton' : 'cotton'
  }
  if (/polyester|poli[ée]ster|polyest|полиэст|بوليستر|\bpet\b/.test(n)) return recycled ? 'recycled_polyester' : 'polyester'
  if (/naylon|nylon|polyamid|poliamid|нейлон|полиамид|نايلون/.test(n)) return recycled ? 'recycled_nylon' : 'nylon'
  if (/y[üu]n|wool|wolle|laine|\blana\b|\bwol\b|шерст|merino|صوف/.test(n)) return 'wool'
  return null
}

export interface CarbonEstimate {
  min: number
  max: number
  mid: number
  /** Bileşimin faktörü bilinen kısmı (%) */
  coveredPercent: number
  /** Faktörü bulunamayan malzemeler */
  unknown: string[]
  rows: Array<{ name: string; type: CarbonFactorKey | null; percent: number; min: number; max: number }>
}

/**
 * Hammadde aşaması karbon aralığı (kg CO₂e, ürün başına).
 * Ağırlık ve malzeme oranları gereklidir; eksikse null döner.
 */
export function estimateCarbon(materials: Array<DppMaterial & { type?: MaterialTypeChoice }>, weightGrams: number | null): CarbonEstimate | null {
  if (!weightGrams || weightGrams <= 0) return null
  const withShare = materials.filter((m) => m.name && m.percent !== null && m.percent > 0)
  if (!withShare.length) return null
  const kg = weightGrams / 1000
  let min = 0
  let max = 0
  let covered = 0
  const unknown: string[] = []
  const rows: CarbonEstimate['rows'] = []
  for (const m of withShare) {
    const chosen = m.type === 'none' ? null : m.type ? (m.type as CarbonFactorKey) : guessMaterialType(m.name)
    const share = (m.percent as number) / 100
    if (!chosen) {
      unknown.push(m.name)
      rows.push({ name: m.name, type: null, percent: m.percent as number, min: 0, max: 0 })
      continue
    }
    // Geri dönüşümlü oran: geri dönüştürülmüş karşılığı olan liflerde ayrı faktörle hesaplanır
    const recycledKey = RECYCLED_OF[chosen]
    const r = recycledKey && m.recycledPercent ? Math.min(1, m.recycledPercent / 100) : 0
    const f = CARBON_FACTORS[chosen]
    const fr = recycledKey ? CARBON_FACTORS[recycledKey] : f
    const rowMin = kg * share * ((1 - r) * f.min + r * fr.min)
    const rowMax = kg * share * ((1 - r) * f.max + r * fr.max)
    min += rowMin
    max += rowMax
    covered += m.percent as number
    rows.push({ name: m.name, type: chosen, percent: m.percent as number, min: rowMin, max: rowMax })
  }
  if (covered === 0) return { min: 0, max: 0, mid: 0, coveredPercent: 0, unknown, rows }
  const round = (v: number) => Math.round(v * 100) / 100
  return { min: round(min), max: round(max), mid: round((min + max) / 2), coveredPercent: Math.round(covered * 10) / 10, unknown, rows }
}
