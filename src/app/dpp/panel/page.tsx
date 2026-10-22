import type { Metadata } from 'next'
import PanelApp from './PanelApp'

export const metadata: Metadata = {
  title: 'DPP Paneli',
  robots: { index: false, follow: false },
}

export default function DppPanelPage() {
  return <PanelApp />
}
