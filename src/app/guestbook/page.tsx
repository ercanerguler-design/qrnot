import type { Metadata } from 'next'
import Link from 'next/link'
import ProductArt from '@/components/warm/ProductArt'
import { WarmPage } from '@/components/warm/SiteChrome'
import { formatMoney, getProduct } from '@/lib/commerce/catalog'
import { getRequestLang } from '@/lib/i18n.server'
import { withLang } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Dijital Anı Defteri — Düğün ve Etkinlikler için Sesli Anı Defteri',
  description: 'Misafirlerin tek QR ile sesli mesaj, video, fotoğraf ve yazılı anı bıraksın. Düğün, nişan, doğum günü ve veda için dijital anı defteri.',
  alternates: { canonical: '/guestbook', languages: { 'tr-TR': '/guestbook', 'en-US': '/guestbook?lang=en' } },
}

const T = {
  tr: {
    chip: '📖 Dijital Anı Defteri',
    title: 'Misafirlerinin sesi, yıllar sonra bile seninle.',
    desc: 'Düğün, nişan, kına, doğum günü, emeklilik ya da veda… Masalara koyduğun tek bir QR ile misafirlerin sesli mesaj, video, fotoğraf ve yazılı anı bırakır. Uygulama yok, kurulum yok.',
    cta: 'Anı defteri al',
    how: 'Nasıl çalışır?',
    steps: [
      ['Satın al', "Ödeme sonrası anı defteri QR'ın hesabında hazır olur."],
      ['Kur', "Etkinlik adını, karşılama notunu ve istersen PIN'i belirle. Masa kartlarını yazdır."],
      ['Topla', 'Misafirler okutup anı bırakır. Sen onaylar, dinler, indirirsin.'],
    ],
    features: [
      ['🎙️', 'Ses, video, fotoğraf, yazı', 'Misafir istediği formatta anı bırakır.'],
      ['✅', 'Onay sistemi', 'Anılar sen onaylayınca görünür; istemediğini silersin.'],
      ['🔐', 'PIN koruması', "Sadece masa kartındaki PIN'i bilen misafirler yazabilir."],
      ['🖨️', 'Masa kartları', 'Yazdırılabilir, şık masa kartları hazır gelir.'],
      ['⬇️', 'İndir & sakla', 'Tüm anıları tek tek indirip arşivleyebilirsin.'],
      ['📱', 'Uygulama yok', 'Misafir telefon kamerasıyla okutur, tarayıcıda anı bırakır.'],
    ],
    compare: 'Ses kayıt telefonu kiralamaya göre',
    compareItems: ['Kurulum ve iade derdi yok', 'Video ve fotoğraf da toplar', 'Aynı anda yüzlerce misafir', 'Çok daha uygun fiyat'],
    price: 'Tek seferlik',
  },
  en: {
    chip: '📖 Audio & Video Guestbook',
    title: "Your guests' voices — still with you years from now.",
    desc: 'Weddings, engagements, birthdays, retirements or farewells… One QR on your tables lets guests leave voice messages, videos, photos and written notes. No app, no setup.',
    cta: 'Get the guestbook',
    how: 'How it works',
    steps: [
      ['Buy', 'Your guestbook QR is ready in your account right after payment.'],
      ['Set up', 'Add your event name, a welcome note and an optional PIN. Print the table cards.'],
      ['Collect', 'Guests scan and leave memories. You approve, listen and download.'],
    ],
    features: [
      ['🎙️', 'Voice, video, photo, text', 'Guests leave memories in any format.'],
      ['✅', 'Approval', "Memories appear only after you approve; delete what you don't want."],
      ['🔐', 'PIN protection', 'Only guests with the PIN on the table card can post.'],
      ['🖨️', 'Table cards', 'Elegant printable table cards included.'],
      ['⬇️', 'Download & keep', 'Download every memory and archive it.'],
      ['📱', 'No app', 'Guests scan with their camera and post in the browser.'],
    ],
    compare: 'Compared to renting an audio guestbook phone',
    compareItems: ['No shipping or returns', 'Collects video and photos too', 'Hundreds of guests at once', 'A fraction of the price'],
    price: 'One-time',
  },
}

export default async function GuestbookLanding({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getRequestLang((await searchParams).lang)
  const t = T[lang]
  const product = getProduct('ani-defteri')!
  const currency = lang === 'en' ? 'USD' : 'TRY'

  return (
    <WarmPage lang={lang}>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="w-chip w-chip-gold">{t.chip}</span>
          <h1 className="font-display mt-5 text-4xl font-semibold leading-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-2">{t.desc}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={withLang('/shop/ani-defteri', lang)} className="w-btn w-btn-primary px-7 py-4 text-base">
              {t.cta} · {formatMoney(product.price[currency], currency)}
            </Link>
            <span className="text-sm text-muted">{t.price}</span>
          </div>
        </div>
        <ProductArt kind="guestbook" className="w-card mx-auto w-full max-w-sm" />
      </section>

      <section className="bg-paper py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-semibold">{t.how}</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {t.steps.map(([title, desc], index) => (
              <li key={title} className="w-card-soft p-6">
                <span className="font-display text-4xl text-coral">{index + 1}</span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-2">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map(([icon, title, desc]) => (
            <div key={title} className="w-card p-5">
              <span className="text-2xl">{icon}</span>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-2">{desc}</p>
            </div>
          ))}
        </div>
        <div className="w-card-soft mt-10 p-8">
          <h2 className="font-display text-2xl font-semibold">{t.compare}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {t.compareItems.map((item) => (
              <li key={item} className="flex items-center gap-2 text-ink-2">
                <span className="text-sage">✓</span> {item}
              </li>
            ))}
          </ul>
          <Link href={withLang('/shop/ani-defteri', lang)} className="w-btn w-btn-primary mt-6">
            {t.cta} →
          </Link>
        </div>
      </section>
    </WarmPage>
  )
}
