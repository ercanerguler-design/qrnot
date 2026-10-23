import type { Metadata } from 'next'
import ProductCard from '@/components/warm/ProductCard'
import ProductArt from '@/components/warm/ProductArt'
import { WarmPage } from '@/components/warm/SiteChrome'
import { PRODUCTS } from '@/lib/commerce/catalog'
import { getRequestLang } from '@/lib/i18n.server'
import { pageMeta } from '@/lib/seo'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  return pageMeta((await searchParams).lang, "/nfc", {
    tr: { title: "NFC Kolye ve NFC Anahtarlık — Dokun, Dinle", description: "NFC çipli sesli kolye ve anahtarlık. Telefonu dokundurmak yeterli; QR yedeği ile her telefonda çalışır." },
    en: { title: "NFC Necklace & NFC Keychain — Tap and Listen", description: "Voice message necklace and keychain with an NFC chip. Just tap a phone; the QR backup works on every phone." },
  })
}

const T = {
  tr: {
    chip: '📶 NFC + QR',
    title: 'Dokun, dinle. Kamera bile gerekmez.',
    desc: "NFC modellerimizde gizli bir çip var. Telefonu kolyeye ya da anahtarlığa yaklaştırmak sesini, videonu ya da fotoğraflarını anında açar. Arka yüzdeki QR ise NFC'si olmayan telefonlar için yedek.",
    how: 'NFC nasıl çalışır?',
    steps: [
      ['Pil yok, şarj yok', 'NFC çipi enerjisini telefondan alır; ömür boyu çalışır.'],
      ['Dokunmak yeterli', "iPhone XS ve sonrası ile NFC'si açık Android telefonlar etiketi otomatik okur."],
      ['Kilitli ve güvenli', 'Çip senin sayfana programlanmış ve kilitli gelir; başkası değiştiremez.'],
      ['Çip değişmez, içerik güncellenir', 'Çip hep aynı adresi açar; mesajını sonradan güncelleyebilirsin (3 kayıt dahil).'],
    ],
    compat: 'Uyumluluk',
    compatRows: [
      ['iPhone XS, XR ve sonrası', 'Ekran açıkken üst kısmı dokundur'],
      ['iPhone 7 – X', 'Denetim Merkezi → NFC Etiket Okuyucu'],
      ['Android (NFC açık)', 'Telefonun arka ortasını dokundur'],
      ["NFC'siz telefonlar", "Arkadaki QR'ı kamerayla okut"],
    ],
    own: 'Kendi NFC etiketini mi bağlamak istiyorsun?',
    ownDesc:
      'Elindeki NTAG213/215/216 etiketleri, sticker veya kartları da QR\'ına bağlayabilirsin: QR yönetim panelinde "NFC etiketine yaz" bölümünü kullan (Android + Chrome) ya da iPhone\'da NFC Tools uygulamasıyla yaz.',
    products: 'NFC ürünler',
  },
  en: {
    chip: '📶 NFC + QR',
    title: 'Tap and listen. No camera needed.',
    desc: 'Our NFC models have a hidden chip. Holding a phone near the necklace or keychain instantly opens your voice, video or photos. The QR on the back is a backup for phones without NFC.',
    how: 'How NFC works',
    steps: [
      ['No battery, no charging', 'The chip is powered by the phone — it works for life.'],
      ['Just tap', 'iPhone XS and newer, and Android phones with NFC on, read the tag automatically.'],
      ['Locked & secure', 'The chip arrives programmed and locked to your page; nobody else can change it.'],
      ['Same chip, updatable content', 'The chip always opens the same address; you can update your message later (3 recordings included).'],
    ],
    compat: 'Compatibility',
    compatRows: [
      ['iPhone XS, XR and newer', 'Tap the top edge with the screen on'],
      ['iPhone 7 – X', 'Control Center → NFC Tag Reader'],
      ['Android (NFC on)', "Tap the middle of the phone's back"],
      ['Phones without NFC', 'Scan the QR on the back with the camera'],
    ],
    own: 'Want to link your own NFC tag?',
    ownDesc:
      'You can link your own NTAG213/215/216 tags, stickers or cards to your QR: use "Write to an NFC tag" in your QR owner panel (Android + Chrome), or write it with the NFC Tools app on iPhone.',
    products: 'NFC products',
  },
}

export default async function NfcPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getRequestLang((await searchParams).lang)
  const t = T[lang]
  const nfcProducts = PRODUCTS.filter((p) => p.nfc)

  return (
    <WarmPage lang={lang}>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="w-chip w-chip-sage">{t.chip}</span>
          <h1 className="font-display mt-5 text-4xl font-semibold leading-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-2">{t.desc}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ProductArt kind="necklace" nfc variant="neon-orange" className="w-card aspect-square w-full" />
          <ProductArt kind="keychain" nfc variant="neon-pink" className="w-card mt-8 aspect-square w-full" />
        </div>
      </section>

      <section className="bg-paper py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-semibold">{t.how}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.steps.map(([title, desc]) => (
              <div key={title} className="w-card-soft p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display mb-6 text-3xl font-semibold">{t.products}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {nfcProducts.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 lg:grid-cols-2">
        <div className="w-card p-6">
          <h2 className="font-display text-2xl font-semibold">{t.compat}</h2>
          <dl className="mt-4 divide-y divide-line text-sm">
            {t.compatRows.map(([device, how]) => (
              <div key={device} className="flex justify-between gap-4 py-3">
                <dt className="font-semibold">{device}</dt>
                <dd className="text-right text-ink-2">{how}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="w-card-soft p-6">
          <h2 className="font-display text-2xl font-semibold">{t.own}</h2>
          <p className="mt-3 text-ink-2">{t.ownDesc}</p>
        </div>
      </section>
    </WarmPage>
  )
}
