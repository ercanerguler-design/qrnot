import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { priceCart, type CartLine, type Currency } from '@/lib/commerce/catalog'
import { createOrder, markOrderFailed, setOrderProviderRef, type OrderAddress, type PaymentProvider } from '@/lib/commerce/orders'
import { getPaytrToken } from '@/lib/commerce/paytr'
import { availableProviders } from '@/lib/commerce/providers'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { normalizeLang } from '@/lib/i18n'
import { trackConversion } from '@/lib/analytics'

// Ödeme başlatır: siparişi oluşturur ve ödeme sağlayıcısının sayfasına yönlendirme adresi döner.

export const dynamic = 'force-dynamic'

function bad(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers)
    if (!(await consumeRateLimit(`checkout:${ip}`, 20, 3600))) {
      return bad('Çok fazla deneme. Lütfen biraz sonra tekrar dene.', 429)
    }

    const body = await req.json().catch(() => ({}))
    const lang = normalizeLang(body.lang) || 'tr'
    const currency: Currency = lang === 'en' ? 'USD' : 'TRY'
    const provider = String(body.provider || '') as PaymentProvider
    const en = lang === 'en'

    if (!availableProviders(currency).includes(provider)) {
      return bad(en ? 'This payment method is not available.' : 'Bu ödeme yöntemi şu an kullanılamıyor.')
    }

    const lines: CartLine[] = Array.isArray(body.lines) ? body.lines : []
    const cart = priceCart(lines, currency, lang)
    if (cart.lines.length === 0 || cart.total <= 0) return bad(en ? 'Your cart is empty.' : 'Sepetin boş.')

    const user = await getAuthenticatedUser(req)
    // Tüm satın almalar üye hesabına bağlanır.
    if (!user) {
      return bad(en ? 'Please sign in: your purchases are linked to your account.' : 'Satın aldığın ürünler hesabına tanımlanacağı için giriş yapmalısın.', 401, {
        needLogin: true,
      })
    }

    const customer = body.customer || {}
    const fullName = String(customer.fullName || '')
      .trim()
      .slice(0, 160)
    const email = String(user?.email || customer.email || '')
      .trim()
      .toLowerCase()
      .slice(0, 255)
    const phone = String(customer.phone || '')
      .trim()
      .slice(0, 40)

    if (fullName.split(/\s+/).length < 2) return bad(en ? 'Please enter your full name.' : 'Ad ve soyadını yaz.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(en ? 'Please enter a valid email.' : 'Geçerli bir e-posta yaz.')
    if (currency === 'TRY' && phone.replace(/\D/g, '').length < 10) return bad('Geçerli bir telefon numarası yaz.')

    const rawAddress = body.address || {}
    let address: OrderAddress | null = null
    if (cart.hasPhysical) {
      address = {
        line: String(rawAddress.line || '')
          .trim()
          .slice(0, 300),
        district: String(rawAddress.district || '')
          .trim()
          .slice(0, 80),
        city: String(rawAddress.city || '')
          .trim()
          .slice(0, 80),
        postalCode: String(rawAddress.postalCode || '')
          .trim()
          .slice(0, 16),
        country: String(rawAddress.country || (currency === 'TRY' ? 'Türkiye' : ''))
          .trim()
          .slice(0, 60),
      }
      if (address.line.length < 8 || !address.city || !address.country) return bad(en ? 'Please enter your delivery address.' : 'Teslimat adresini eksiksiz yaz.')
    }

    const consents = body.consents || {}
    if (!consents.terms) return bad(en ? 'Please accept the terms.' : 'Sözleşmeleri onaylamalısın.')
    if (currency === 'TRY' && (!consents.preInfo || !consents.distanceSales)) {
      return bad('Ön bilgilendirme formu ve mesafeli satış sözleşmesini onaylamalısın.')
    }

    const order = await createOrder({
      provider,
      currency,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
      lang,
      userId: user?.id || null,
      email,
      fullName,
      phone,
      address,
      items: cart.lines,
      consents: {
        terms: true,
        preInfo: Boolean(consents.preInfo),
        distanceSales: Boolean(consents.distanceSales),
        marketing: Boolean(consents.marketing),
        acceptedAt: new Date().toISOString(),
        ip,
        userAgent: String(req.headers.get('user-agent') || '').slice(0, 300),
      },
      customerNote: String(body.note || '')
        .trim()
        .slice(0, 500),
      clientIp: ip,
    })

    if (provider !== 'mock') trackConversion(req, 'checkout_start', { path: '/checkout', value: Number(order.total) / 100, currency, props: { orderNo: order.order_no, provider } })

    const origin = req.nextUrl.origin
    const orderUrl = `${origin}/order/${order.order_no}?key=${order.access_key}${en ? '&lang=en' : ''}`

    if (provider === 'transfer') {
      return NextResponse.json({ orderNo: order.order_no, redirectUrl: orderUrl })
    }

    if (provider === 'mock') {
      return NextResponse.json({
        orderNo: order.order_no,
        redirectUrl: `${origin}/checkout/mock?order=${order.order_no}&key=${order.access_key}${en ? '&lang=en' : ''}`,
      })
    }

    // PayTR: ödeme oturumu (token) alınır, kullanıcı sitedeki ödeme sayfasına gider
    try {
      const token = await getPaytrToken({
        orderNo: order.order_no,
        total: cart.total,
        currency,
        email,
        userIp: ip,
        userName: fullName,
        userAddress: address ? [address.line, address.district, address.city, address.postalCode, address.country].filter(Boolean).join(', ') : '',
        userPhone: phone,
        okUrl: orderUrl,
        failUrl: `${origin}/cart?payment=error${en ? '&lang=en' : ''}`,
        lang,
        basket: [
          ...cart.lines.map((line): [string, number, number] => [
            `${line.name}${line.variantLabel ? ` (${line.variantLabel})` : ''}`,
            line.unitPrice,
            line.quantity,
          ]),
          ...(cart.shipping > 0 ? [[en ? 'Shipping' : 'Kargo', cart.shipping, 1] as [string, number, number]] : []),
        ],
      })
      await setOrderProviderRef(order.order_no, token)
      return NextResponse.json({
        orderNo: order.order_no,
        redirectUrl: `${origin}/checkout/paytr?order=${order.order_no}&key=${order.access_key}`,
      })
    } catch (error) {
      await markOrderFailed(order.order_no, `paytr init: ${error instanceof Error ? error.message : 'error'}`)
      console.error('[checkout paytr]', error)
      return bad(en ? 'Could not open the payment page. Please try again.' : 'Ödeme sayfası açılamadı. Lütfen tekrar dene.', 502)
    }
  } catch (err) {
    console.error('[checkout]', err)
    return bad('Sunucu hatası', 500)
  }
}
