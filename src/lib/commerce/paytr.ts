import { createHmac, timingSafeEqual } from 'crypto'
import type { Currency } from '@/lib/commerce/catalog'

// PayTR iFrame API: ödeme sayfası sitenin içinde çerçeve olarak açılır, sonuç sunucuya bildirim (callback) ile gelir.
// Ortam değişkenleri:
//   PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT  (PayTR Mağaza Paneli → Bilgi sayfası)
//   PAYTR_TEST_MODE=1   test ödemesi (canlıya geçince 0 yap ya da sil)
//   PAYTR_USD=1         İngilizce sepette USD ile ödeme (PayTR hesabında döviz açıksa)
// PayTR panelinde Bildirim URL: https://www.qrnot.com/api/payments/paytr/callback

const API_URL = 'https://www.paytr.com/odeme/api/get-token'
export const PAYTR_IFRAME_URL = 'https://www.paytr.com/odeme/guvenli/'

function creds() {
  return {
    id: String(process.env.PAYTR_MERCHANT_ID || '').trim(),
    key: String(process.env.PAYTR_MERCHANT_KEY || '').trim(),
    salt: String(process.env.PAYTR_MERCHANT_SALT || '').trim(),
  }
}

export function paytrConfigured(currency: Currency = 'TRY') {
  const { id, key, salt } = creds()
  if (!id || !key || !salt) return false
  return currency === 'TRY' || process.env.PAYTR_USD === '1'
}

function sign(data: string, key: string) {
  return createHmac('sha256', key).update(data).digest('base64')
}

/** 44900 kuruş → "449.00" */
function toPrice(amount: number) {
  return (amount / 100).toFixed(2)
}

export interface PaytrTokenInput {
  orderNo: string
  /** kuruş / cent */
  total: number
  currency: Currency
  email: string
  userIp: string
  userName: string
  userAddress: string
  userPhone: string
  okUrl: string
  failUrl: string
  lang: 'tr' | 'en'
  /** [ad, birim fiyat (kuruş), adet] */
  basket: Array<[string, number, number]>
}

export async function getPaytrToken(input: PaytrTokenInput) {
  const { id, key, salt } = creds()
  if (!id || !key || !salt) throw new Error('PayTR yapılandırılmamış')

  const userBasket = Buffer.from(JSON.stringify(input.basket.map(([name, price, qty]) => [name.slice(0, 120), toPrice(price), qty]))).toString('base64')
  const paymentAmount = String(input.total)
  const currency = input.currency === 'TRY' ? 'TL' : input.currency
  const testMode = process.env.PAYTR_TEST_MODE === '1' ? '1' : '0'
  const noInstallment = input.currency === 'TRY' ? '0' : '1'
  const maxInstallment = '0' // 0 = PayTR'ın izin verdiği en yüksek taksit

  const hashStr = id + input.userIp + input.orderNo + input.email + paymentAmount + userBasket + noInstallment + maxInstallment + currency + testMode
  const token = sign(hashStr + salt, key)

  const form = new URLSearchParams({
    merchant_id: id,
    user_ip: input.userIp,
    merchant_oid: input.orderNo,
    email: input.email,
    payment_amount: paymentAmount,
    paytr_token: token,
    user_basket: userBasket,
    debug_on: testMode,
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: input.userName.slice(0, 60),
    user_address: input.userAddress.slice(0, 400) || 'Dijital teslimat',
    user_phone: input.userPhone.slice(0, 20) || '0000000000',
    merchant_ok_url: input.okUrl,
    merchant_fail_url: input.failUrl,
    timeout_limit: '30',
    currency,
    test_mode: testMode,
    lang: input.lang,
  })

  const res = await fetch(API_URL, { method: 'POST', body: form, cache: 'no-store' })
  const data = (await res.json().catch(() => ({}))) as { status?: string; token?: string; reason?: string }
  if (data.status !== 'success' || !data.token) throw new Error(`PayTR: ${data.reason || 'ödeme sayfası açılamadı'}`)
  return data.token
}

export interface PaytrCallback {
  merchantOid: string
  status: string
  totalAmount: string
  paymentAmount: number
  currency: string
  failedReason: string
  testMode: boolean
}

/** PayTR bildirimini doğrular; imza tutmazsa null döner. */
export function verifyPaytrCallback(form: FormData): PaytrCallback | null {
  const { key, salt } = creds()
  if (!key || !salt) return null
  const merchantOid = String(form.get('merchant_oid') || '')
  const status = String(form.get('status') || '')
  const totalAmount = String(form.get('total_amount') || '')
  const hash = String(form.get('hash') || '')

  const expected = Buffer.from(sign(merchantOid + salt + status + totalAmount, key))
  const given = Buffer.from(hash)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null

  return {
    merchantOid,
    status,
    totalAmount,
    paymentAmount: Number(form.get('payment_amount') || 0),
    currency: String(form.get('currency') || ''),
    failedReason: `${form.get('failed_reason_code') || ''} ${form.get('failed_reason_msg') || ''}`.trim(),
    testMode: String(form.get('test_mode') || '') === '1',
  }
}
