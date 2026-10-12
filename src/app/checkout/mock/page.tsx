import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { formatMoney } from '@/lib/commerce/catalog'
import { getOrder } from '@/lib/commerce/orders'
import { mockPaymentsAllowed } from '@/lib/commerce/providers'

export const metadata: Metadata = { title: 'Test ödemesi', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function MockCheckoutPage({ searchParams }: { searchParams: Promise<{ order?: string; key?: string }> }) {
  if (!mockPaymentsAllowed()) notFound()
  const { order: orderNo, key } = await searchParams
  const order = orderNo ? await getOrder(orderNo) : null
  if (!order || order.access_key !== key) notFound()

  return (
    <div className="warm flex min-h-screen items-center justify-center px-4">
      <div className="w-card w-full max-w-md space-y-5 p-8 text-center">
        <span className="w-chip w-chip-gold">🧪 TEST ÖDEMESİ — gerçek para çekilmez</span>
        <h1 className="font-display text-2xl font-semibold">{order.order_no}</h1>
        <p className="text-3xl font-bold">{formatMoney(order.total, order.currency)}</p>
        <form action="/api/payments/mock" method="POST" className="grid gap-2">
          <input type="hidden" name="order" value={order.order_no} />
          <input type="hidden" name="key" value={order.access_key} />
          <button name="outcome" value="success" className="w-btn w-btn-primary">
            ✓ Ödeme başarılı
          </button>
          <button name="outcome" value="fail" className="w-btn w-btn-ghost">
            ✕ Ödeme başarısız
          </button>
        </form>
      </div>
    </div>
  )
}
