'use client'

import { useRouter } from 'next/navigation'

interface BackToPreviousProps {
  fallbackHref?: string
  label?: string
  className?: string
}

export default function BackToPrevious({
  fallbackHref = '/',
  label = 'Bir onceki sayfaya don',
  className = '',
}: BackToPreviousProps) {
  const router = useRouter()

  const getSafeReferrerPath = () => {
    if (typeof window === 'undefined') return null
    if (!document.referrer) return null

    try {
      const current = new URL(window.location.href)
      const ref = new URL(document.referrer)

      if (current.origin !== ref.origin) return null

      const refPath = `${ref.pathname}${ref.search}${ref.hash}`
      const currentPath = `${current.pathname}${current.search}${current.hash}`

      if (refPath === currentPath) return null
      if (ref.pathname.startsWith('/api/')) return null

      return refPath
    } catch {
      return null
    }
  }

  const handleBack = () => {
    const referrerPath = getSafeReferrerPath()
    if (referrerPath) {
      router.push(referrerPath)
      return
    }

    router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/60 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition ${className}`.trim()}
      aria-label={label}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  )
}
