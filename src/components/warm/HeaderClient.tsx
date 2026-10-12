'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cartCount, readCart, subscribeCart } from '@/lib/commerce/cartClient'
import { LANG_COOKIE, type Lang } from '@/lib/i18n'

let cachedCount = 0
function getCountSnapshot() {
  const next = cartCount(readCart())
  cachedCount = next
  return cachedCount
}

export function CartButton({ lang }: { lang: Lang }) {
  const count = useSyncExternalStore(subscribeCart, getCountSnapshot, () => 0)

  return (
    <Link
      href={lang === 'en' ? '/cart?lang=en' : '/cart'}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-2 bg-paper text-ink hover:border-ink-2"
      aria-label={lang === 'en' ? 'Cart' : 'Sepet'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 7h12l-1 13H7L6 7z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral px-1.5 text-center text-[11px] font-bold leading-5 text-white">
          {count}
        </span>
      )}
    </Link>
  )
}

export function LangSwitch({ lang }: { lang: Lang }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const switchTo = (next: Lang) => {
    if (next === lang) return
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'en') params.set('lang', 'en')
    else params.delete('lang')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
    router.refresh()
  }

  return (
    <div className="inline-flex rounded-full border border-line-2 bg-paper p-0.5 text-xs font-semibold" role="group" aria-label="Language">
      {(['tr', 'en'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => switchTo(item)}
          aria-pressed={lang === item}
          className={`rounded-full px-2.5 py-1 uppercase ${lang === item ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink'}`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}
