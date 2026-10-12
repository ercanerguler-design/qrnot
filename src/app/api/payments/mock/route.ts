import { NextRequest, NextResponse } from 'next/server'
import { getOrder, markOrderFailed, markOrderPaid } from '@/lib/commerce/orders'
import { mockPaymentsAllowed } from '@/lib/commerce/providers'

// SADECE yerel test: PAYMENT_MOCK=1 ve canlı olmayan ortamda ödeme sonucunu simüle eder.
export async function POST(req: NextRequest) {
  if (!mockPaymentsAllowed()) return NextResponse.json({ error: 'Not available' }, { status: 404 })
  const form = await req.formData()
  const order = await getOrder(String(form.get('order') || ''))
  if (!order || order.access_key !== String(form.get('key') || '') || order.provider !== 'mock') {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  const success = form.get('outcome') === 'success'
  if (success) await markOrderPaid(order.order_no, `mock-${Date.now()}`)
  else await markOrderFailed(order.order_no, 'mock: kullanıcı başarısız ödemeyi seçti')
  const target = `/order/${order.order_no}?key=${order.access_key}${order.lang === 'en' ? '&lang=en' : ''}&payment=${success ? 'success' : 'failed'}`
  return NextResponse.redirect(new URL(target, req.nextUrl.origin), 303)
}
