'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductArt from '@/components/warm/ProductArt'
import { addToCart } from '@/lib/commerce/cartClient'
import { currencyForLang } from '@/lib/commerce/catalog'
import { pixelTrack } from '@/lib/metaPixel'
import type { Product } from '@/lib/commerce/catalog'
import type { Lang } from '@/lib/i18n'

const T = {
  tr: { color: 'Renk', qty: 'Adet', add: 'Sepete ekle', buyNow: 'Hemen satın al', added: 'Sepete eklendi ✓', goCart: 'Sepete git' },
  en: { color: 'Finish', qty: 'Quantity', add: 'Add to cart', buyNow: 'Buy now', added: 'Added to cart ✓', goCart: 'Go to cart' },
}

export function ProductGallery({ product, lang, variantId }: { product: Product; lang: Lang; variantId?: string }) {
  if (product.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.image} alt={product.name[lang]} className="w-card aspect-square w-full object-cover" />
  }
  return <ProductArt kind={product.kind} nfc={product.nfc} variant={variantId || product.variants?.[0]?.id} className="w-card aspect-square w-full" />
}

export default function ProductBuyBox({ product, lang, header, footer }: { product: Product; lang: Lang; header: React.ReactNode; footer: React.ReactNode }) {
  const t = T[lang]
  const router = useRouter()
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const cartHref = lang === 'en' ? '/cart?lang=en' : '/cart'

  const add = (thenGo: boolean) => {
    addToCart(product.id, variantId, quantity)
    const currency = currencyForLang(lang)
    pixelTrack('AddToCart', { content_ids: [product.id], content_type: 'product', value: (product.price[currency] * quantity) / 100, currency })
    if (thenGo) {
      router.push(cartHref)
      return
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-2">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <ProductGallery product={product} lang={lang} variantId={variantId || undefined} />
      </div>
      <div className="space-y-6">
        {header}
        <div className="space-y-5">
          {product.variants && product.variants.length > 0 && (
            <div>
              <p className="w-label">
                {t.color}: <span className="font-normal text-ink">{product.variants.find((v) => v.id === variantId)?.label[lang]}</span>
              </p>
              <div className="flex gap-3">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setVariantId(variant.id)}
                    aria-pressed={variantId === variant.id}
                    aria-label={variant.label[lang]}
                    className={`h-11 w-11 rounded-full border-2 transition-transform ${variantId === variant.id ? 'scale-110 border-ink' : 'border-line-2 hover:border-ink-2'}`}
                    style={{ background: variant.swatch }}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="w-label">{t.qty}</p>
            <div className="inline-flex items-center rounded-xl border border-line-2 bg-paper">
              <button
                type="button"
                className="px-4 py-2.5 text-lg text-ink-2 hover:text-ink"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="-"
              >
                −
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                className="px-4 py-2.5 text-lg text-ink-2 hover:text-ink"
                onClick={() => setQuantity((q) => Math.min(product.maxQuantity, q + 1))}
                aria-label="+"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => add(true)} className="w-btn w-btn-primary py-4 text-base">
              {t.buyNow}
            </button>
            <button type="button" onClick={() => add(false)} className="w-btn w-btn-ghost py-4 text-base">
              {added ? t.added : t.add}
            </button>
          </div>
          {added && (
            <a href={cartHref} className="w-link text-sm">
              {t.goCart} →
            </a>
          )}
        </div>
        {footer}
      </div>
    </div>
  )
}
