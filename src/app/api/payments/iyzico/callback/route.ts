import { NextRequest, NextResponse } from 'next/server'
import { retrieveIyzicoCheckout } from '@/lib/commerce/iyzico'
import { getOrder, markOrderFailed, markOrderPaid } from '@/lib/commerce/orders'

// iyzico ödeme sonrası kullanıcıyı buraya POST eder (form: token).
// Sonuç iyzico'dan sunucu-sunucu sorgulanır; tutar ve sipariş no eşleşmezse ödendi sayılmaz.

export const dynamic = 'force-dynamic'

function redirectTo(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.nextUrl.origin), 303)
}

export async function POST(req: NextRequest) {
  const orderNo = req.nextUrl.searchParams.get('order') || ''
  const order = orderNo ? await getOrder(orderNo) : null
  if (!order) return redirectTo(req, '/cart?payment=error')

  const orderPath = `/order/${order.order_no}?key=${order.access_key}${order.lang === 'en' ? '&lang=en' : ''}`

  try {
    const form = await req.formData()
    const token = String(form.get('token') || order.provider_ref || '')
    if (!token) {
      await markOrderFailed(order.order_no, 'iyzico callback: token yok')
      return redirectTo(req, `${orderPath}&payment=failed`)
    }

    const result = await retrieveIyzicoCheckout(token, order.order_no)
    const paidKurus = Math.round(Number(result.paidPrice || 0) * 100)
    const ok =
      result.status === 'success' &&
      result.paymentStatus === 'SUCCESS' &&
      result.basketId === order.order_no &&
      paidKurus === order.total &&
      result.fraudStatus !== -1

    if (!ok) {
      await markOrderFailed(order.order_no, `iyzico: ${result.paymentStatus || result.status} ${result.errorMessage || ''} paid=${paidKurus}`)
      return redirectTo(req, `${orderPath}&payment=failed`)
    }

    await markOrderPaid(order.order_no, result.paymentId || token)
    return redirectTo(req, `${orderPath}&payment=success`)
  } catch (error) {
    console.error('[iyzico callback]', error)
    return redirectTo(req, `${orderPath}&payment=failed`)
  }
}
