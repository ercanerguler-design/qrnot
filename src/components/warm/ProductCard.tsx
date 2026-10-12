import Link from 'next/link'
import ProductArt from '@/components/warm/ProductArt'
import { currencyForLang, formatMoney, type Product } from '@/lib/commerce/catalog'
import { withLang, type Lang } from '@/lib/i18n'

export default function ProductCard({ product, lang }: { product: Product; lang: Lang }) {
  const currency = currencyForLang(lang)
  const compareAt = product.compareAt?.[currency]
  return (
    <Link
      href={withLang(`/shop/${product.id}`, lang)}
      className="group w-card flex flex-col overflow-hidden transition-shadow hover:shadow-[0_20px_40px_-20px_rgba(31,36,64,0.3)]"
    >
      <div className="relative">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name[lang]} className="aspect-square w-full object-cover" />
        ) : (
          <ProductArt
            kind={product.kind}
            nfc={product.nfc}
            variant={product.variants?.[0]?.id}
            className="aspect-square w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        {product.badge && <span className="w-chip absolute left-3 top-3 bg-paper/95 shadow-sm">{product.badge[lang]}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold text-ink">{product.name[lang]}</h3>
        <p className="flex-1 text-sm text-ink-2">{product.tagline[lang]}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-ink">{formatMoney(product.price[currency], currency)}</span>
          {compareAt && compareAt > product.price[currency] && <span className="text-sm text-muted line-through">{formatMoney(compareAt, currency)}</span>}
        </div>
      </div>
    </Link>
  )
}
