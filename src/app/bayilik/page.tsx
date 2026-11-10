import type { Metadata } from 'next'
import Link from 'next/link'
import { WarmPage } from '@/components/warm/SiteChrome'
import ProductArt from '@/components/warm/ProductArt'
import { formatMoney } from '@/lib/commerce/catalog'
import {
  DEALER_DPP_DISCOUNT,
  DEALER_MIN_QTY,
  DEALER_PRODUCT_DISCOUNT,
  DPP_DEALER_PLANS,
  dealerProducts,
  dealerUnitPrice,
  dppDealerEur,
} from '@/lib/dealersShared'
import { getRequestLang } from '@/lib/i18n.server'
import { pageMeta } from '@/lib/seo'
import { whatsappHref } from '@/lib/site'
import DealerApplyForm from './DealerApplyForm'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  return pageMeta((await searchParams).lang, '/bayilik', {
    tr: {
      title: 'QRNot Bayilik — Sesli Mesajlı Hediye ve DPP Bayiliği',
      description: `QRNot bayisi olun: sesli mesajlı kolye, anahtarlık, dijital anı defteri ve QR ürünlerinde %${DEALER_PRODUCT_DISCOUNT * 100}, QRNot DPP paketlerinde %${DEALER_DPP_DISCOUNT * 100} bayi indirimi. En az ${DEALER_MIN_QTY} adet, kart ya da havale ile ödeme.`,
    },
    en: {
      title: 'QRNot Reseller Program',
      description: `Become a QRNot reseller in Türkiye: ${DEALER_PRODUCT_DISCOUNT * 100}% off voice-message gifts and ${DEALER_DPP_DISCOUNT * 100}% off QRNot DPP plans.`,
    },
  })
}

const pctP = Math.round(DEALER_PRODUCT_DISCOUNT * 100)
const pctD = Math.round(DEALER_DPP_DISCOUNT * 100)
const eur = (n: number) => `€${n.toLocaleString('tr-TR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`

const WHO = [
  ['💐', 'Çiçekçiler', 'Çiçeğin yanına sesli mesaj: kartın yerini alan bir ek satış.'],
  ['🎁', 'Hediyelik eşya ve butikler', 'Yılbaşı, sevgililer günü, anneler günü rafında herkesin elini uzattığı ürün.'],
  ['💍', 'Kuyumcu ve takı mağazaları', 'Takının yanına sesli bir anı; sepet tutarını büyüten tamamlayıcı ürün.'],
  ['🧁', 'Pastane ve çikolatacılar', 'Dijital QR’ı kendi kartınıza basın; kutuya müşterinin sesini koyun.'],
  ['💒', 'Düğün ve organizasyon', 'Dijital anı defterini paketlerinize ekleyin; misafirler sesli anı bıraksın.'],
  ['🖨️', 'Matbaa ve davetiyeciler', 'Davetiye ve kartlara sesli / videolu QR ekleyerek fiyatınızı yükseltin.'],
  ['🏢', 'Promosyon ajansları', 'Kurumsal müşterilerinize yöneticinin sesli teşekkürünü taşıyan yıl sonu hediyesi.'],
  ['🛂', 'Dış ticaret ve DPP danışmanları', 'İhracatçı müşterilerinize AB Dijital Ürün Pasaportu yazılımını %35 indirimle sunun.'],
]

const STEPS = [
  ['Başvurun', 'Formu doldurun; firma ve vergi bilgileriniz faturalar için gerekli.'],
  ['2 iş gününde onay', 'Başvurunuzu inceleyip e-postayla dönüyoruz. Onayla birlikte bayi paneliniz açılır.'],
  ['Panelden sipariş verin', `En az ${DEALER_MIN_QTY} adet; ürün ve renkleri seçin, kredi kartı ya da havale ile ödeyin.`],
  ['Satın, kazanın', 'Ürünler kurulumsuz gelir; müşteriniz kendi sesini telefonundan kaydeder.'],
]

