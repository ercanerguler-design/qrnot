import { redirect } from 'next/navigation'

// Mağaza yönetimi tek admin konsoluna taşındı; eski yer imleri çalışmaya devam etsin.
export default function AdminShopRedirect() {
  redirect('/admin?tab=orders')
}
