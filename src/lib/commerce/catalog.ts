import type { Lang } from '@/lib/i18n'

// ─────────────────────────────────────────────────────────────
// ÜRÜN KATALOĞU — fiyatları ve metinleri buradan güncelle.
// Fiyatlar kuruş/cent cinsindendir (44900 = 449,00 TL).
// Sunucu ödeme tutarını HER ZAMAN buradan hesaplar; tarayıcıdan gelen fiyata güvenilmez.
// ─────────────────────────────────────────────────────────────

export type ProductId =
  | 'kolye-qr'
  | 'kolye-nfc'
  | 'anahtarlik-qr'
  | 'anahtarlik-nfc'
  | 'dijital-qr'
  | 'ani-defteri'

export type ProductKind = 'necklace' | 'keychain' | 'digital' | 'guestbook'
export type Currency = 'TRY' | 'USD'

export interface ProductVariant {
  id: string
  label: Record<Lang, string>
  swatch?: string
}

export interface Product {
  id: ProductId
  kind: ProductKind
  physical: boolean
  nfc: boolean
  /** Dijital ürünlerde ödeme sonrası hesaba tanımlanır; giriş gerektirir. */
  requiresAccount: boolean
  price: Record<Currency, number>
  compareAt?: Partial<Record<Currency, number>>
  name: Record<Lang, string>
  tagline: Record<Lang, string>
  description: Record<Lang, string>
  features: Record<Lang, string[]>
  variants?: ProductVariant[]
  badge?: Record<Lang, string>
  /** public/ altındaki gerçek ürün fotoğrafı; yoksa çizim gösterilir */
  image?: string
  maxQuantity: number
}

// Pleksi gövde + neon renkli damla (epoksi) baskı — renkleri gerçek stoğa göre düzenle.
const NEON_VARIANTS: ProductVariant[] = [
  { id: 'neon-pink', label: { tr: 'Neon Pembe', en: 'Neon Pink' }, swatch: '#ff3fa4' },
  { id: 'neon-green', label: { tr: 'Neon Yeşil', en: 'Neon Green' }, swatch: '#39e75f' },
  { id: 'neon-orange', label: { tr: 'Neon Turuncu', en: 'Neon Orange' }, swatch: '#ff7a1a' },
  { id: 'neon-blue', label: { tr: 'Neon Mavi', en: 'Neon Blue' }, swatch: '#2fb8ff' },
  { id: 'neon-yellow', label: { tr: 'Neon Sarı', en: 'Neon Yellow' }, swatch: '#f4e21c' },
]

