import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WarmPage } from '@/components/warm/SiteChrome'
import { formatMoney } from '@/lib/commerce/catalog'
import { getOrder, type OrderStatus } from '@/lib/commerce/orders'
import { formatDate, normalizeLang, withLang } from '@/lib/i18n'
import { COMPANY, whatsappHref } from '@/lib/site'
import ClearCartOnSuccess from './ClearCartOnSuccess'

export const metadata: Metadata = { title: 'Sipariş durumu', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const STATUS: Record<OrderStatus, { tr: string; en: string; tone: string }> = {
  pending: { tr: 'Ödeme bekleniyor', en: 'Awaiting payment', tone: 'w-chip-gold' },
  awaiting_transfer: { tr: 'Havale bekleniyor', en: 'Awaiting bank transfer', tone: 'w-chip-gold' },
  paid: { tr: 'Ödendi · hazırlanıyor', en: 'Paid · preparing', tone: 'w-chip-sage' },
  fulfilled: { tr: 'Tamamlandı', en: 'Completed', tone: 'w-chip-sage' },
  shipped: { tr: 'Kargoya verildi', en: 'Shipped', tone: 'w-chip-sage' },
  delivered: { tr: 'Teslim edildi', en: 'Delivered', tone: 'w-chip-sage' },
  failed: { tr: 'Ödeme başarısız', en: 'Payment failed', tone: '' },
  cancelled: { tr: 'İptal edildi', en: 'Cancelled', tone: 'w-chip-ink' },
  refunded: { tr: 'İade edildi', en: 'Refunded', tone: 'w-chip-ink' },
}

const T = {
  tr: {
    thanks: 'Teşekkürler! Siparişin alındı 🎉',
    order: 'Sipariş',
    failedTitle: 'Ödeme tamamlanamadı',
    failedDesc: 'Kartından para çekilmedi. Sepetine dönüp tekrar deneyebilir ya da havale ile ödeyebilirsin.',
    retry: 'Sepete dön',
    transferTitle: 'Havale / EFT bilgileri',
    transferDesc: 'Açıklama kısmına mutlaka sipariş numaranı yaz. Ödemen onaylanınca siparişin hazırlanır.',
    bank: 'Banka',
    receiver: 'Alıcı',
    amount: 'Tutar',
    reference: 'Açıklama',
    sendReceipt: "Dekontu WhatsApp'tan gönder",
    credits: 'QR hakkı hesabına eklendi',
    goAccount: 'Hesabıma git ve QR oluştur',
    guestbookReady: 'Anı defterin hazır',
    setupGuestbook: 'Anı defterini kur',
    shipping: 'Siparişin 1-3 iş gününde kargoya verilir. Kargo alıcı ödemelidir; ücreti teslimatta kargo firmasına ödenir. Takip numarası bu sayfada görünecek.',
    tracking: 'Kargo takip no',
    items: 'Ürünler',
    total: 'Toplam',
    keepLink: 'Bu sayfanın linkini sakla; siparişinin durumunu buradan takip edebilirsin.',
    help: 'Sorun mu var? WhatsApp destek',
    pendingDesc: 'Ödeme onayı bekleniyor. Ödemeyi tamamladıysan birkaç saniye içinde sayfayı yenile.',
  },
  en: {
    thanks: 'Thank you! Your order is confirmed 🎉',
    order: 'Order',
    failedTitle: 'Payment not completed',
    failedDesc: 'You were not charged. Go back to your cart and try again.',
    retry: 'Back to cart',
    transferTitle: 'Bank transfer details',
    transferDesc: 'Include your order number in the reference.',
    bank: 'Bank',
    receiver: 'Receiver',
    amount: 'Amount',
    reference: 'Reference',
    sendReceipt: 'Send receipt on WhatsApp',
    credits: 'QR credits were added to your account',
    goAccount: 'Go to my account and create a QR',
    guestbookReady: 'Your guestbook is ready',
    setupGuestbook: 'Set up your guestbook',
    shipping: 'Your order ships within 1-3 business days. Shipping is paid to the carrier on delivery. The tracking number will appear on this page.',
    tracking: 'Tracking number',
    items: 'Items',
    total: 'Total',
    keepLink: "Keep this page's link to follow your order status.",
    help: 'Need help? WhatsApp support',
    pendingDesc: 'Waiting for payment confirmation. If you completed the payment, refresh in a few seconds.',
  },
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNo: string }>
  searchParams: Promise<{ key?: string; lang?: string; payment?: string }>
}) {
  const { orderNo } = await params
  const query = await searchParams
  const order = await getOrder(orderNo)
  if (!order || !query.key || order.access_key !== query.key) notFound()

  const lang = normalizeLang(query.lang) || order.lang
  const t = T[lang]
  const status = STATUS[order.status] || STATUS.pending
  const success = ['paid', 'fulfilled', 'shipped', 'delivered'].includes(order.status)
  const hasPhysical = order.items.some((item) => item.physical)
  const amount = formatMoney(order.total, order.currency)

  return (
    <WarmPage lang={lang}>
      {(success || order.status === 'awaiting_transfer') && <ClearCartOnSuccess />}
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
        <div className="text-center">
          <span className={`w-chip ${status.tone}`}>{status[lang]}</span>
          <h1 className="font-display mt-4 text-3xl font-semibold sm:text-4xl">
            {order.status === 'failed' ? t.failedTitle : success || order.status === 'awaiting_transfer' ? t.thanks : `${t.order} ${order.order_no}`}
          </h1>
          <p className="mt-2 text-ink-2">
            {t.order} <span className="font-mono font-semibold text-ink">{order.order_no}</span> · {formatDate(order.created_at, lang)}
          </p>
        </div>

        {order.status === 'failed' && (
          <div className="w-card space-y-4 p-6 text-center">
            <p className="text-ink-2">{t.failedDesc}</p>
            <Link href={withLang('/cart', lang)} className="w-btn w-btn-primary">
              {t.retry}
            </Link>
          </div>
        )}

        {order.status === 'pending' && <div className="w-alert w-alert-info">{t.pendingDesc}</div>}

        {order.status === 'awaiting_transfer' && (
          <section className="w-card space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">🏦 {t.transferTitle}</h2>
            <p className="text-sm text-ink-2">{t.transferDesc}</p>
            <dl className="grid gap-3 rounded-2xl bg-cream-2 p-4 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-muted">{t.bank}</dt>
              <dd className="font-medium">{COMPANY.bankName}</dd>
              <dt className="text-muted">{t.receiver}</dt>
              <dd className="font-medium">{COMPANY.legalName}</dd>
              <dt className="text-muted">IBAN</dt>
              <dd className="font-mono font-semibold">{COMPANY.iban}</dd>
              <dt className="text-muted">{t.amount}</dt>
              <dd className="font-semibold">{amount}</dd>
              <dt className="text-muted">{t.reference}</dt>
              <dd className="font-mono font-semibold">{order.order_no}</dd>
            </dl>
            <a
              href={whatsappHref(`Merhaba QRNot, ${order.order_no} numaralı siparişimin havale dekontunu gönderiyorum. Tutar: ${amount}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-btn w-btn-whatsapp w-btn-block"
            >
              {t.sendReceipt}
            </a>
          </section>
        )}

        {success && order.fulfillment?.credits ? (
          <section className="w-card space-y-3 p-6 text-center">
            <p className="text-lg font-semibold">
              ✓ {order.fulfillment.credits} {t.credits}
            </p>
            <Link href={withLang('/account', lang)} className="w-btn w-btn-primary">
              {t.goAccount}
            </Link>
          </section>
        ) : null}

        {success && order.fulfillment?.guestbookSlugs?.length ? (
          <section className="w-card space-y-3 p-6">
            <p className="text-lg font-semibold">📖 {t.guestbookReady}</p>
            {order.fulfillment.guestbookSlugs.map((slug) => (
              <Link key={slug} href={withLang(`/q/${slug}`, lang)} className="w-btn w-btn-primary w-btn-block">
                {t.setupGuestbook} ({slug}) →
              </Link>
            ))}
          </section>
        ) : null}

        {success && hasPhysical && (
          <div className="w-alert w-alert-success">
            🚚 {t.shipping}
            {order.tracking_no && (
              <p className="mt-2 font-semibold">
                {t.tracking}: <span className="font-mono">{order.tracking_no}</span>
              </p>
            )}
          </div>
        )}

        <section className="w-card space-y-3 p-6">
          <h2 className="font-semibold">{t.items}</h2>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between gap-3 text-sm">
              <span className="text-ink-2">
                {item.quantity}× {item.name}
                {item.variantLabel ? ` · ${item.variantLabel}` : ''}
              </span>
              <span className="font-medium">{formatMoney(item.lineTotal, order.currency)}</span>
            </div>
          ))}
          <div className="w-divider" />
          <div className="flex justify-between font-bold">
            <span>{t.total}</span>
            <span>{amount}</span>
          </div>
        </section>

        <p className="text-center text-xs text-muted">{t.keepLink}</p>
        <div className="text-center">
          <a
            href={whatsappHref(`Merhaba QRNot, ${order.order_no} numaralı siparişim hakkında yazıyorum.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-link text-sm"
          >
            {t.help}
          </a>
        </div>
      </div>
    </WarmPage>
  )
}
