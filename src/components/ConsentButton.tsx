'use client'

import { OPEN_CONSENT_EVENT } from '@/lib/metaPixel'

export default function ConsentButton({ lang }: { lang: 'tr' | 'en' }) {
  return (
    <button type="button" className="w-btn w-btn-ghost mt-4" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      {lang === 'en' ? 'Change cookie preferences' : 'Çerez tercihlerimi değiştir'}
    </button>
  )
}
