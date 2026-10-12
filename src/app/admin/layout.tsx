import type { Metadata } from 'next'
import DarkShell from '@/components/DarkShell'

export const metadata: Metadata = {
  title: 'Internal Admin Paneli',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DarkShell>{children}</DarkShell>
}
