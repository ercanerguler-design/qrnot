import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'
// Varsayılan oranlar (%30 ürün, %35 DPP) tablo tanımında sabit; dealersShared.ts ile aynı tutulmalı.
import {
  BUSINESS_TYPES,
  DPP_DEALER_PLANS,
  dppDealerEur,
  type DealerStatus,
  type DppDealerPlanId,
  type DppRequestStatus,
} from '@/lib/dealersShared'

// Bayilik: başvuru (dealers), bayi ürün siparişleri (shop_orders.dealer_id) ve DPP paket talepleri (dealer_dpp_requests).
// Bayi, başvurudaki e-postayla açılmış QRNot hesabıyla /bayi paneline girer.

export class DealerError extends Error {}

export interface Dealer {
  id: string
  user_id: string | null
  status: DealerStatus
  company: string
  tax_office: string
  tax_no: string
  contact_name: string
  email: string
  phone: string
  city: string
  district: string
  address: string
  business_type: string
  website: string
  expected_monthly: number
  interests: string[]
  message: string
  discount_pct: number
  dpp_discount_pct: number
  admin_note: string
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface DealerDppRequest {
  id: string
  dealer_id: string
  customer_company: string
  customer_contact: string
  customer_email: string
  customer_phone: string
  plan: DppDealerPlanId
  list_eur: number
  dealer_eur: number
  payment_method: 'card' | 'transfer'
  status: DppRequestStatus
  paid: boolean
  paid_at: string | null
  note: string
  admin_note: string
  created_at: string
  updated_at: string
}

let schemaPromise: Promise<void> | null = null
export function ensureDealerSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await ensureGrowthSchema()
      await sql`
        CREATE TABLE IF NOT EXISTS dealers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          status VARCHAR(16) NOT NULL DEFAULT 'pending',
          company VARCHAR(200) NOT NULL,
          tax_office VARCHAR(120) NOT NULL DEFAULT '',
          tax_no VARCHAR(20) NOT NULL DEFAULT '',
          contact_name VARCHAR(120) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(40) NOT NULL,
          city VARCHAR(80) NOT NULL DEFAULT '',
          district VARCHAR(80) NOT NULL DEFAULT '',
          address TEXT NOT NULL DEFAULT '',
          business_type VARCHAR(80) NOT NULL DEFAULT '',
          website VARCHAR(255) NOT NULL DEFAULT '',
          expected_monthly INTEGER NOT NULL DEFAULT 0,
          interests JSONB NOT NULL DEFAULT '[]'::jsonb,
          message TEXT NOT NULL DEFAULT '',
          discount_pct NUMERIC(5,2) NOT NULL DEFAULT 30,
          dpp_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 35,
          admin_note TEXT NOT NULL DEFAULT '',
          approved_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_dealers_email ON dealers(lower(email))`
      await sql`CREATE INDEX IF NOT EXISTS idx_dealers_user ON dealers(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_dealers_status ON dealers(status)`
      await sql`ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS dealer_id UUID`
      await sql`CREATE INDEX IF NOT EXISTS idx_shop_orders_dealer ON shop_orders(dealer_id) WHERE dealer_id IS NOT NULL`
      await sql`
        CREATE TABLE IF NOT EXISTS dealer_dpp_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
          customer_company VARCHAR(200) NOT NULL,
          customer_contact VARCHAR(120) NOT NULL DEFAULT '',
          customer_email VARCHAR(255) NOT NULL DEFAULT '',
          customer_phone VARCHAR(40) NOT NULL DEFAULT '',
          plan VARCHAR(20) NOT NULL,
          list_eur NUMERIC(10,2) NOT NULL,
          dealer_eur NUMERIC(10,2) NOT NULL,
          payment_method VARCHAR(12) NOT NULL DEFAULT 'transfer',
          status VARCHAR(16) NOT NULL DEFAULT 'new',
          paid BOOLEAN NOT NULL DEFAULT FALSE,
          paid_at TIMESTAMP WITH TIME ZONE,
          note TEXT NOT NULL DEFAULT '',
          admin_note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_dealer_dpp_dealer ON dealer_dpp_requests(dealer_id)`
    })().catch((error) => {
      schemaPromise = null
      throw error
    })
  }
  return schemaPromise
}

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseApplication(body: Record<string, unknown>) {
  const input = {
    company: str(body.company, 200),
    taxOffice: str(body.taxOffice, 120),
    taxNo: str(body.taxNo, 20).replace(/\s/g, ''),
    contactName: str(body.contactName, 120),
    email: str(body.email, 255).toLowerCase(),
    phone: str(body.phone, 40),
    city: str(body.city, 80),
    district: str(body.district, 80),
    address: str(body.address, 600),
    businessType: str(body.businessType, 80),
    website: str(body.website, 255),
    expectedMonthly: Math.max(0, Math.min(1_000_000, Math.floor(Number(body.expectedMonthly) || 0))),
    interests: (Array.isArray(body.interests) ? body.interests : []).map((x) => str(x, 20)).filter((x) => ['products', 'dpp'].includes(x)),
    message: str(body.message, 2000),
  }
  if (input.company.length < 2) throw new DealerError('Firma adını yaz.')
  if (input.contactName.split(/\s+/).length < 2) throw new DealerError('Yetkili kişinin adını ve soyadını yaz.')
  if (!EMAIL_RE.test(input.email)) throw new DealerError('Geçerli bir e-posta yaz.')
  if (input.phone.replace(/\D/g, '').length < 10) throw new DealerError('Geçerli bir telefon numarası yaz.')
  if (!input.city) throw new DealerError('Şehri yaz.')
  if (!/^\d{10,11}$/.test(input.taxNo)) throw new DealerError('Vergi numarası 10, TC kimlik numarası 11 hane olmalı.')
  if (!input.taxOffice) throw new DealerError('Vergi dairesini yaz.')
  if (!(BUSINESS_TYPES as readonly string[]).includes(input.businessType)) throw new DealerError('İşletme türünü seç.')
  if (input.interests.length === 0) throw new DealerError('İlgilendiğin bayiliği seç: ürünler, DPP ya da ikisi.')
  if (body.consent !== true) throw new DealerError('Aydınlatma metnini ve bayilik şartlarını onaylamalısın.')
  return input
}

