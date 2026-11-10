import { NextRequest, NextResponse, after } from 'next/server'
import { notifyAdmin } from '@/lib/adminNotify'
import { getAuthenticatedUser } from '@/lib/auth'
import { formatMoney } from '@/lib/commerce/catalog'
import { createOrder, markOrderFailed, setOrderProviderRef, type OrderAddress, type PaymentProvider } from '@/lib/commerce/orders'
import { getPaytrToken } from '@/lib/commerce/paytr'
import { availableProviders } from '@/lib/commerce/providers'
import { sql } from '@/lib/db'
import { createDppRequest, DealerError, getDealerForUser, listDealerDppRequests, listDealerOrders, type Dealer } from '@/lib/dealers'
import { DEALER_MIN_QTY, DPP_DEALER_PLANS, dppDealerEur, priceDealerCart } from '@/lib/dealersShared'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'

// Bayi paneli (/bayi): GET durum + siparişler; POST action=order (ürün siparişi) | action=dpp (DPP paket talebi)

export const dynamic = 'force-dynamic'

const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
const leadTarget = () => String(process.env.LEAD_NOTIFY_WHATSAPP || process.env.SHOP_NOTIFY_WHATSAPP || process.env.WHATSAPP_TO_NUMBER || '').trim() || undefined

function publicDealer(d: Dealer) {
  return {
    status: d.status,
    company: d.company,
    contactName: d.contact_name,
    email: d.email,
    phone: d.phone,
    city: d.city,
    district: d.district,
    address: d.address,
    discountPct: Number(d.discount_pct),
    dppDiscountPct: Number(d.dpp_discount_pct),
    createdAt: d.created_at,
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return json({ needLogin: true }, 401)
    const dealer = await getDealerForUser(user)
    if (!dealer) return json({ dealer: null, email: user.email })
    const approved = dealer.status === 'approved'
    const [orders, dpp] = approved ? await Promise.all([listDealerOrders(dealer.id), listDealerDppRequests(dealer.id)]) : [[], []]
    return json({
      email: user.email,
      dealer: publicDealer(dealer),
      providers: availableProviders('TRY'),
      dppPlans: DPP_DEALER_PLANS.map((p) => ({ ...p, dealerEur: dppDealerEur(p.eur, Number(dealer.dpp_discount_pct) / 100) })),
      orders,
      dppRequests: dpp,
    })
  } catch (err) {
    console.error('[dealer GET]', err)
    return json({ error: 'Sunucu hatası' }, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers)
    if (!(await consumeRateLimit(`dealer:${ip}`, 30, 3600))) return json({ error: 'Çok fazla deneme. Biraz sonra tekrar dene.' }, 429)
    const user = await getAuthenticatedUser(req)
    if (!user) return json({ error: 'Giriş yapmalısın.', needLogin: true }, 401)
    const dealer = await getDealerForUser(user)
    if (!dealer || dealer.status !== 'approved') return json({ error: 'Bayi hesabın onaylı değil.' }, 403)
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

    if (body.action === 'dpp') {
      const request = await createDppRequest(dealer, body)
      after(() =>
        notifyAdmin({
          title: `🛂 Bayi DPP talebi: ${dealer.company}`,
          body: `${request.customer_company} · ${request.plan} · €${request.dealer_eur}`,
          url: '/admin?tab=dealers',
          whatsappText: `🛂 Bayi DPP talebi\nBayi: ${dealer.company}\nMüşteri: ${request.customer_company} ${request.customer_contact} ${request.customer_phone} ${request.customer_email}\nPaket: ${request.plan} · bayi fiyatı €${request.dealer_eur} (liste €${request.list_eur}) · ödeme: ${request.payment_method === 'card' ? 'kart' : 'havale'}\nYönetim: https://www.qrnot.com/admin?tab=dealers`,
          whatsappTo: leadTarget(),
        }).catch((e) => console.error('[dealer dpp notify]', e))
      )
      return json({ ok: true, request })
    }

    if (body.action !== 'order') return json({ error: 'Geçersiz işlem' }, 400)

    const provider = String(body.provider || '') as PaymentProvider
    if (!availableProviders('TRY').includes(provider)) return json({ error: 'Bu ödeme yöntemi şu an kullanılamıyor.' }, 400)
    const cart = priceDealerCart(Array.isArray(body.lines) ? body.lines : [], Number(dealer.discount_pct) / 100)
    if (cart.totalQty < DEALER_MIN_QTY) return json({ error: `Bayi siparişi en az ${DEALER_MIN_QTY} adet olmalı (şu an ${cart.totalQty}).` }, 400)
    if (body.terms !== true) return json({ error: 'Bayilik satış şartlarını onaylamalısın.' }, 400)

    const raw = (body.address || {}) as Record<string, unknown>
    const s = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
    let address: OrderAddress | null = null
    if (cart.hasPhysical) {
      address = { line: s(raw.line, 300), district: s(raw.district, 80), city: s(raw.city, 80), postalCode: s(raw.postalCode, 16), country: 'Türkiye' }
      if (address.line.length < 8 || !address.city) return json({ error: 'Teslimat adresini eksiksiz yaz.' }, 400)
    }
    const phone = s(body.phone, 40) || dealer.phone

    const order = await createOrder({
      provider,
      currency: 'TRY',
      subtotal: cart.subtotal,
      shipping: 0,
      total: cart.subtotal,
      lang: 'tr',
      userId: user.id,
      email: user.email,
      fullName: `${dealer.contact_name} (${dealer.company})`.slice(0, 160),
      phone,
      address,
      items: cart.lines,
      consents: {
        terms: true,
        dealerTerms: true,
        acceptedAt: new Date().toISOString(),
        ip,
        userAgent: String(req.headers.get('user-agent') || '').slice(0, 300),
        dealer: { id: dealer.id, company: dealer.company, taxOffice: dealer.tax_office, taxNo: dealer.tax_no, discountPct: Number(dealer.discount_pct) },
      },
      customerNote: s(body.note, 500),
      clientIp: ip,
    })
    await sql`UPDATE shop_orders SET dealer_id = ${dealer.id} WHERE id = ${order.id}`

    const origin = req.nextUrl.origin
    const orderUrl = `${origin}/order/${order.order_no}?key=${order.access_key}`
    const summary = cart.lines.map((l) => `${l.quantity}× ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ''}`).join(', ')

    if (provider === 'transfer') {
      after(() =>
        notifyAdmin({
          title: `🤝 Bayi siparişi (havale bekleniyor): ${formatMoney(order.total, 'TRY')}`,
          body: `${dealer.company} · ${order.order_no}\n${summary}`,
          url: '/admin?tab=orders&status=awaiting_transfer',
          whatsappText: `🤝 Yeni bayi siparişi — havale bekleniyor\n${order.order_no} · ${formatMoney(order.total, 'TRY')}\nBayi: ${dealer.company} (${dealer.contact_name} · ${phone})\n${summary}\nHavale gelince: https://www.qrnot.com/admin?tab=orders`,
          whatsappTo: leadTarget(),
        }).catch((e) => console.error('[dealer order notify]', e))
      )
      return json({ orderNo: order.order_no, redirectUrl: orderUrl })
    }
    if (provider === 'mock') {
      return json({ orderNo: order.order_no, redirectUrl: `${origin}/checkout/mock?order=${order.order_no}&key=${order.access_key}` })
    }

    try {
      const token = await getPaytrToken({
        orderNo: order.order_no,
        total: order.total,
        currency: 'TRY',
        email: user.email,
        userIp: ip,
        userName: dealer.contact_name,
        userAddress: address ? [address.line, address.district, address.city, address.postalCode, address.country].filter(Boolean).join(', ') : dealer.address,
        userPhone: phone,
        okUrl: orderUrl,
        failUrl: `${origin}/bayi?payment=error`,
        lang: 'tr',
        basket: cart.lines.map((l): [string, number, number] => [`${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ''} · bayi`, l.unitPrice, l.quantity]),
      })
      await setOrderProviderRef(order.order_no, token)
      return json({ orderNo: order.order_no, redirectUrl: `${origin}/checkout/paytr?order=${order.order_no}&key=${order.access_key}` })
    } catch (error) {
      await markOrderFailed(order.order_no, `paytr init: ${error instanceof Error ? error.message : 'error'}`)
      console.error('[dealer paytr]', error)
      return json({ error: 'Ödeme sayfası açılamadı. Lütfen tekrar dene ya da havale seç.' }, 502)
    }
  } catch (err) {
    if (err instanceof DealerError) return json({ error: err.message }, 400)
    console.error('[dealer POST]', err)
    return json({ error: 'Sunucu hatası' }, 500)
  }
}
