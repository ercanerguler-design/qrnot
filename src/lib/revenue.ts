import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

// Gelir tablosu ve Excel dışa aktarımı için ortak hesaplama.
// Sadece gerçekleşen satışlar: site siparişleri ödendiği andaki tutarla (ödeme tarihine göre), diğer kanallar elle girilen kayıtlarla.
// "Sayım başlangıcı" öncesindeki her şey (testler, denemeler) dışarıda kalır.

export const REVENUE_CHANNEL_LABEL: Record<string, string> = {
  site: 'Site (qrnot.com)',
  etsy: 'Etsy',
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
  kurumsal: 'Kurumsal',
  diger: 'Diğer',
}
export const REVENUE_CHANNEL_ORDER = ['site', 'etsy', 'trendyol', 'hepsiburada', 'kurumsal', 'diger']

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

export async function resolveRevenueRange(fromInput: unknown, toInput: unknown) {
  await ensureGrowthSchema()
  const settingRows = (await sql`SELECT value FROM app_settings WHERE key = 'revenue_start_date'`) as Array<{ value: string }>
  const startDate = settingRows[0]?.value || null
  // Başlangıç ile seçilen dönemin başından hangisi daha geçse o kullanılır
  const from = [startDate, isDate(fromInput) ? fromInput : null].filter((v): v is string => Boolean(v)).sort().pop() || '1970-01-01'
  const to = isDate(toInput) ? toInput : '9999-12-31'
  return { startDate, from, to }
}

export interface RevenueRow {
  channel: string
  currency: string
  orders: number
  gross: number
  refunds: number
  net: number
}

export async function revenueSummary(from: string, to: string): Promise<RevenueRow[]> {
  const site = (await sql`
    SELECT currency,
           COUNT(*)::int AS orders,
           COALESCE(SUM(total), 0)::bigint AS gross,
           COALESCE(SUM(total) FILTER (WHERE status IN ('refunded', 'cancelled')), 0)::bigint AS refunds
    FROM shop_orders
    WHERE paid_at IS NOT NULL
      AND (paid_at AT TIME ZONE 'Europe/Istanbul')::date >= ${from}::date
      AND (paid_at AT TIME ZONE 'Europe/Istanbul')::date <= ${to}::date
    GROUP BY currency
  `) as Array<{ currency: string; orders: number; gross: number; refunds: number }>

  const manual = (await sql`
    SELECT channel, currency,
           COALESCE(SUM(quantity) FILTER (WHERE kind = 'sale'), 0)::int AS orders,
           COALESCE(SUM(amount) FILTER (WHERE kind = 'sale'), 0)::bigint AS gross,
           COALESCE(SUM(amount) FILTER (WHERE kind = 'refund'), 0)::bigint AS refunds
    FROM manual_sales
    WHERE sale_date >= ${from}::date AND sale_date <= ${to}::date
    GROUP BY channel, currency
  `) as Array<{ channel: string; currency: string; orders: number; gross: number; refunds: number }>

  return [
    ...site.map((r) => ({ channel: 'site', currency: r.currency, orders: Number(r.orders), gross: Number(r.gross), refunds: Number(r.refunds) })),
    ...manual.map((r) => ({ channel: r.channel, currency: r.currency, orders: Number(r.orders), gross: Number(r.gross), refunds: Number(r.refunds) })),
  ]
    .map((r) => ({ ...r, net: r.gross - r.refunds }))
    .sort((a, b) => REVENUE_CHANNEL_ORDER.indexOf(a.channel) - REVENUE_CHANNEL_ORDER.indexOf(b.channel) || a.currency.localeCompare(b.currency))
}

export interface OrderDetailRow {
  order_no: string
  status: string
  provider: string
  currency: string
  total: number
  full_name: string
  email: string
  items: Array<{ name: string; variantLabel: string | null; quantity: number }>
  created_at: string
  paid_at: string | null
}

/** Ödeme tarihi dönem içinde olan (gelir sayılan) site siparişleri */
export async function paidOrders(from: string, to: string) {
  return (await sql`
    SELECT order_no, status, provider, currency, total, full_name, email, items, created_at, paid_at
    FROM shop_orders
    WHERE paid_at IS NOT NULL
      AND (paid_at AT TIME ZONE 'Europe/Istanbul')::date >= ${from}::date
      AND (paid_at AT TIME ZONE 'Europe/Istanbul')::date <= ${to}::date
    ORDER BY paid_at ASC
  `) as unknown as OrderDetailRow[]
}

/** Oluşturulma tarihi dönem içinde olan tüm site siparişleri (iptal ve ödenmeyenler dahil) */
export async function allOrders(from: string, to: string) {
  return (await sql`
    SELECT order_no, status, provider, currency, total, full_name, email, items, created_at, paid_at
    FROM shop_orders
    WHERE (created_at AT TIME ZONE 'Europe/Istanbul')::date >= ${from}::date
      AND (created_at AT TIME ZONE 'Europe/Istanbul')::date <= ${to}::date
    ORDER BY created_at ASC
  `) as unknown as OrderDetailRow[]
}

export interface ManualSaleRow {
  sale_date: string
  channel: string
  kind: string
  amount: number
  currency: string
  quantity: number
  note: string
}

export async function manualSales(from: string, to: string) {
  return (await sql`
    SELECT sale_date::text AS sale_date, channel, kind, amount, currency, quantity, note
    FROM manual_sales
    WHERE sale_date >= ${from}::date AND sale_date <= ${to}::date
    ORDER BY sale_date ASC, created_at ASC
  `) as unknown as ManualSaleRow[]
}
