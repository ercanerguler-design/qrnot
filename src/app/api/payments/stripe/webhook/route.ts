import { NextRequest, NextResponse } from 'next/server'
import { getOrder, markOrderPaid } from '@/lib/commerce/orders'
import { verifyStripeSignature, type StripeSession } from '@/lib/commerce/stripe'
import { stripeAddressOf } from '@/lib/commerce/stripeAddress'

// Stripe webhook: checkout.session.completed → siparişi ödendi işaretler.
// Stripe panelinde endpoint: https://qrnot.com/api/payments/stripe/webhook

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const secret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim()
  if (!verifyStripeSignature(raw, req.headers.get('stripe-signature'), secret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(raw) as { type: string; data: { object: StripeSession } }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object
    const orderNo = session.client_reference_id || session.metadata?.order_no || ''
    const order = orderNo ? await getOrder(orderNo) : null
    if (order && session.payment_status === 'paid' && session.amount_total === order.total) {
      await markOrderPaid(order.order_no, session.payment_intent || session.id, {
        address: stripeAddressOf(session),
        phone: session.customer_details?.phone || '',
      })
    }
  }

  return NextResponse.json({ received: true })
}