export const PRODUCTS: Product[] = [
  {
    id: 'kolye-qr',
    kind: 'necklace',
    physical: true,
    nfc: false,
    requiresAccount: true,
    price: { TRY: 44900, USD: 2400 },
    compareAt: { TRY: 59900 },
    name: { tr: 'Sesli Anı Kolyesi', en: 'Voice Memory Necklace' },
    tagline: {
      tr: 'Arkasındaki QR okutulunca senin sesin çalar.',
      en: 'Scan the QR on the back and hear your voice.',
    },
    description: {
      tr: 'Pleksi kolye ucu, neon renkli damla (epoksi) baskı ile parlak ve kabarık bir yüzeye sahiptir; üzerinde sana özel QR kod bulunur. Telefonla okutan kişi senin ses kaydını, videonu ya da fotoğraflarını uygulama indirmeden açar. İçeriği istediğin zaman değiştirebilirsin.',
      en: 'An acrylic (plexiglass) pendant with a glossy neon dome-print finish and your own QR code. Whoever scans it hears your voice message, watches your video or sees your photos — no app needed. Change the content any time.',
    },
    features: {
      tr: ['Hafif pleksi gövde', 'Neon renkli parlak damla baskı', 'Sana özel QR kod', 'Ses, video, fotoğraf ve link', 'İçeriği istediğin zaman güncelle'],
      en: ['Lightweight acrylic body', 'Glossy neon dome print', 'Your own unique QR code', 'Voice, video, photo & links', 'Update content any time'],
    },
    variants: NEON_VARIANTS,
    badge: { tr: 'En çok tercih edilen', en: 'Best seller' },
    maxQuantity: 10,
  },
  {
    id: 'kolye-nfc',
    kind: 'necklace',
    physical: true,
    nfc: true,
    requiresAccount: true,
    price: { TRY: 59900, USD: 3200 },
    compareAt: { TRY: 74900 },
    name: { tr: 'NFC + QR Anı Kolyesi', en: 'NFC + QR Memory Necklace' },
    tagline: {
      tr: 'Telefonu dokundurmak yeter — QR de yedekte.',
      en: 'Just tap a phone — with a QR as backup.',
    },
    description: {
      tr: 'Pleksi kolye ucunda gizli bir NFC çip ve QR kod bulunur. Telefonu kolyeye yaklaştırmak içeriği açar; NFC olmayan telefonlarda QR ile açılır. Çip, senin QR sayfana programlanmış ve kilitlenmiş şekilde gelir.',
      en: 'An acrylic pendant with a hidden NFC chip plus a QR code. Tapping a phone opens your content; phones without NFC can scan the QR. The chip arrives programmed and locked to your page.',
    },
    features: {
      tr: ['Dokun-aç NFC çip', 'QR yedeği', 'Pil gerektirmez', 'iPhone ve Android uyumlu', 'Neon renkli damla baskı'],
      en: ['Tap-to-open NFC chip', 'QR backup', 'No battery needed', 'Works with iPhone & Android', 'Glossy neon dome print'],
    },
    variants: NEON_VARIANTS,
    badge: { tr: 'Yeni · NFC', en: 'New · NFC' },
    maxQuantity: 10,
  },
  {
    id: 'anahtarlik-qr',
    kind: 'keychain',
    physical: true,
    nfc: false,
    requiresAccount: true,
    price: { TRY: 34900, USD: 1900 },
    compareAt: { TRY: 44900 },
    name: { tr: 'Sesli Anahtarlık', en: 'Voice Keychain' },
    tagline: {
      tr: 'Her gün yanında taşınan bir ses.',
      en: 'A voice you carry every day.',
    },
    description: {
      tr: "Pleksi anahtarlık, neon renkli damla baskı ve üzerinde sana özel QR kod. Sevdiğinin sesi, birlikte çekilmiş bir video ya da kaybolursa ulaşılacak acil iletişim bilgisi — hepsi tek QR'da.",
      en: "An acrylic keychain with a neon dome print and your own QR code. A loved one's voice, a shared video, or emergency contact info if it gets lost — all in one QR.",
    },
    features: {
      tr: ['Hafif pleksi gövde', 'Neon renkli parlak damla baskı', 'Kayıp durumunda acil iletişim bilgisi', 'İçeriği istediğin an güncelle'],
      en: ['Lightweight acrylic body', 'Glossy neon dome print', 'Emergency contact if lost', 'Update content any time'],
    },
    variants: NEON_VARIANTS,
    maxQuantity: 20,
  },
  {
    id: 'anahtarlik-nfc',
    kind: 'keychain',
    physical: true,
    nfc: true,
    requiresAccount: true,
    price: { TRY: 49900, USD: 2600 },
    compareAt: { TRY: 59900 },
    name: { tr: 'NFC + QR Anahtarlık', en: 'NFC + QR Keychain' },
    tagline: {
      tr: 'Dokun, dinle. Kamera bile açmana gerek yok.',
      en: 'Tap and listen. No camera needed.',
    },
    description: {
      tr: 'İçinde NFC çip, üzerinde QR kod bulunan anahtarlık. Telefonu dokundurmak içeriği anında açar. Kartvizit, evcil hayvan künyesi ya da hediye olarak idealdir.',
      en: 'A keychain with an NFC chip inside and a QR code on top. Tapping a phone opens the content instantly. Ideal as a digital business card, pet tag or gift.',
    },
    features: {
      tr: ['Dokun-aç NFC çip', 'QR yedeği', 'Programlanmış ve kilitli gelir', 'Neon renkli damla baskı'],
      en: ['Tap-to-open NFC chip', 'QR backup', 'Arrives programmed & locked', 'Glossy neon dome print'],
    },
    variants: NEON_VARIANTS,
    badge: { tr: 'Yeni · NFC', en: 'New · NFC' },
    maxQuantity: 20,
  },
  {
    id: 'ani-defteri',
    kind: 'guestbook',
    physical: false,
    nfc: false,
    requiresAccount: true,
    price: { TRY: 49900, USD: 2900 },
    compareAt: { TRY: 79900 },
    name: { tr: 'Dijital Anı Defteri', en: 'Audio & Video Guestbook' },
    tagline: {
      tr: 'Düğün, doğum günü, veda — misafirlerin sesini topla.',
      en: 'Weddings, birthdays, farewells — collect your guests\' voices.',
    },
    description: {
      tr: 'Masalara koyacağın tek bir QR ile misafirlerin sesli mesaj, video, fotoğraf ve yazılı anı bırakır. Hepsini onaylar, saklar ve istediğin zaman dinlersin. Yazdırılabilir masa kartı şablonları dahil.',
      en: 'One QR on your tables lets guests leave voice messages, videos, photos and written notes. You approve, keep and replay them any time. Printable table-card templates included.',
    },
    features: {
      tr: ['Sınırsız misafir, 300 anıya kadar', 'Ses, video, fotoğraf ve yazı', 'Onay (moderasyon) ve PIN koruması', 'Yazdırılabilir masa kartları', 'Uygulama gerekmez'],
      en: ['Unlimited guests, up to 300 memories', 'Voice, video, photo & text', 'Approval (moderation) & PIN protection', 'Printable table cards', 'No app needed'],
    },
    badge: { tr: 'Düğün sezonu', en: 'Wedding favourite' },
    maxQuantity: 5,
  },
  {
    id: 'dijital-qr',
    kind: 'digital',
    physical: false,
    nfc: false,
    requiresAccount: true,
    price: { TRY: 24900, USD: 700 },
    name: { tr: 'Dijital QR Hakkı', en: 'Digital QR Credit' },
    tagline: {
      tr: 'Kendi ürününe, kartına ya da etiketine bas.',
      en: 'Print it on your own product, card or label.',
    },
    description: {
      tr: 'Hesabına anında tanımlanan QR hakkı. QR\'ı indirip kendi tebrik kartına, hediye paketine ya da ürününe basabilirsin.',
      en: 'A QR credit added to your account instantly. Download the QR and print it on your own greeting card, gift wrap or product.',
    },
    features: {
      tr: ['Hesaba anında tanımlanır', 'PNG/SVG yüksek çözünürlük indirme', 'Ses, video, fotoğraf ve link', 'İstediğin zaman güncelle'],
      en: ['Added to your account instantly', 'High-res PNG/SVG download', 'Voice, video, photo & links', 'Update any time'],
    },
    maxQuantity: 50,
  },
]

