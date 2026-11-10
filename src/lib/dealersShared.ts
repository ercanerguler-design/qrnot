import { PRODUCTS, type ProductId } from '@/lib/commerce/catalog'

// Bayilik kuralları (tarayıcı ve sunucu ortak). Değiştirmek için sadece bu dosya yeterli.
//   • Ürünlerde bayi fiyatı = site fiyatı × (1 − %30), tam liraya aşağı yuvarlanır (KDV dahil, site fiyatı gibi)
//   • DPP paketlerinde bayi fiyatı = liste fiyatı × (1 − %35) (KDV hariç, euro)
//   • Ürün siparişinde en az 30 adet (ürünler birlikte sayılır); DPP'de alt sınır yok
//   • Ödeme: kredi kartı (PayTR) ya da havale / EFT

export const DEALER_PRODUCT_DISCOUNT = 0.3
export const DEALER_DPP_DISCOUNT = 0.35
export const DEALER_MIN_QTY = 30
export const DEALER_MAX_QTY = 5000

/** Bayinin sipariş verebildiği ürünler. NFC'li ürünler stoğa girince listeye eklenebilir; Premium hesaba bağlı olduğu için bayiye satılmaz. */
export const DEALER_PRODUCT_IDS = ['kolye-qr', 'anahtarlik-qr', 'ani-defteri', 'dijital-qr'] as const satisfies readonly ProductId[]
export type DealerProductId = (typeof DEALER_PRODUCT_IDS)[number]

export const DEALER_STATUSES = ['pending', 'approved', 'rejected', 'suspended'] as const
export type DealerStatus = (typeof DEALER_STATUSES)[number]
export const DEALER_STATUS_LABEL: Record<DealerStatus, string> = {
  pending: 'Başvuru inceleniyor',
  approved: 'Onaylı bayi',
  rejected: 'Reddedildi',
  suspended: 'Askıya alındı',
}

export const BUSINESS_TYPES = [
  'Çiçekçi',
  'Hediyelik eşya / butik',
  'Kuyumcu / takı',
  'Pastane / çikolatacı',
  'Matbaa / davetiye',
  'Düğün / organizasyon',
  'Fotoğrafçı',
  'Promosyon / kurumsal hediye ajansı',
  'Kırtasiye / kitapçı',
  'Pet shop / veteriner',
  'E-ticaret satıcısı',
  'Dış ticaret / DPP danışmanı',
  'Diğer',
] as const

/** Sitedeki DPP liste fiyatları (€, KDV hariç) — src/app/dpp/page.tsx ile aynı tutulmalı */
export const DPP_DEALER_PLANS = [
  { id: 'pilot', name: 'Pilot', scope: '10 ürün modeli', eur: 390, per: 'once' as const },
  { id: 'baslangic', name: 'Başlangıç', scope: '50 ürün modeli', eur: 59, per: 'month' as const },
  { id: 'buyume', name: 'Büyüme', scope: '200 ürün modeli', eur: 149, per: 'month' as const },
  { id: 'isletme', name: 'İşletme', scope: '500 ürün modeli', eur: 349, per: 'month' as const },
  { id: 'kurumsal', name: 'Kurumsal', scope: 'Sınırsız', eur: 790, per: 'from' as const },
]
export type DppDealerPlanId = (typeof DPP_DEALER_PLANS)[number]['id']
export const DPP_REQUEST_STATUSES = ['new', 'setup', 'active', 'cancelled'] as const
export type DppRequestStatus = (typeof DPP_REQUEST_STATUSES)[number]
export const DPP_REQUEST_STATUS_LABEL: Record<DppRequestStatus, string> = {
  new: 'Yeni talep',
  setup: 'Kurulumda',
  active: 'Aktif',
  cancelled: 'İptal',
}

