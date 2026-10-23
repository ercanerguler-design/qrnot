import type { Metadata } from 'next'
import DarkShell from '@/components/DarkShell'

export const metadata: Metadata = {
  // Kurumsal müşteri yönetim paneli (giriş ekranı): arama sonuçlarına girmez
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DarkShell>{children}</DarkShell>
}
