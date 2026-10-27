// Kurumsal hediye teklifi: ürünler, adet indirimi ve tahmini tutar.
// Hem sayfadaki canlı hesap (tarayıcı) hem sunucu kaydı aynı hesabı kullanır.
// Kademeler İK kataloğuyla aynıdır (deliverables/ik-katalog/build-ik.mjs).

import { PRODUCTS } from '@/lib/commerce/catalog'

export const QUOTE_PRODUCT_IDS = ['kolye-qr', 'kolye-nfc', 'anahtarlik-qr', 'anahtarlik-nfc', 'dijital-qr'] as const
export type QuoteProductId = (typeof QUOTE_PRODUCT_IDS)[number]

export const QUOTE_MIN_QTY = 10
export const QUOTE_MAX_QTY = 100000
export const QUOTE_TIERS = [
  { min: 10, rate: 0.1 },
  { min: 50, rate: 0.15 },
  { min: 200, rate: 0.2 },
] as const
export const QUOTE_DEPOSIT_RATE = 0.5

export function quoteTierRate(totalQty: number) {
  let rate = 0
  for (const tier of QUOTE_TIERS) if (totalQty >= tier.min) rate = tier.rate
  return rate
}

export type QuoteItems = Partial<Record<QuoteProductId, number>>

/** Adetleri temizler: yalnızca listedeki ürünler, 0 – QUOTE_MAX_QTY arası tam sayı */
export function cleanQuoteItems(input: unknown): QuoteItems {
  const out: QuoteItems = {}
  const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  for (const id of QUOTE_PRODUCT_IDS) {
    const qty = Math.floor(Number(source[id]) || 0)
    if (qty > 0) out[id] = Math.min(qty, QUOTE_MAX_QTY)
  }
  return out
}

/** Tutarlar kuruş, KDV dahil (site fiyatları KDV dahildir) */
export function estimateQuote(items: QuoteItems) {
  const lines = QUOTE_PRODUCT_IDS.flatMap((id) => {
    const qty = items[id] || 0
    const product = PRODUCTS.find((p) => p.id === id)
    if (!qty || !product) return []
    return [{ id, qty, unit: product.price.TRY, list: product.price.TRY * qty }]
  })
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0)
  const rate = quoteTierRate(totalQty)
  const listTotal = lines.reduce((sum, line) => sum + line.list, 0)
  const total = Math.round(listTotal * (1 - rate))
  return { lines, totalQty, rate, listTotal, discount: listTotal - total, total, deposit: Math.round(total * QUOTE_DEPOSIT_RATE) }
}
