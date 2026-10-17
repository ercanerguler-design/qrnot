import { Suspense } from 'react'
import Link from 'next/link'
import { CartButton, LangSwitch } from '@/components/warm/HeaderClient'
import { withLang, type Lang } from '@/lib/i18n'
import { COMPANY, MARKETPLACES, whatsappHref } from '@/lib/site'

const NAV = {
  tr: [
    { href: '/shop', label: 'Ürünler' },
    { href: '/#nasil-calisir', label: 'Nasıl çalışır?' },
    { href: '/guestbook', label: 'Anı Defteri' },
    { href: '/nfc', label: 'NFC' },
    { href: '/#kurumsal', label: 'Kurumsal' },
  ],
  en: [
    { href: '/shop', label: 'Shop' },
    { href: '/#nasil-calisir', label: 'How it works' },
    { href: '/guestbook', label: 'Guestbook' },
    { href: '/nfc', label: 'NFC' },
    { href: '/etsy', label: 'Etsy buyers' },
  ],
}

export function Logo({ lang }: { lang: Lang }) {
  return (
    <Link href={withLang('/', lang)} className="inline-flex items-center gap-2" aria-label="QRNot">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-coral text-white shadow-[0_6px_16px_-6px_rgba(232,80,91,0.7)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold text-ink">QRNot</span>
    </Link>
  )
}

export function SiteHeader({ lang }: { lang: Lang }) {
  const items = NAV[lang]
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Logo lang={lang} />
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-2 md:flex" aria-label={lang === 'en' ? 'Main' : 'Ana menü'}>
          {items.map((item) => (
            <Link key={item.href} href={withLang(item.href, lang)} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <LangSwitch lang={lang} />
          </Suspense>
          <Link href={withLang('/account', lang)} className="w-btn w-btn-ghost w-btn-sm hidden sm:inline-flex">
            {lang === 'en' ? 'My account' : 'Hesabım'}
          </Link>
          <CartButton lang={lang} />
        </div>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-4 pb-2 text-sm font-medium text-ink-2 md:hidden" aria-label={lang === 'en' ? 'Main mobile' : 'Mobil menü'}>
        {items.map((item) => (
          <Link key={item.href} href={withLang(item.href, lang)} className="whitespace-nowrap hover:text-ink">
            {item.label}
          </Link>
        ))}
        <Link href={withLang('/account', lang)} className="whitespace-nowrap hover:text-ink sm:hidden">
          {lang === 'en' ? 'Account' : 'Hesabım'}
        </Link>
      </nav>
    </header>
  )
}

const FOOTER = {
  tr: {
    shop: 'Alışveriş',
    help: 'Yardım',
    legal: 'Yasal',
    company: 'Şirket',
    tagline: 'Hediyene bir ses ver. Kolye ve anahtarlıklarda kalıcı sesli anılar.',
    links: {
      shop: [
        ['/shop', 'Tüm ürünler'],
        ['/shop/kolye-qr', 'Sesli kolye'],
        ['/shop/anahtarlik-qr', 'Sesli anahtarlık'],
        ['/guestbook', 'Dijital anı defteri'],
        ['/nfc', 'NFC ürünler'],
      ],
      help: [
        ['/#sss', 'Sık sorulan sorular'],
        ['/account', 'Hesabım / QR\'larım'],
        ['/etsy', 'Etsy aktivasyonu'],
        ['/partnerlik', 'Pazaryeri ortaklığı'],
      ],
      legal: [
        ['/legal/mesafeli-satis', 'Mesafeli satış sözleşmesi'],
        ['/legal/on-bilgilendirme', 'Ön bilgilendirme formu'],
        ['/legal/iade', 'İptal ve iade'],
        ['/legal/gizlilik', 'Gizlilik politikası'],
        ['/legal/kvkk', 'KVKK aydınlatma metni'],
        ['/legal/cerez', 'Çerez politikası'],
        ['/legal/kullanim', 'Kullanım koşulları'],
      ],
    },
    rights: 'Tüm hakları saklıdır.',
    pay: 'Güvenli ödeme: iyzico · Stripe · Havale/EFT',
    stores: 'Bizi ayrıca bulabileceğin yerler',
  },
  en: {
    shop: 'Shop',
    help: 'Help',
    legal: 'Legal',
    company: 'Company',
    tagline: 'Give your gift a voice. Lasting voice memories in necklaces and keychains.',
    links: {
      shop: [
        ['/shop', 'All products'],
        ['/shop/kolye-qr', 'Voice necklace'],
        ['/shop/anahtarlik-qr', 'Voice keychain'],
        ['/guestbook', 'Audio guestbook'],
        ['/nfc', 'NFC products'],
      ],
      help: [
        ['/#sss', 'FAQ'],
        ['/account', 'My account / QRs'],
        ['/etsy', 'Etsy activation'],
      ],
      legal: [
        ['/legal/terms', 'Terms of use'],
        ['/legal/privacy', 'Privacy policy'],
        ['/legal/refund', 'Refund policy'],
        ['/legal/cookies', 'Cookie policy'],
      ],
    },
    rights: 'All rights reserved.',
    pay: 'Secure payment: Stripe · iyzico',
    stores: 'ALSO FIND US ON',
  },
}

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = FOOTER[lang]
  const year = new Date().getFullYear()
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo lang={lang} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">{t.tagline}</p>
          <a
            href={whatsappHref(lang === 'en' ? 'Hello QRNot, I have a question.' : 'Merhaba QRNot, bir sorum var.')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-btn w-btn-whatsapp w-btn-sm mt-5"
          >
            WhatsApp {COMPANY.whatsappDisplay}
          </a>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-muted">{t.stores}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MARKETPLACES.map((store) => (
              <a
                key={store.id}
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-3 py-1.5 text-xs font-bold hover:border-ink-2"
                style={{ color: store.color }}
              >
                {store.name} ↗
              </a>
            ))}
          </div>
        </div>
        {(['shop', 'help', 'legal'] as const).map((group) => (
          <div key={group}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{t[group]}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {t.links[group].map(([href, label]) => (
                <li key={href}>
                  <Link href={withLang(href, lang)} className="text-ink-2 hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {COMPANY.legalName} · {COMPANY.address} · {COMPANY.email}
          </p>
          <p>{t.pay}</p>
        </div>
      </div>
    </footer>
  )
}

export function WarmPage({ lang, children, chrome = true }: { lang: Lang; children: React.ReactNode; chrome?: boolean }) {
  return (
    <div className="warm flex min-h-screen flex-col">
      {chrome && <SiteHeader lang={lang} />}
      <main className="flex-1">{children}</main>
      {chrome && <SiteFooter lang={lang} />}
    </div>
  )
}