export async function saveApplication(input: ReturnType<typeof parseApplication>, userId: string | null) {
  await ensureDealerSchema()
  const dup = (await sql`
    SELECT status FROM dealers WHERE lower(email) = ${input.email} AND status IN ('pending', 'approved', 'suspended') LIMIT 1
  `) as Array<{ status: DealerStatus }>
  if (dup[0]) {
    throw new DealerError(
      dup[0].status === 'pending'
        ? 'Bu e-postayla yapılmış bir başvurun zaten inceleniyor. En geç 2 iş günü içinde dönüş yapacağız.'
        : 'Bu e-posta zaten bir bayi hesabına bağlı. Bayi paneline giriş yapabilirsin: www.qrnot.com/bayi'
    )
  }
  const rows = (await sql`
    INSERT INTO dealers (user_id, company, tax_office, tax_no, contact_name, email, phone, city, district, address, business_type, website, expected_monthly, interests, message)
    VALUES (${userId}, ${input.company}, ${input.taxOffice}, ${input.taxNo}, ${input.contactName}, ${input.email}, ${input.phone}, ${input.city},
            ${input.district}, ${input.address}, ${input.businessType}, ${input.website}, ${input.expectedMonthly}, ${JSON.stringify(input.interests)}::jsonb, ${input.message})
    RETURNING id
  `) as Array<{ id: string }>
  return rows[0].id
}

/** Giriş yapan kullanıcının bayi kaydı: önce hesaba bağlı olan, yoksa aynı e-postayla yapılmış son başvuru (bulunursa hesaba bağlanır). */
export async function getDealerForUser(user: { id: string; email: string }) {
  await ensureDealerSchema()
  let rows = (await sql`SELECT * FROM dealers WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1`) as unknown as Dealer[]
  if (!rows[0]) {
    rows = (await sql`
      UPDATE dealers SET user_id = ${user.id}, updated_at = NOW()
      WHERE id = (SELECT id FROM dealers WHERE lower(email) = ${user.email.toLowerCase()} AND user_id IS NULL ORDER BY created_at DESC LIMIT 1)
      RETURNING *
    `) as unknown as Dealer[]
  }
  return rows[0] || null
}

export async function listDealerOrders(dealerId: string) {
  return sql`
    SELECT order_no, access_key, status, provider, total, items, created_at, paid_at, tracking_no
    FROM shop_orders WHERE dealer_id = ${dealerId} ORDER BY created_at DESC LIMIT 200
  `
}

/** PayTR ödeme penceresi 30 dk (paytr.ts timeout_limit); güvenlik payıyla 35 dk dolmadan kartlı sipariş silinmez */
export const CARD_DELETE_AFTER_MS = 35 * 60 * 1000

/** Bayinin silebileceği sipariş: ödenmemiş olmalı; kartla ödeme bekleyende ödeme penceresi kapanmış olmalı */
export function dealerOrderDeletable(order: { status: string; provider: string; created_at: string }, now = Date.now()) {
  if (order.status === 'failed' || order.status === 'cancelled') return { ok: true as const }
  if (order.status === 'awaiting_transfer') return { ok: true as const }
  if (order.status === 'pending') {
    const left = CARD_DELETE_AFTER_MS - (now - new Date(order.created_at).getTime())
    if (order.provider !== 'paytr' || left <= 0) return { ok: true as const }
    return { ok: false as const, reason: `Kartla ödeme sayfası hâlâ açık olabilir. Ödeme yapmadıysan ${Math.ceil(left / 60000)} dakika sonra silebilirsin.` }
  }
  return { ok: false as const, reason: 'Ödemesi alınmış sipariş silinemez. Değişiklik ya da iade için bizimle iletişime geç.' }
}

