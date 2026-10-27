'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CONSENT_EVENT, isPrivatePath, OPEN_CONSENT_EVENT, pixelTrack, readConsent, saveConsent } from '@/lib/metaPixel'

// Çerez onay şeridi + Meta Pixel sayfa görüntülemesi.
// Seçim yapılmadıysa şerit görünür; "Kabul et" denirse Pixel yüklenir. Çerez Politikası sayfasındaki buton şeridi tekrar açar.

const T = {
  tr: {
    text: 'Reklamlarımızın etkisini ölçmek için, onay verirsen Meta (Facebook / Instagram) çerezlerini kullanırız. Sitenin çalışması için gereken çerezler her zaman açıktır.',
    more: 'Çerez Politikası',
    accept: 'Kabul et',
    reject: 'Sadece gerekli',
  },
  en: {
    text: 'With your consent, we use Meta (Facebook / Instagram) cookies to measure how our ads perform. Cookies needed for the site to work are always on.',
    more: 'Cookie Policy',
    accept: 'Accept',
    reject: 'Necessary only',
  },
}

function currentLang() {
  if (new URLSearchParams(window.location.search).get('lang') === 'en') return 'en'
  return /(?:^|; )qrnote_lang=en/.test(document.cookie) ? 'en' : 'tr'
}

export default function MetaPixel() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<'tr' | 'en'>('tr')

  useEffect(() => {
    const show = () => {
      setLang(currentLang())
      setOpen(true)
    }
    if (readConsent() === null && !isPrivatePath(window.location.pathname)) show()
    window.addEventListener(OPEN_CONSENT_EVENT, show)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, show)
  }, [])

  useEffect(() => {
    pixelTrack('PageView')
  }, [pathname])

  useEffect(() => {
    const onConsent = (e: Event) => {
      if ((e as CustomEvent).detail === 'all') pixelTrack('PageView')
    }
    window.addEventListener(CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_EVENT, onConsent)
  }, [])

  if (!open) return null
  const t = T[lang]
  const choose = (value: 'all' | 'essential') => {
    saveConsent(value)
    setOpen(false)
  }

  return (
    <div role="dialog" aria-live="polite" aria-label={t.more} className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 text-sm text-neutral-800 shadow-xl sm:flex-row sm:items-center">
        <p className="flex-1 leading-relaxed">
          {t.text}{' '}
          <a href={lang === 'en' ? '/legal/cookies' : '/legal/cerez'} className="underline">
            {t.more}
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose('essential')} className="rounded-full border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-100">
            {t.reject}
          </button>
          <button type="button" onClick={() => choose('all')} className="rounded-full bg-neutral-900 px-4 py-2 font-semibold text-white hover:bg-neutral-700">
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
