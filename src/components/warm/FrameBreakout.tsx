'use client'

import { useEffect } from 'react'

// PayTR ödeme bitince dönüş sayfasını kendi çerçevesinin içinde açar; sayfayı tam ekrana taşır.
export default function FrameBreakout() {
  useEffect(() => {
    try {
      if (window.top && window.top !== window.self) window.top.location.href = window.location.href
    } catch {
      // erişilemeyen üst pencere: olduğu gibi kalsın
    }
  }, [])
  return null
}
