import type { OrderAddress } from '@/lib/commerce/orders'
import type { StripeSession } from '@/lib/commerce/stripe'

/** Stripe Checkout'ta toplanan teslimat adresini sipariş adres biçimine çevirir. */
export function stripeAddressOf(session: StripeSession): OrderAddress | null {
  const details = session.collected_information?.shipping_details || session.shipping_details
  const a = details?.address
  if (!a) return null
  return {
    line: [a.line1, a.line2].filter(Boolean).join(' '),
    district: a.state || '',
    city: a.city || '',
    postalCode: a.postal_code || '',
    country: a.country || '',
  }
}
