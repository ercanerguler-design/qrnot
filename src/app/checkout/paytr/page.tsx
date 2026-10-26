import type { Metadata } from 'next'
import Script from 'next/script'
import { notFound, redirect } from 'next/navigation'
import { WarmPage } from '@/components/warm/SiteChrome'
import { formatMoney } from '@/lib/commerce/catalog'
import { getOrder } from '@/lib/commerce/orders'
import { PAYTR_IFRAME_URL } from '@/lib/commerce/paytr'

export const metadata: Metadata = { title: 'Güvenli ödeme', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function PaytrCheckoutPage({ searchParams }: { searchParams: Promise<{ order?: string; key?: string }> }) {
  const { order: orderNo, key } = await searchParams
  const order = orderNo ? await getOrder(orderNo) : null
  if (!order || order.access_key !== key || order.provider !== 'paytr') notFound()

  const en = order.lang === 'en'
  const orderPath = `/order/${order.order_no}?key=${order.access_key}${en ? '&lang=en' : ''}`
  // Ödeme alındıysa, başarısızsa ya da ödeme oturumu yoksa sipariş sayfasına
  if (order.status !== 'pending' || !order.provider_ref) redirect(orderPath)

  return (
    <WarmPage lang={order.lang}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">🔒 {en ? 'Secure payment' : 'Güvenli ödeme'}</p>
            <h1 className="font-display mt-1 text-2xl font-semibold">
              {en ? 'Order' : 'Sipariş'} <span className="font-mono">{order.order_no}</span>
            </h1>
          </div>
          <p className="text-2xl font-bold">{formatMoney(order.total, order.currency)}</p>
        </div>
        <div className="w-card overflow-hidden p-2 sm:p-4">
          <iframe
            id="paytriframe"
            src={`${PAYTR_IFRAME_URL}${order.provider_ref}`}
            title="PayTR"
            className="w-full border-0"
            style={{ minHeight: 600 }}
            scrolling="no"
          />
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          {en
            ? 'Payments are processed by PayTR. Your card details never reach QRNot servers.'
            : 'Ödeme altyapısı PayTR tarafından sağlanır. Kart bilgilerin QRNot sunucularına ulaşmaz.'}
        </p>
      </div>
      <Script src="https://www.paytr.com/js/iframeResizer.min.js" strategy="afterInteractive" />
      <Script id="paytr-resize" strategy="afterInteractive">
        {`(function r(n){if(window.iFrameResize){window.iFrameResize({},'#paytriframe')}else if(n<50){setTimeout(function(){r(n+1)},100)}})(0)`}
      </Script>
    </WarmPage>
  )
}