const FAQ = [
  ['Müşterim ürünü nasıl kullanıyor?', 'Ürünün üzerindeki QR’ı telefon kamerasıyla okutup kendi sesini, videosunu ya da fotoğrafını yüklüyor. Uygulama gerekmiyor; hediyeyi alan kişi de aynı QR’ı okutup dinliyor.'],
  ['Farklı ürünleri aynı siparişte birleştirebilir miyim?', `Evet. ${DEALER_MIN_QTY} adetlik alt sınır, siparişteki tüm ürünlerin toplamına göre hesaplanır; renkleri de dilediğiniz gibi karıştırabilirsiniz.`],
  ['Ödemeyi nasıl yapıyorum?', 'Bayi panelinden kredi kartıyla (PayTR güvenli ödeme) ya da havale / EFT ile. Havalede ödemeniz hesabımıza geçince siparişiniz hazırlanır.'],
  ['DPP bayiliği nasıl işliyor?', `İhracatçı müşteriniz için panelden DPP paket talebi oluşturursunuz. Paket liste fiyatından %${pctD} indirimle size faturalanır; müşterinizin pasaport paneli QRNot tarafından kurulur.`],
  ['Ürünleri hangi fiyata satmalıyım?', 'Önerilen satış fiyatı sitedeki fiyattır. Satış fiyatınızı kendiniz belirlersiniz.'],
]

