import { createHmac, randomBytes } from 'crypto'

// iyzico Checkout Form (ortak ödeme sayfası) — resmi REST API, IYZWSv2 HMAC imzası.
// Ortam değişkenleri:
//   IYZICO_API_KEY, IYZICO_SECRET_KEY
//   IYZICO_BASE_URL  (test: https://sandbox-api.iyzipay.com  canlı: https://api.iyzipay.com)

export function iyzicoConfigured() {
  return Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY)
}

function baseUrl() {
  return String(process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').replace(/\/$/, '')
}

async function iyzicoRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const apiKey = String(process.env.IYZICO_API_KEY || '').trim()
  const secretKey = String(process.env.IYZICO_SECRET_KEY || '').trim()
  if (!apiKey || !secretKey) throw new Error('iyzico yapılandırılmamış')

  const payload = JSON.stringify(body)
  const randomKey = `${Date.now()}${randomBytes(6).toString('hex')}`
  const signature = createHmac('sha256', secretKey)
    .update(randomKey + path + payload)
    .digest('hex')
  const authorization = Buffer.from(`apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`).toString('base64')

  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `IYZWSv2 ${authorization}`,
      'x-iyzi-rnd': randomKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: payload,
    cache: 'no-store',
  })

  const data = (await res.json().catch(() => ({}))) as T
  return data
}

/** 44900 kuruş → "449.00" */
export function toIyzicoPrice(amount: number) {
  return (amount / 100).toFixed(2)
}

export interface IyzicoBasketItem {
  id: string
  name: string
  category1: string
  itemType: 'PHYSICAL' | 'VIRTUAL'
  price: string
}

export interface IyzicoInitInput {
  orderNo: string
  total: number
  callbackUrl: string
  locale: 'tr' | 'en'
  buyer: {
    id: string
    name: string
    surname: string
    email: string
    gsmNumber: string
    identityNumber: string
    ip: string
    address: string
    city: string
    country: string
    zipCode?: string
  }
  shipping: { contactName: string; address: string; city: string; country: string; zipCode?: string } | null
  items: IyzicoBasketItem[]
}

interface IyzicoInitResponse {
  status: 'success' | 'failure'
  errorCode?: string
  errorMessage?: string
  token?: string
  paymentPageUrl?: string
  checkoutFormContent?: string
}

export async function initIyzicoCheckout(input: IyzicoInitInput) {
  const price = toIyzicoPrice(input.total)
  const billing = {
    contactName: `${input.buyer.name} ${input.buyer.surname}`.trim(),
    city: input.buyer.city,
    country: input.buyer.country,
    address: input.buyer.address,
    zipCode: input.buyer.zipCode || undefined,
  }

  const body: Record<string, unknown> = {
    locale: input.locale,
    conversationId: input.orderNo,
    price,
    paidPrice: price,
    currency: 'TRY',
    basketId: input.orderNo,
    paymentGroup: 'PRODUCT',
    callbackUrl: input.callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: input.buyer.id,
      name: input.buyer.name,
      surname: input.buyer.surname,
      gsmNumber: input.buyer.gsmNumber,
      email: input.buyer.email,
      identityNumber: input.buyer.identityNumber,
      registrationAddress: input.buyer.address,
      ip: input.buyer.ip,
      city: input.buyer.city,
      country: input.buyer.country,
      zipCode: input.buyer.zipCode || undefined,
    },
    billingAddress: billing,
    shippingAddress: input.shipping || billing,
    basketItems: input.items,
  }

  const result = await iyzicoRequest<IyzicoInitResponse>('/payment/iyzipos/checkoutform/initialize/auth/ecom', body)
  if (result.status !== 'success' || !result.paymentPageUrl || !result.token) {
    throw new Error(result.errorMessage || 'iyzico ödeme sayfası açılamadı')
  }
  return { token: result.token, paymentPageUrl: result.paymentPageUrl }
}

export interface IyzicoRetrieveResponse {
  status: 'success' | 'failure'
  errorMessage?: string
  paymentStatus?: 'SUCCESS' | 'FAILURE' | 'INIT_THREEDS' | 'CALLBACK_THREEDS' | string
  paymentId?: string
  basketId?: string
  paidPrice?: number
  price?: number
  currency?: string
  fraudStatus?: number
}

export async function retrieveIyzicoCheckout(token: string, orderNo: string) {
  return iyzicoRequest<IyzicoRetrieveResponse>('/payment/iyzipos/checkoutform/auth/ecom/detail', {
    locale: 'tr',
    conversationId: orderNo,
    token,
  })
}