export const SHIPPING = {
  TRY: { flat: 0, freeAbove: 0 },
  USD: { flat: 900, freeAbove: 6000 },
}

export function getProduct(id: string): Product | null {
  return PRODUCTS.find((product) => product.id === id) || null
}

export function currencyForLang(lang: Lang): Currency {
  return lang === 'en' ? 'USD' : 'TRY'
}

export function formatMoney(amount: number, currency: Currency) {
  const value = amount / 100
  if (currency === 'TRY') {
    return `${value.toLocaleString('tr-TR', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} TL`
  }
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: value % 1 === 0 ? 0 : 2 })
}

export interface CartLine {
  productId: ProductId
  variantId?: string | null
  quantity: number
}

export interface PricedLine {
  productId: ProductId
  variantId: string | null
  variantLabel: string | null
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  physical: boolean
  requiresAccount: boolean
}

export interface PricedCart {
  currency: Currency
  lines: PricedLine[]
  subtotal: number
  shipping: number
  total: number
  hasPhysical: boolean
  requiresAccount: boolean
}

/** Sepeti katalogdan yeniden fiyatlar; geçersiz satırları atar. */
export function priceCart(lines: CartLine[], currency: Currency, lang: Lang): PricedCart {
  const priced: PricedLine[] = []

  for (const line of lines.slice(0, 20)) {
    const product = getProduct(String(line.productId))
    if (!product) continue

    const quantity = Math.min(Math.max(1, Math.floor(Number(line.quantity) || 1)), product.maxQuantity)
    const variant = product.variants?.find((item) => item.id === line.variantId) || product.variants?.[0] || null
    const unitPrice = product.price[currency]

    priced.push({
      productId: product.id,
      variantId: variant?.id || null,
      variantLabel: variant ? variant.label[lang] : null,
      name: product.name[lang],
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      physical: product.physical,
      requiresAccount: product.requiresAccount,
    })
  }

  const subtotal = priced.reduce((sum, line) => sum + line.lineTotal, 0)
  const hasPhysical = priced.some((line) => line.physical)
  const shippingRule = SHIPPING[currency]
  const shipping = hasPhysical && !(shippingRule.freeAbove > 0 && subtotal >= shippingRule.freeAbove) ? shippingRule.flat : 0

  return {
    currency,
    lines: priced,
    subtotal,
    shipping,
    total: subtotal + shipping,
    hasPhysical,
    requiresAccount: priced.some((line) => line.requiresAccount),
  }
}
