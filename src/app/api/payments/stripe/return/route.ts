import { NextRequest, NextResponse } from 'next/server'
import { getOrder, markOrderPaid } from '@/lib/commerce/orders'
import { retrieveStripeSession } from '@/lib/commerce/stripe'
import { stripeAddressOf } from '@/lib/commerce/stripeAddress'

// Stripe Checkout başarılı dönüşü. Oturum Stripe'tan sorgulanıp doğrulanır.
// (Webhook da aynı işi yapar; hangisi önce gelirse teslim bir kez yapılır.)

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const orderNo = req.nextUrl.searchParams.get('order') || ''
  const sessionId = req.nextUrl.searchParams.get('session_id') || ''
  const order = orderNo ? await getOrder(orderNo) : null
  if (!order) return NextResponse.redirect(new URL('/cart?lang=en&payment=error', req.nextUrl.origin), 303)

  const orderPath = `/order/${order.order_no}?key=${order.access_key}${order.lang === 'en' ? '&lang=en' : ''}`
  try {
    const session = await retrieveStripeSession(sessionId)
    const ok =
      session.id === order.provider_ref &&
      session.payment_status === 'paid' &&
      session.client_reference_id === order.order_no &&
      session.amount_total === order.total
    if (ok) {
      await markOrderPaid(order.order_no, session.payment_intent || session.id, {
        address: stripeAddressOf(session),
        phone: session.customer_details?.phone || '',
      })
      return NextResponse.redirect(new URL(`${orderPath}&payment=success`, req.nextUrl.origin), 303)
    }
  } catch (error) {
    console.error('[stripe return]', error)
  }
  return NextResponse.redirect(new URL(orderPath, req.nextUrl.origin), 303)
}
