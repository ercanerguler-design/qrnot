import type { Currency } from '@/lib/commerce/catalog'
import { iyzicoConfigured } from '@/lib/commerce/iyzico'
import type { PaymentProvider } from '@/lib/commerce/orders'
import { stripeConfigured } from '@/lib/commerce/stripe'

// Para birimine göre kullanılabilir ödeme yöntemleri.
// PAYMENT_MOCK=1 → sadece canlı olmayan ortamda "test ödemesi" seçeneği açılır.

export function mockPaymentsAllowed() {
  return process.env.PAYMENT_MOCK === '1' && process.env.VERCEL_ENV !== 'production'
}

export function availableProviders(currency: Currency): PaymentProvider[] {
  const list: PaymentProvider[] = []
  if (currency === 'TRY') {
    if (iyzicoConfigured()) list.push('iyzico')
    list.push('transfer')
  } else if (stripeConfigured()) {
    list.push('stripe')
  }
  if (mockPaymentsAllowed()) list.push('mock')
  return list
}