export default async function DealerPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getRequestLang((await searchParams).lang)
  const products = dealerProducts()
  const necklace = products.find((p) => p.id === 'kolye-qr')!
  const exUnit = dealerUnitPrice(necklace.price.TRY)
  const exBuy = exUnit * DEALER_MIN_QTY
  const exSell = necklace.price.TRY * DEALER_MIN_QTY

  return (
    <WarmPage lang={lang}>
      {/* Giriş */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-2">QRNot bayilik programı</p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Hediyenin içine ses. Rafınızda yeni bir ürün.</h1>
            <p className="mt-4 max-w-xl text-lg text-ink-2">
              Sesli mesajlı kolye, anahtarlık, dijital anı defteri ve QR ürünlerini bayi fiyatıyla alın, kendi müşterinize satın. İhracatçı müşterileriniz için QRNot DPP’yi de sunabilirsiniz.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#basvuru" className="w-btn w-btn-primary">
                Bayilik başvurusu yap
              </a>
              <Link href="/bayi" className="w-btn w-btn-ghost">
                Bayi girişi
              </Link>
              <a href={whatsappHref('Merhaba QRNot, bayilik hakkında bilgi almak istiyorum.')} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-ghost">
                WhatsApp’tan sor
              </a>
            </div>
          </div>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4" aria-hidden="true">
            {products.map((p, i) => (
              <div key={p.id} className={`w-card overflow-hidden ${i % 2 ? 'translate-y-6' : ''}`}>
                <ProductArt kind={p.kind} nfc={p.nfc} className="aspect-square w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dört temel şart */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [`%${pctP}`, 'Ürünlerde bayi indirimi', 'Site fiyatından'],
            [`%${pctD}`, 'QRNot DPP paketlerinde', 'Liste fiyatından'],
            [`${DEALER_MIN_QTY} adet`, 'En az sipariş', 'Ürünler birlikte sayılır'],
            ['Kart + havale', 'Ödeme', 'PayTR güvenli ödeme ya da EFT'],
          ].map(([big, label, sub]) => (
            <div key={label} className="w-card p-5">
              <p className="font-display text-3xl font-semibold text-coral-2 sm:text-4xl">{big}</p>
              <p className="mt-2 font-semibold">{label}</p>
              <p className="text-sm text-muted">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kimler */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display text-3xl font-semibold">Kimler bayi olabilir?</h2>
        <p className="mt-2 max-w-2xl text-ink-2">Hediye, etkinlik ya da ihracat müşterisiyle çalışan her işletme.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHO.map(([icon, title, desc]) => (
            <div key={title} className="w-card p-5">
              <span className="text-2xl" aria-hidden="true">
                {icon}
              </span>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fiyatlar */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="w-card p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">Ürün bayi fiyatları</h2>
            <p className="mt-1 text-sm text-muted">Birim fiyat, KDV dahil. Site fiyatından %{pctP} indirim, tam liraya yuvarlanır.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="py-2 pr-3 font-semibold">Ürün</th>
                    <th className="py-2 pr-3 text-right font-semibold">Site fiyatı</th>
                    <th className="py-2 pr-3 text-right font-semibold">Bayi fiyatı</th>
                    <th className="py-2 text-right font-semibold">Adet başı kazanç</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const unit = dealerUnitPrice(p.price.TRY)
                    return (
                      <tr key={p.id} className="border-b border-line last:border-0">
                        <td className="py-3 pr-3">
                          <span className="flex items-center gap-3">
                            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-2">
                              <ProductArt kind={p.kind} nfc={p.nfc} className="h-full w-full" />
                            </span>
                            <span className="font-semibold">{p.name.tr}</span>
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-right text-ink-2">{formatMoney(p.price.TRY, 'TRY')}</td>
                        <td className="py-3 pr-3 text-right font-semibold text-coral-2">{formatMoney(unit, 'TRY')}</td>
                        <td className="py-3 text-right text-sage">+{formatMoney(p.price.TRY - unit, 'TRY')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="w-alert w-alert-info mt-5 text-sm">
              Örnek: {DEALER_MIN_QTY} {necklace.name.tr} alış {formatMoney(exBuy, 'TRY')}, site fiyatıyla satış {formatMoney(exSell, 'TRY')}. Brüt kazancınız{' '}
              <b>{formatMoney(exSell - exBuy, 'TRY')}</b>.
            </div>
          </div>

          <div className="w-card-soft p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">QRNot DPP bayi fiyatları</h2>
            <p className="mt-1 text-sm text-muted">AB Dijital Ürün Pasaportu yazılımı. Euro, KDV hariç; liste fiyatından %{pctD} indirim.</p>
            <ul className="mt-5 divide-y divide-line">
              {DPP_DEALER_PLANS.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-3 py-3 tabular-nums">
                  <span>
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted">{p.scope}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold text-coral-2">
                      {eur(dppDealerEur(p.eur))}
                      <span className="text-xs font-normal text-muted">{p.per === 'once' ? ' tek sefer' : p.per === 'month' ? ' / ay' : ' / ay’dan'}</span>
                    </span>
                    <span className="block text-xs text-muted line-through">{eur(p.eur)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">DPP’de alt sipariş sınırı yoktur. Türkiye’de fatura günün kuruyla TL olarak kesilir.</p>
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display text-3xl font-semibold">Nasıl çalışır?</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, desc], i) => (
            <li key={title} className="w-card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">{i + 1}</span>
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-ink-2">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Şartlar + SSS */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div id="sartlar" className="w-card scroll-mt-24 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">Bayilik satış şartları</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-2">
              <li>• Ürünlerde bayi fiyatı, sitedeki güncel satış fiyatından %{pctP} indirimlidir (KDV dahil). Siparişte geçerli olan fiyat, siparişin verildiği andaki fiyattır.</li>
              <li>• Ürün siparişi en az {DEALER_MIN_QTY} adettir; farklı ürün ve renkler birlikte sayılır.</li>
              <li>• Ödeme kredi kartı (PayTR) ya da havale / EFT ile peşin yapılır. Havalede açıklamaya sipariş numarası yazılır; sipariş, ödeme hesabımıza geçince hazırlanır.</li>
              <li>• Kargo ücreti alıcıya aittir ve teslimatta kargo firmasına ödenir.</li>
              <li>• Faturalar başvuruda bildirilen firma ve vergi bilgilerine kesilir.</li>
              <li>• QRNot DPP paketlerinde bayi fiyatı liste fiyatından %{pctD} indirimlidir (euro, KDV hariç; Türkiye’de günün kuruyla TL faturalanır).</li>
              <li>• Dijital ürünler (dijital QR hakkı, anı defteri) ödeme onayıyla bayinin QRNot hesabına tanımlanır.</li>
              <li>• Bayi, QRNot markasını ürünlerin tanıtımı için kullanabilir; markanın adını taşıyan alan adı, sosyal medya hesabı ya da reklam hesabı açamaz.</li>
              <li>• QRNot başvuruları değerlendirme, bayi oranlarını ileride değiştirme ve şartlara uymayan bayiliği askıya alma hakkını saklı tutar. Oran değişikliği verilmiş siparişleri etkilemez.</li>
            </ul>
          </div>
          <div className="w-card p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">Sık sorulanlar</h2>
            <div className="mt-4 divide-y divide-line">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-3">
                  <summary className="cursor-pointer list-none font-semibold">
                    <span className="mr-2 inline-block text-coral-2 transition group-open:rotate-45">+</span>
                    {q}
                  </summary>
                  <p className="mt-2 pl-5 text-sm text-ink-2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Başvuru */}
      <section id="basvuru" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 pt-8">
        <h2 className="font-display text-3xl font-semibold">Bayilik başvuru formu</h2>
        <p className="mt-2 text-ink-2">2 dakika sürer. En geç 2 iş günü içinde e-postayla dönüş yapıyoruz.</p>
        <div className="mt-6">
          <DealerApplyForm />
        </div>
      </section>
    </WarmPage>
  )
}