/** Bayi kendi ödenmemiş siparişini siler; sipariş adminden de kalkar. Ödenmemiş siparişte teslim edilmiş dijital ürün yoktur. */
export async function deleteDealerOrder(dealerId: string, orderNo: string) {
  const rows = (await sql`
    SELECT order_no, status, provider, total, created_at FROM shop_orders WHERE order_no = ${orderNo} AND dealer_id = ${dealerId} LIMIT 1
  `) as Array<{ order_no: string; status: string; provider: string; total: number; created_at: string }>
  const order = rows[0]
  if (!order) throw new DealerError('Sipariş bulunamadı.')
  const check = dealerOrderDeletable(order)
  if (!check.ok) throw new DealerError(check.reason)
  // Durum aynı anda değişmiş olabilir (ör. ödeme o an onaylandı): sadece hâlâ ödenmemişse sil
  const deleted = (await sql`
    DELETE FROM shop_orders
    WHERE order_no = ${orderNo} AND dealer_id = ${dealerId} AND status IN ('pending', 'awaiting_transfer', 'failed', 'cancelled') AND paid_at IS NULL
    RETURNING order_no
  `) as Array<{ order_no: string }>
  if (!deleted[0]) throw new DealerError('Sipariş silinemedi: ödeme durumu değişmiş olabilir. Sayfayı yenile.')
  return order
}

export async function listDealerDppRequests(dealerId: string) {
  return (await sql`SELECT * FROM dealer_dpp_requests WHERE dealer_id = ${dealerId} ORDER BY created_at DESC LIMIT 200`) as unknown as DealerDppRequest[]
}

export async function createDppRequest(dealer: Dealer, body: Record<string, unknown>) {
  const plan = DPP_DEALER_PLANS.find((p) => p.id === body.plan)
  if (!plan) throw new DealerError('DPP paketini seç.')
  const customerCompany = str(body.customerCompany, 200)
  if (customerCompany.length < 2) throw new DealerError('Müşteri firmanın adını yaz.')
  const customerEmail = str(body.customerEmail, 255).toLowerCase()
  if (customerEmail && !EMAIL_RE.test(customerEmail)) throw new DealerError('Müşterinin e-postası geçersiz.')
  const payment = body.paymentMethod === 'card' ? 'card' : 'transfer'
  const dealerEur = dppDealerEur(plan.eur, Number(dealer.dpp_discount_pct) / 100)
  const rows = (await sql`
    INSERT INTO dealer_dpp_requests (dealer_id, customer_company, customer_contact, customer_email, customer_phone, plan, list_eur, dealer_eur, payment_method, note)
    VALUES (${dealer.id}, ${customerCompany}, ${str(body.customerContact, 120)}, ${customerEmail}, ${str(body.customerPhone, 40)}, ${plan.id},
            ${plan.eur}, ${dealerEur}, ${payment}, ${str(body.note, 1000)})
    RETURNING *
  `) as unknown as DealerDppRequest[]
  return rows[0]
}

/** Admin listesi: her bayinin sipariş adedi, ödenen ve bekleyen tutarı, son sipariş ve DPP talepleri */
export async function adminDealerList(status: string | null) {
  await ensureDealerSchema()
  return sql`
    SELECT d.*,
      COALESCE(o.orders, 0)::int AS order_count,
      COALESCE(o.qty, 0)::int AS total_qty,
      COALESCE(o.paid_total, 0)::bigint AS paid_total,
      COALESCE(o.unpaid_total, 0)::bigint AS unpaid_total,
      o.last_order_at,
      COALESCE(p.requests, 0)::int AS dpp_count,
      COALESCE(p.paid_eur, 0)::numeric AS dpp_paid_eur,
      COALESCE(p.unpaid_eur, 0)::numeric AS dpp_unpaid_eur
    FROM dealers d
    LEFT JOIN (
      SELECT dealer_id,
        COUNT(*) FILTER (WHERE status NOT IN ('failed', 'cancelled')) AS orders,
        SUM((SELECT COALESCE(SUM((l->>'quantity')::int), 0) FROM jsonb_array_elements(items) l)) FILTER (WHERE status NOT IN ('failed', 'cancelled', 'refunded')) AS qty,
        SUM(total) FILTER (WHERE status IN ('paid', 'fulfilled', 'shipped', 'delivered')) AS paid_total,
        SUM(total) FILTER (WHERE status IN ('pending', 'awaiting_transfer')) AS unpaid_total,
        MAX(created_at) AS last_order_at
      FROM shop_orders WHERE dealer_id IS NOT NULL GROUP BY dealer_id
    ) o ON o.dealer_id = d.id
    LEFT JOIN (
      SELECT dealer_id, COUNT(*) FILTER (WHERE status <> 'cancelled') AS requests,
        SUM(dealer_eur) FILTER (WHERE paid AND status <> 'cancelled') AS paid_eur,
        SUM(dealer_eur) FILTER (WHERE NOT paid AND status <> 'cancelled') AS unpaid_eur
      FROM dealer_dpp_requests GROUP BY dealer_id
    ) p ON p.dealer_id = d.id
    WHERE (${status}::text IS NULL OR d.status = ${status})
    ORDER BY (d.status = 'pending') DESC, COALESCE(o.paid_total, 0) DESC, d.created_at DESC
    LIMIT 500
  `
}
