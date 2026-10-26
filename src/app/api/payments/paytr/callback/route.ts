import { NextRequest } from 'next/server'
import { getOrder, markOrderFailed, markOrderPaid } from '@/lib/commerce/orders'
import { verifyPaytrCallback } from '@/lib/commerce/paytr'

// PayTR ödeme sonucunu buraya sunucudan sunucuya POST eder (Bildirim URL).
// Yanıt düz metin "OK" olmalı; aksi halde PayTR bildirimi tekrar gönderir.
// Siparişin ödendi sayılmasının tek yolu bu bildirimdir (kullanıcının döndüğü sayfa değil).

export const dynamic = 'force-dynamic'

function text(body: string, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const data = form ? verifyPaytrCallback(form) : null
  if (!data) return text('PAYTR notification failed: bad hash', 400)

  try {
    const order = await getOrder(data.merchantOid)
    // Bilinmeyen sipariş: tekrar denemenin faydası yok
    if (!order) return text('OK')

    if (data.status !== 'success') {
      await markOrderFailed(order.order_no, `PayTR: ${data.failedReason || 'başarısız'}`)
      return text('OK')
    }

    if (data.paymentAmount !== Number(order.total)) {
      await markOrderFailed(order.order_no, `PayTR: tutar uyuşmuyor (gelen ${data.paymentAmount}, sipariş ${order.total}) — elle kontrol et`)
      return text('OK')
    }

    await markOrderPaid(order.order_no, `paytr:${data.merchantOid}${data.testMode ? ':test' : ''}`)
    return text('OK')
  } catch (error) {
    // 500 dönünce PayTR bildirimi sonra tekrar dener
    console.error('[paytr callback]', error)
    return text('error', 500)
  }
}