/** DPP fiyatları KDV hariç; kartla TL tahsilatta eklenir */
export const DPP_KDV = 0.2
export const DPP_BILLINGS = ['once', 'month', 'year'] as const
export type DppBilling = (typeof DPP_BILLINGS)[number]
export const DPP_BILLING_LABEL: Record<DppBilling, string> = { once: 'Tek sefer', month: '1 aylık', year: '12 aylık (yıllık peşin)' }

/** Paket ve döneme göre toplam (€, KDV hariç) */
export function dppPeriodEur(planEur: number, billing: DppBilling) {
  return billing === 'year' ? planEur * 12 : planEur
}

/** Kurumsal paketin fiyatı teklifle netleşir; kartla otomatik ödeme sadece sabit fiyatlı paketlerde */
export function dppCardPayable(planId: string) {
  return planId !== 'kurumsal'
}

/** € (KDV hariç) → TL kuruş (KDV dahil) */
export function dppTryKurus(eur: number, rate: number) {
  return Math.round(eur * rate * (1 + DPP_KDV) * 100)
}

/** Bayi birim fiyatı (kuruş), tam liraya aşağı yuvarlanır */
export function dealerUnitPrice(listKurus: number, discount = DEALER_PRODUCT_DISCOUNT) {
  return Math.floor((listKurus * (1 - discount)) / 100) * 100
}

/** DPP bayi fiyatı (€, kuruşa yuvarlanır) */
export function dppDealerEur(eur: number, discount = DEALER_DPP_DISCOUNT) {
  return Math.round(eur * (1 - discount) * 100) / 100
}

export function dealerProducts() {
  return DEALER_PRODUCT_IDS.map((id) => PRODUCTS.find((p) => p.id === id)!).filter(Boolean)
}

export interface DealerLineInput {
  productId: string
  variantId?: string | null
  quantity: number
}

/** Bayi sepetini sunucu tarafında katalogdan fiyatlar; tarayıcıdan gelen fiyata güvenilmez. */
export function priceDealerCart(lines: DealerLineInput[], discount = DEALER_PRODUCT_DISCOUNT) {
  const priced: Array<{
    productId: DealerProductId
    variantId: string | null
    variantLabel: string | null
    name: string
    quantity: number
    unitPrice: number
    listUnitPrice: number
    lineTotal: number
    physical: boolean
    requiresAccount: boolean
  }> = []
  for (const line of lines.slice(0, 40)) {
    const product = PRODUCTS.find((p) => p.id === line.productId)
    if (!product || !(DEALER_PRODUCT_IDS as readonly string[]).includes(product.id)) continue
    const quantity = Math.min(DEALER_MAX_QTY, Math.max(0, Math.floor(Number(line.quantity) || 0)))
    if (quantity === 0) continue
    const variant = product.variants?.find((v) => v.id === line.variantId) || product.variants?.[0] || null
    const unitPrice = dealerUnitPrice(product.price.TRY, discount)
    const existing = priced.find((p) => p.productId === product.id && p.variantId === (variant?.id || null))
    if (existing) {
      existing.quantity = Math.min(DEALER_MAX_QTY, existing.quantity + quantity)
      existing.lineTotal = existing.unitPrice * existing.quantity
      continue
    }
    priced.push({
      productId: product.id as DealerProductId,
      variantId: variant?.id || null,
      variantLabel: variant ? variant.label.tr : null,
      name: product.name.tr,
      quantity,
      unitPrice,
      listUnitPrice: product.price.TRY,
      lineTotal: unitPrice * quantity,
      physical: product.physical,
      requiresAccount: product.requiresAccount,
    })
  }
  const totalQty = priced.reduce((s, l) => s + l.quantity, 0)
  const subtotal = priced.reduce((s, l) => s + l.lineTotal, 0)
  const listTotal = priced.reduce((s, l) => s + l.listUnitPrice * l.quantity, 0)
  return { lines: priced, totalQty, subtotal, listTotal, saving: listTotal - subtotal, hasPhysical: priced.some((l) => l.physical) }
}
