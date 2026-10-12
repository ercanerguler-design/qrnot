'use client'

import { useEffect } from 'react'
import { clearCart } from '@/lib/commerce/cartClient'

export default function ClearCartOnSuccess() {
  useEffect(() => {
    clearCart()
  }, [])
  return null
}
