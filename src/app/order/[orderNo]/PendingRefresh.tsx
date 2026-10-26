'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Kartla ödemede onay bildirimi birkaç saniye gecikebilir; o sürede sayfayı kendiliğinden yeniler.
export default function PendingRefresh() {
  const router = useRouter()
  useEffect(() => {
    let count = 0
    const timer = window.setInterval(() => {
      count += 1
      router.refresh()
      if (count >= 20) window.clearInterval(timer)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [router])
  return null
}
