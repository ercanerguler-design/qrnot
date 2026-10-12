'use client'

import type { CartLine, ProductId } from '@/lib/commerce/catalog'

const CART_KEY = 'qrnote_cart_v1'
const CART_EVENT = 'qrnote:cart'

export function readCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((line) => line && typeof line.productId === 'string') : []
  } catch {
    return []
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(lines))
  } catch {
    // depolama kapalıysa sepet sadece bu oturumda yaşar
  }
  window.dispatchEvent(new Event(CART_EVENT))
}

export function addToCart(productId: ProductId, variantId: string | null, quantity: number) {
  const lines = readCart()
  const existing = lines.find((line) => line.productId === productId && (line.variantId || null) === variantId)
  if (existing) {
    existing.quantity += quantity
  } else {
    lines.push({ productId, variantId, quantity })
  }
  writeCart(lines)
}

export function clearCart() {
  writeCart([])
}

export function subscribeCart(callback: () => void) {
  window.addEventListener(CART_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CART_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
}
