import type { Metadata } from 'next'
import DarkShell from '@/components/DarkShell'

export const metadata: Metadata = {
  title: 'Internal Admin Paneli',
  robots: {
    index: false,
    follow: false,
  },
  // Telefonda ana ekrana eklenebilsin: iPhone'da anlık bildirim sadece ana ekrana eklenmiş uygulamada çalışır
  manifest: '/admin.webmanifest',
  appleWebApp: { capable: true, title: 'QRNot Yönetim', statusBarStyle: 'black' },
  icons: { apple: '/admin-icon-180.png' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DarkShell>{children}</DarkShell>
}
