import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { priceCart, type CartLine, type Currency } from '@/lib/commerce/catalog'
import { initIyzicoCheckout, toIyzicoPrice } from '@/lib/commerce/iyzico'
import { createOrder, markOrderFailed, setOrderProviderRef, type OrderAddress, type PaymentProvider } from '@/lib/commerce/orders'
import { createStripeCheckout } from '@/lib/commerce/stripe'
import { availableProviders } from '@/lib/commerce/providers'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { normalizeLang } from '@/lib/i18n'

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
    if (cart.requiresAccount && !user) {
      return bad(en ? 'Please sign in: digital products are added to your account.' : 'Dijital ürünler hesabına tanımlanacağı için giriş yapmalısın.', 401, {
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
    const identityNumber = String(customer.identityNumber || '')
      .replace(/\D/g, '')
      .slice(0, 11)

    if (fullName.split(/\s+/).length < 2) return bad(en ? 'Please enter your full name.' : 'Ad ve soyadını yaz.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(en ? 'Please enter a valid email.' : 'Geçerli bir e-posta yaz.')
    if (currency === 'TRY' && phone.replace(/\D/g, '').length < 10) return bad('Geçerli bir telefon numarası yaz.')

    const rawAddress = body.address || {}
    let address: OrderAddress | null = null
    // Stripe'ta teslimat adresi Stripe sayfasında toplanır
    if (cart.hasPhysical && provider !== 'stripe') {
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
      if (address.line.length < 8 || !address.city) return bad(en ? 'Please enter your delivery address.' : 'Teslimat adresini eksiksiz yaz.')
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

    if (provider === 'iyzico') {
      const [name, ...rest] = fullName.split(/\s+/)
      const city = address?.city || String(rawAddress.city || 'Istanbul')
      try {
        const session = await initIyzicoCheckout({
          orderNo: order.order_no,
          total: cart.total,
          callbackUrl: `${origin}/api/payments/iyzico/callback?order=${order.order_no}`,
          locale: lang,
          buyer: {
            id: user?.id || `guest-${order.order_no}`,
            name,
            surname: rest.join(' ') || name,
            email,
            gsmNumber: phone,
            identityNumber: identityNumber.length === 11 ? identityNumber : '11111111111',
            ip,
            address: address ? `${address.line} ${address.district}`.trim() : 'Dijital teslimat',
            city,
            country: address?.country || 'Turkey',
            zipCode: address?.postalCode || undefined,
          },
          shipping: address
            ? {
                contactName: fullName,
                address: `${address.line} ${address.district}`.trim(),
                city: address.city,
                country: address.country,
                zipCode: address.postalCode || undefined,
              }
            : null,
          items: [
            ...cart.lines.map((line, index) => ({
              id: `${line.productId}-${index}`,
              name: `${line.quantity}x ${line.name}${line.variantLabel ? ` (${line.variantLabel})` : ''}`.slice(0, 100),
              category1: line.physical ? 'Takı ve Aksesuar' : 'Dijital Hizmet',
              itemType: (line.physical ? 'PHYSICAL' : 'VIRTUAL') as 'PHYSICAL' | 'VIRTUAL',
              price: toIyzicoPrice(line.lineTotal),
            })),
            ...(cart.shipping > 0
              ? [{ id: 'shipping', name: 'Kargo', category1: 'Kargo', itemType: 'VIRTUAL' as const, price: toIyzicoPrice(cart.shipping) }]
              : []),
          ],
        })
        await setOrderProviderRef(order.order_no, session.token)
        return NextResponse.json({ orderNo: order.order_no, redirectUrl: session.paymentPageUrl })
      } catch (error) {
        await markOrderFailed(order.order_no, `iyzico init: ${error instanceof Error ? error.message : 'error'}`)
        return bad(error instanceof Error ? error.message : 'iyzico hatası', 502)
      }
    }

    // Stripe
    try {
      const session = await createStripeCheckout({
        orderNo: order.order_no,
        email,
        lines: cart.lines.map((line) => ({
          name: `${line.name}${line.variantLabel ? ` (${line.variantLabel})` : ''}`,
          unitAmount: line.unitPrice,
          quantity: line.quantity,
        })),
        shipping: cart.shipping,
        collectShipping: cart.hasPhysical,
        successUrl: `${origin}/api/payments/stripe/return?order=${order.order_no}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/cart${en ? '?lang=en' : ''}`,
        locale: lang,
      })
      await setOrderProviderRef(order.order_no, session.id)
      return NextResponse.json({ orderNo: order.order_no, redirectUrl: session.url })
    } catch (error) {
      await markOrderFailed(order.order_no, `stripe init: ${error instanceof Error ? error.message : 'error'}`)
      return bad(error instanceof Error ? error.message : 'Stripe error', 502)
    }
  } catch (err) {
    console.error('[checkout]', err)
    return bad('Sunucu hatası', 500)
  }
}
