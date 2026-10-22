import type { Metadata } from 'next'
import { loadSupplierForm } from '@/lib/dpp/suppliers'
import SupplierForm from './SupplierForm'

// Tedarikçi bilgi formu: firma panelinden oluşturulan, tahmin edilemez token'lı link. Giriş gerekmez; arama motorlarına kapalı.

type Props = { params: Promise<{ token: string }> }

export const metadata: Metadata = {
  title: 'Tedarikçi bilgi formu · Supplier data form',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function SupplierPage({ params }: Props) {
  const { token } = await params
  const form = await loadSupplierForm(token)
  return <SupplierForm token={token} initial={form} />
}
