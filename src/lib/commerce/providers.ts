import type { Currency } from '@/lib/commerce/catalog'
import type { PaymentProvider } from '@/lib/commerce/orders'
import { paytrConfigured } from '@/lib/commerce/paytr'

// Para birimine göre kullanılabilir ödeme yöntemleri: kart için PayTR, TL'de ayrıca havale/EFT.
// PAYMENT_MOCK=1 → sadece canlı olmayan ortamda "test ödemesi" seçeneği açılır.

export function mockPaymentsAllowed() {
  return process.env.PAYMENT_MOCK === '1' && process.env.VERCEL_ENV !== 'production'
}

export function availableProviders(currency: Currency): PaymentProvider[] {
  const list: PaymentProvider[] = []
  if (paytrConfigured(currency)) list.push('paytr')
  if (currency === 'TRY') list.push('transfer')
  if (mockPaymentsAllowed()) list.push('mock')
  return list
}
